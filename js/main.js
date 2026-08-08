/* Workers First AI — shared site behavior
   Loads header/footer partials, wires the mobile menu, marks the active
   nav link, animates numbers, and reveals sections as they scroll in. */

(function () {
  async function include(id, url) {
    const host = document.getElementById(id);
    if (!host) return;
    try {
      const res = await fetch(url, { cache: "no-store" });
      host.innerHTML = await res.text();
    } catch (e) {
      console.error("Could not load " + url, e);
    }
  }

  function setActiveNav() {
    const page = document.body.getAttribute("data-page");
    if (!page) return;
    document.querySelectorAll("[data-nav]").forEach((a) => {
      if (a.getAttribute("data-nav") === page) a.classList.add("active");
    });
  }

  function wireMobileNav() {
    const toggle = document.getElementById("navToggle");
    const links = document.getElementById("navLinks");
    if (!toggle || !links) return;
    toggle.addEventListener("click", () => links.classList.toggle("open"));
    links.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => links.classList.remove("open"))
    );
  }

  function wireReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !items.length) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((el) => io.observe(el));
  }

  function wireCounters() {
    const counters = document.querySelectorAll("[data-count-to]");
    if (!counters.length) return;
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count-to"));
      const suffix = el.getAttribute("data-suffix") || "";
      const decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
      if (reduceMotion) {
        el.textContent = target.toFixed(decimals) + suffix;
        return;
      }
      const duration = 1100;
      const start = performance.now();
      function tick(now) {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    };
    if (!("IntersectionObserver" in window)) {
      counters.forEach(animate);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((el) => io.observe(el));
  }

  function wireContactForm() {
    const form = document.getElementById("leadForm");
    if (!form) return;

    // reason-of-contact chips jump the form's hidden "subject" field + anchor
    const reasonInputs = form.querySelectorAll('input[name="reason"]');
    const subjectField = form.querySelector('input[name="subject-line"]');
    reasonInputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (subjectField) {
          const label = form.querySelector('label[for="' + input.id + '"]');
          subjectField.value = "Workers First AI website — " + (label ? label.firstChild.textContent.trim() : input.value);
        }
      });
    });

    form.addEventListener("submit", (e) => {
      // Netlify handles the actual submission (no JS required for that part).
      // We just show an inline confirmation if JS is enabled and let the
      // native POST to /thank-you.html happen for no-JS / slow connections.
    });
  }

  function wireHashPreselect() {
    // The homepage/footer/other pages link to contact.html#research, #media,
    // #drivers, #partner to preselect the matching "what brings you here"
    // chip. A plain cross-page link always reloads the document and this
    // runs fine on load — but a link to contact.html#xyz clicked *while
    // already on contact.html* (e.g. the footer, which is on every page)
    // is a same-document fragment navigation: the browser just scrolls and
    // fires "hashchange", it does not reload. So this has to listen for
    // hashchange too, not just run once on load.
    // #endorse is a special case: endorsement is an optional checkbox inside
    // the form, not one of the four primary reasons, so it checks the box
    // instead of selecting a "reason" radio.
    const map = { research: "r-research", media: "r-media", drivers: "r-drivers", partner: "r-partner", support: "r-partner" };
    function applyHash() {
      const hash = (location.hash || "").replace("#", "");
      if (hash === "endorse") {
        const checkbox = document.getElementById("f-endorse");
        if (checkbox) checkbox.checked = true;
        return;
      }
      const id = map[hash];
      if (!id) return;
      const el = document.getElementById(id);
      if (el && !el.checked) {
        el.checked = true;
        el.dispatchEvent(new Event("change"));
      }
    }
    if (!document.getElementById("leadForm")) return;
    applyHash();
    window.addEventListener("hashchange", applyHash);
  }

  function wireMarqueeToggle() {
    // Hover-to-pause doesn't help touch/keyboard users, and a strip that
    // scrolls on its own for the whole time on page counts as
    // auto-updating content — give it an explicit, accessible pause control.
    const toggle = document.getElementById("marqueeToggle");
    const track = document.getElementById("marqueeTrack");
    if (!toggle || !track) return;
    const label = toggle.querySelector(".marquee-toggle-label");
    const icon = toggle.querySelector(".marquee-toggle-icon");
    toggle.addEventListener("click", () => {
      const paused = track.classList.toggle("paused");
      toggle.setAttribute("aria-pressed", String(paused));
      toggle.setAttribute("aria-label", paused ? "Resume the scrolling photos" : "Pause the scrolling photos");
      if (label) label.textContent = paused ? "Play" : "Pause";
      if (icon) icon.textContent = paused ? "▶" : "❚❚";
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
      include("site-header", "partials/header.html"),
      include("site-footer", "partials/footer.html"),
    ]);
    setActiveNav();
    wireMobileNav();
    wireReveal();
    wireCounters();
    wireContactForm();
    wireHashPreselect();
    wireMarqueeToggle();
  });
})();
