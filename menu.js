/* ===============================
   HEADER MENU
   Handles the mobile slide-in panel: open/close, Escape,
   body scroll lock, and auto-close on link click / resize.
   Breakpoint must stay in sync with style.css (1024px).
================================ */
(function () {
  "use strict";

  var MOBILE_QUERY = "(max-width: 1024px)";

  document.addEventListener("DOMContentLoaded", function () {
    var toggle     = document.querySelector(".menu-toggle");
    var closeBtn   = document.querySelector(".close-menu");
    var mobileMenu = document.querySelector(".mobile-menu");

    if (!toggle || !mobileMenu) {
      return; // nothing to wire up on this page
    }

    // --- Accessibility wiring -------------------------------------------
    if (!mobileMenu.id) {
      mobileMenu.id = "mobile-menu";
    }
    toggle.setAttribute("aria-controls", mobileMenu.id);
    toggle.setAttribute("aria-expanded", "false");

    if (toggle.tagName === "BUTTON" && !toggle.getAttribute("type")) {
      toggle.setAttribute("type", "button");
    }
    if (!toggle.getAttribute("aria-label")) {
      toggle.setAttribute("aria-label", "Open menu");
    }
    if (closeBtn) {
      if (closeBtn.tagName === "BUTTON" && !closeBtn.getAttribute("type")) {
        closeBtn.setAttribute("type", "button");
      }
      if (!closeBtn.getAttribute("aria-label")) {
        closeBtn.setAttribute("aria-label", "Close menu");
      }
    }

    // --- Open / close ----------------------------------------------------
    function openMenu() {
      mobileMenu.classList.add("active");
      document.body.classList.add("menu-open");
      toggle.setAttribute("aria-expanded", "true");

      // Move focus into the panel so keyboard users land in the right place.
      // Deferred a frame: the panel is visibility:hidden until the class
      // change is flushed, and focus() is a no-op on a hidden element.
      var target = closeBtn || mobileMenu.querySelector("a");
      if (target) {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(function () {
            target.focus();
          });
        } else {
          target.focus();
        }
      }
    }

    function closeMenu(returnFocus) {
      mobileMenu.classList.remove("active");
      document.body.classList.remove("menu-open");
      toggle.setAttribute("aria-expanded", "false");

      if (returnFocus) {
        toggle.focus();
      }
    }

    function isOpen() {
      return mobileMenu.classList.contains("active");
    }

    toggle.addEventListener("click", function (e) {
      e.preventDefault();
      if (isOpen()) {
        closeMenu(true);
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function (e) {
        e.preventDefault();
        closeMenu(true);
      });
    }

    // Tapping any link inside the panel closes it (so in-page anchors work).
    mobileMenu.addEventListener("click", function (e) {
      if (e.target.closest("a")) {
        closeMenu(false);
      }
    });

    // Escape closes the panel.
    document.addEventListener("keydown", function (e) {
      if ((e.key === "Escape" || e.key === "Esc") && isOpen()) {
        closeMenu(true);
      }
    });

    // Rotating to landscape / resizing past the breakpoint must not leave
    // the page scroll-locked behind an invisible panel.
    var mq = window.matchMedia(MOBILE_QUERY);
    function handleBreakpoint(event) {
      if (!event.matches && isOpen()) {
        closeMenu(false);
      }
    }

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleBreakpoint);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(handleBreakpoint); // Safari < 14
    }
  });
})();
