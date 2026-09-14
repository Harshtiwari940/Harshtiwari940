"""
Validate a Shopify theme the way Shopify's own upload validator does.

Covers what the earlier template-only check missed:
  - richtext values (top-level nodes must be <p>, <ul>, <ol>, <h1>-<h6>)
  - range values in config/settings_data.json, not just in templates
  - select / checkbox / color / number types everywhere
"""
import re, json, os, sys, glob

ROOT = sys.argv[1] if len(sys.argv) > 1 else '/home/user/Harshtiwari940'
RICHTEXT_TOP = re.compile(r'<(p|ul|ol|h[1-6])(\s[^>]*)?>', re.I)
problems = []


def schema_of(path):
    src = open(path, encoding='utf-8').read()
    m = re.search(r'\{%\s*schema\s*%\}(.*?)\{%\s*endschema\s*%\}', src, re.S)
    return json.loads(m.group(1)) if m else None


def richtext_ok(value):
    """Every top-level node must be <p>, <ul>, <ol> or <h1>-<h6>. Blank is fine."""
    s = (value or '').strip()
    if not s:
        return True, None
    # Schema defaults often hold a translation key, which Shopify resolves first.
    if s.startswith('t:'):
        return True, None
    pos = 0
    while pos < len(s):
        while pos < len(s) and s[pos].isspace():
            pos += 1
        if pos >= len(s):
            break
        m = RICHTEXT_TOP.match(s, pos)
        if not m:
            snippet = s[pos:pos + 40].replace('\n', ' ')
            return False, f'top-level content is not a permitted tag, starting at: {snippet!r}'
        tag = m.group(1).lower()
        # walk to this element's matching close tag, allowing same-tag nesting
        depth, cursor = 1, m.end()
        pattern = re.compile(rf'</?{tag}(\s[^>]*)?>', re.I)
        while depth and cursor < len(s):
            nxt = pattern.search(s, cursor)
            if not nxt:
                return False, f'<{tag}> is never closed'
            depth += -1 if nxt.group(0).startswith('</') else 1
            cursor = nxt.end()
        if depth:
            return False, f'<{tag}> is never closed'
        pos = cursor
    return True, None


def check(where, key, value, spec):
    t = spec.get('type')
    if t == 'richtext':
        ok, why = richtext_ok(value)
        if not ok:
            problems.append(f'{where} "{key}" (richtext): {why}')
    elif t == 'range':
        lo, hi, step = spec['min'], spec['max'], spec['step']
        if not isinstance(value, (int, float)):
            problems.append(f'{where} "{key}" (range): {value!r} is not a number')
        elif not (lo <= value <= hi):
            problems.append(f'{where} "{key}" (range): {value} outside {lo}-{hi}')
        elif round((value - lo) % step, 6) not in (0, step):
            valid = [lo + i * step for i in range(int((hi - lo) / step) + 1)]
            near = min(valid, key=lambda v: abs(v - value))
            problems.append(
                f'{where} "{key}" (range): {value} is not a step in {lo}-{hi} step {step} — nearest valid is {near}'
            )
    elif t == 'select':
        opts = [o['value'] for o in spec.get('options', [])]
        if str(value) not in opts:
            problems.append(f'{where} "{key}" (select): {value!r} not one of {opts}')
    elif t == 'checkbox':
        if not isinstance(value, bool) and value not in ('true', 'false'):
            problems.append(f'{where} "{key}" (checkbox): {value!r} is not a boolean')
    elif t == 'color':
        if value and not re.fullmatch(r'#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)', str(value).strip()):
            problems.append(f'{where} "{key}" (color): {value!r} is not a valid colour')
    elif t == 'number':
        if value not in (None, '') and not isinstance(value, (int, float)):
            problems.append(f'{where} "{key}" (number): {value!r} is not a number')


def flat(settings):
    return {s['id']: s for s in (settings or []) if s.get('id')}


# ---------------------------------------------------------- config/settings_data.json
schema_groups = json.load(open(f'{ROOT}/config/settings_schema.json', encoding='utf-8'))
global_specs = {}
for g in schema_groups:
    for st in g.get('settings', []):
        if st.get('id'):
            global_specs[st['id']] = st

data = json.load(open(f'{ROOT}/config/settings_data.json', encoding='utf-8'))
current = data.get('current', {})
STRUCTURAL = {'color_schemes', 'sections', 'content_for_index', 'blocks', 'order'}
for k, v in current.items():
    if k in STRUCTURAL:
        continue
    if k not in global_specs:
        problems.append(f'config/settings_data.json: "{k}" has no entry in settings_schema.json')
    else:
        check('config/settings_data.json', k, v, global_specs[k])

# colour schemes carry their own role settings
for sid, scheme in (current.get('color_schemes') or {}).items():
    for role, val in (scheme.get('settings') or {}).items():
        if role.endswith('gradient'):
            continue
        check(f'config/settings_data.json[{sid}]', role, val, {'type': 'color'})

# ---------------------------------------------------------- templates + section groups
targets = sorted(
    glob.glob(f'{ROOT}/templates/*.json')
    + glob.glob(f'{ROOT}/templates/customers/*.json')
    + glob.glob(f'{ROOT}/sections/*-group.json')
)
for tpl in targets:
    rel = os.path.relpath(tpl, ROOT)
    try:
        t = json.load(open(tpl, encoding='utf-8'))
    except Exception as e:
        problems.append(f'{rel}: invalid JSON — {e}')
        continue
    sections = t.get('sections', {})
    for sid in t.get('order', []):
        if sid not in sections:
            problems.append(f'{rel}: order lists "{sid}" which is not defined')
    for sid, sec in sections.items():
        stype = sec.get('type')
        path = f'{ROOT}/sections/{stype}.liquid'
        if not os.path.exists(path):
            problems.append(f'{rel}: section "{stype}" does not exist')
            continue
        sc = schema_of(path)
        if not sc:
            continue  # e.g. stock main-404 carries no schema
        specs = flat(sc.get('settings'))
        for k, v in (sec.get('settings') or {}).items():
            if k not in specs:
                problems.append(f'{rel}[{sid}/{stype}]: unknown setting "{k}"')
            else:
                check(f'{rel}[{sid}/{stype}]', k, v, specs[k])
        block_specs = {b['type']: flat(b.get('settings')) for b in sc.get('blocks', [])}
        blocks = sec.get('blocks') or {}
        maxb = sc.get('max_blocks')
        if maxb and len(blocks) > maxb:
            problems.append(f'{rel}[{sid}/{stype}]: {len(blocks)} blocks exceeds max_blocks {maxb}')
        for bid in (sec.get('block_order') or []):
            if bid not in blocks:
                problems.append(f'{rel}[{sid}/{stype}]: block_order lists "{bid}" which is not defined')
        for bid, blk in blocks.items():
            btype = blk.get('type')
            if btype not in block_specs:
                problems.append(f'{rel}[{sid}/{stype}]: unknown block type "{btype}"')
                continue
            for k, v in (blk.get('settings') or {}).items():
                if k not in block_specs[btype]:
                    problems.append(f'{rel}[{sid}/{stype}/{bid}]: unknown block setting "{k}"')
                else:
                    check(f'{rel}[{sid}/{stype}/{bid}]', k, v, block_specs[btype][k])

# ---------------------------------------------------------- section schema defaults
for path in sorted(glob.glob(f'{ROOT}/sections/*.liquid')):
    sc = schema_of(path)
    if not sc:
        continue
    rel = os.path.relpath(path, ROOT)
    for st in sc.get('settings', []) + [s for b in sc.get('blocks', []) for s in b.get('settings', [])]:
        if st.get('id') and 'default' in st:
            check(f'{rel} (schema default)', st['id'], st['default'], st)

if problems:
    print('\n'.join(f'  ✗ {p}' for p in problems))
    print(f'\n{len(problems)} problem(s)')
    sys.exit(1)
print(f'No problems. Checked settings_data.json + {len(targets)} template/group files + every section schema default.')
