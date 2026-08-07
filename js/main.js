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
    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count-to"));
      const suffix = el.getAttribute("data-suffix") || "";
      const decimals = el.getAttribute("data-decimals") ? parseInt(el.getAttribute("data-decimals"), 10) : 0;
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

  function wireHeroCollage() {
    const hero = document.querySelector(".hero-collage");
    if (!hero) return;
    // Set as inline style (not a CSS custom property) so the relative url()
    // resolves against this HTML document, not against css/style.css.
    hero.style.backgroundImage =
      "linear-gradient(180deg, rgba(246,249,254,0.12) 0%, rgba(246,249,254,0.48) 34%, rgba(246,249,254,0.5) 66%, #f6f9fe 100%), url('images/driver-collage.jpg')";
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

  document.addEventListener("DOMContentLoaded", async () => {
    await Promise.all([
      include("site-header", "partials/header.html"),
      include("site-footer", "partials/footer.html"),
    ]);
    setActiveNav();
    wireMobileNav();
    wireReveal();
    wireCounters();
    wireHeroCollage();
    wireContactForm();
  });
})();
