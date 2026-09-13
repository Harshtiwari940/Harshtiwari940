/* ==========================================================================
   Simply Kids — <sk-quick-add> grid
   --------------------------------------------------------------------------
   Add-to-cart and quantity stepping directly on a product card, without
   leaving the collection page.

   Lifted out of the inline <script> that sat inside
   sections/main-collection-product-grid.liquid, with four fixes:

   · IT TELLS DAWN. The old version updated the cart icon bubble by hand but
     never published Dawn's `cart-update` event, so the cart drawer kept
     showing stale contents until a reload — and any other listener
     (including the sticky bar) missed the change entirely.

   · ERRORS ARE INLINE, NOT alert(). A sold-out or inventory error threw a
     browser alert box.

   · CLICKS ARE QUEUED. Tapping + three times fired three overlapping
     requests to /cart/change.js; whichever resolved last won, which was not
     always the last one clicked.

   · ONE FILE, NOT PER-SECTION MARKUP. Being an asset, it is cached across
     pages and can be reused by any section that renders sk-product-card.
   ========================================================================== */

if (!customElements.get('sk-quick-add')) {
  customElements.define(
    'sk-quick-add',
    class SkQuickAdd extends HTMLElement {
      connectedCallback() {
        this.addEventListener('click', this.onClick.bind(this));
        this.queue = Promise.resolve();
        this.syncFromCart();
      }

      get routes() {
        var r = window.routes || {};
        var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
        return {
          cart: root + 'cart.js',
          add: (r.cart_add_url || root + 'cart/add') + '.js',
          change: (r.cart_change_url || root + 'cart/change') + '.js',
        };
      }

      async syncFromCart() {
        try {
          const response = await fetch(this.routes.cart, { headers: { Accept: 'application/json' } });
          const cart = await response.json();

          const byVariant = {};
          cart.items.forEach((item) => {
            byVariant[item.variant_id] = (byVariant[item.variant_id] || 0) + item.quantity;
          });

          this.querySelectorAll('[data-sk-actions][data-variant-id]').forEach((el) => {
            this.renderState(el, byVariant[Number(el.dataset.variantId)] || 0);
          });
        } catch (e) {
          /* Cart unavailable — leave the ADD buttons in their server-rendered state. */
        }
      }

      renderState(actions, qty) {
        actions.dataset.qty = qty;
        actions.classList.toggle('is-in-cart', qty > 0);

        const stepper = actions.querySelector('[data-sk-qty]');
        if (stepper) stepper.classList.toggle('is-active', qty > 0);

        const value = actions.querySelector('[data-sk-qty-value]');
        if (value) value.textContent = qty > 0 ? qty : 1;
      }

      showError(actions, message) {
        let node = actions.parentElement.querySelector('[data-sk-error]');
        if (!node) {
          node = document.createElement('p');
          node.setAttribute('data-sk-error', '');
          node.setAttribute('role', 'alert');
          node.className = 'sk-pcard__error';
          node.style.cssText = 'color:#a82019;font-size:1.2rem;margin:.6rem 0 0;';
          actions.parentElement.appendChild(node);
        }
        node.textContent = message;
        clearTimeout(this._errorTimer);
        this._errorTimer = setTimeout(() => node.remove(), 6000);
      }

      onClick(event) {
        const btn = event.target.closest('[data-sk-action]');
        if (!btn) return;

        const actions = btn.closest('[data-sk-actions]');
        if (!actions) return;

        event.preventDefault();

        const action = btn.dataset.skAction;
        const current = Number(actions.dataset.qty) || 0;

        let next;
        if (action === 'add') next = current + 1;
        else if (action === 'plus') next = current + 1;
        else if (action === 'minus') next = Math.max(0, current - 1);
        else return;

        // Optimistic paint, so the stepper feels instant; reconciled on response.
        this.renderState(actions, next);

        // Serialise requests per grid so rapid taps resolve in click order.
        this.queue = this.queue.then(() =>
          this.setQuantity(actions, next, current === 0 && action === 'add')
        );
      }

      async setQuantity(actions, quantity, isAdd) {
        const variantId = Number(actions.dataset.variantId);
        actions.classList.add('is-busy');

        const body = isAdd
          ? { items: [{ id: variantId, quantity: 1 }], sections: 'cart-icon-bubble' }
          : { id: String(variantId), quantity: quantity, sections: 'cart-icon-bubble' };

        try {
          const response = await fetch(isAdd ? this.routes.add : this.routes.change, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(body),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.description || data.message || 'Could not update cart');
          }

          this.renderState(actions, quantity);
          this.updateCartBubble(data.sections);

          // Tell Dawn. The cart drawer, cart page and sticky bar all listen here.
          if (typeof publish === 'function' && typeof PUB_SUB_EVENTS !== 'undefined') {
            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'sk-quick-add',
              productVariantId: variantId,
              cartData: data,
            });
          }
        } catch (error) {
          this.showError(actions, error.message);
          this.syncFromCart();
        } finally {
          actions.classList.remove('is-busy');
        }
      }

      updateCartBubble(sections) {
        if (!sections || !sections['cart-icon-bubble']) return;

        const bubble = document.getElementById('cart-icon-bubble');
        if (!bubble) return;

        const parsed = new DOMParser().parseFromString(sections['cart-icon-bubble'], 'text/html');
        const inner = parsed.querySelector('.shopify-section');
        if (inner) bubble.innerHTML = inner.innerHTML;
      }
    }
  );
}
