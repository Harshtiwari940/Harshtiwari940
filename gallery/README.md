# Huddle 2026 photo gallery

Photos for the two gallery pages live here:

| Page                 | Folder for its photos |
| -------------------- | --------------------- |
| `Gallery-Day1.html`  | `gallery/day-1/`      |
| `Gallery-Day2.html`  | `gallery/day-2/`      |

## Adding photos

1. **Upload the image files** into the folder for that day. Use simple file
   names with no spaces, for example `photo-01.jpg`, `photo-02.jpg`.
2. **Open the page for that day** and find the `<ul class="photo-grid">` list.
   The comment just above it holds a ready made photo block: copy it, paste it
   inside the list, and change three things:
   * the file name in `href` and in `img src`
   * the `alt` text (a short description, read out by screen readers)
   * the caption, which appears twice: in `data-caption` and in `<figcaption>`
3. **Delete the "will be published here shortly" paragraph** under the list as
   soon as the first real photo is in place.

Repeat step 2 for every photo. Photos appear in the order the list items are
written in, so put them in the order you want visitors to see them.

## A photo block looks like this

```html
<li class="photo-item">
  <figure style="margin:0">
    <a class="photo-link"
       href="gallery/day-1/photo-01.jpg"
       data-caption="Opening plenary, WWRF Huddle 2026"
       target="_blank" rel="noopener">
      <img src="gallery/day-1/photo-01.jpg"
           alt="Opening plenary, WWRF Huddle 2026"
           loading="lazy" decoding="async">
    </a>
    <figcaption class="photo-caption">Opening plenary, WWRF Huddle 2026</figcaption>
  </figure>
</li>
```

## Good to know

* Thumbnails are cropped to a 4:3 box, so the photo itself can be any shape.
  The full, uncropped photo is what opens in the viewer.
* Clicking a photo opens it full screen, with arrow keys, on screen arrows,
  swipe on phones, and `Esc` to close.
* Keep files under roughly 500 KB each so the page stays quick to load. Around
  1600 px on the long edge is plenty for a web gallery.
* Use JPG for photographs and PNG for screenshots or graphics.
* The captions are optional. Leaving `data-caption` and `<figcaption>` empty
  hides the caption strip for that photo.
