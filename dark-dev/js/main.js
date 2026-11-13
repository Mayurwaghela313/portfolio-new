/* Shared chrome and motion for the dark portfolio. */
(() => {
  const P = window.PERSON;
  const root = document.documentElement;
  const base = document.body.dataset.base || "";
  const page = document.body.dataset.page || "";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const G = typeof window.gsap !== "undefined";
  if (G && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
  window.__reduce = reduce;

  const ARROW = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
  const OUT = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>`;
  const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#171a22" stroke="rgba(236,237,242,.18)"/><path d="M8 22V10l8 8 8-8v12" fill="none" stroke="#8b7bff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const roll = (t) => `<span class="roll"><span>${t}</span><span aria-hidden="true">${t}</span></span>`;
  window.__ui = { ARROW, OUT, roll };

  /* ---------- Chrome ---------- */
  const links = [["work", "Work", `${base}work/`], ["about", "About", `${base}about.html`], ["contact", "Contact", `${base}contact.html`]];
  const nav = document.createElement("header");
  nav.className = "nav";
  nav.innerHTML = `
    <a class="nav__logo" href="${base}index.html" aria-label="Mayur Waghela, home">${LOGO}<span>Mayur Waghela</span></a>
    <ul class="nav__links" id="navlinks">${links.map(([k, l, h]) => `<li><a href="${h}"${k === page ? ' aria-current="page"' : ""}>${l}</a></li>`).join("")}</ul>
    <div class="nav__right">
      <span class="mono nav__clock"><span data-clock>--:--</span> IST</span>
      <span class="magnet"><a class="btn btn--sm" href="${base}contact.html">${roll("Let's talk")}</a></span>
      <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="navlinks" aria-label="Open menu"><span></span></button>
    </div>`;
  document.body.prepend(nav);
  const skip = Object.assign(document.createElement("a"), { className: "skip", href: "#main", textContent: "Skip to content" });
  document.body.prepend(skip);
  const toggle = nav.querySelector(".nav__toggle");
  toggle.addEventListener("click", () => {
    const open = nav.dataset.open !== "true";
    nav.dataset.open = String(open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.style.overflow = open ? "hidden" : "";
  });

  const clock = nav.querySelector("[data-clock]");
  const fmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" });
  const tick = () => (clock.textContent = fmt.format(new Date()));
  tick(); setInterval(tick, 15000);

  const footer = document.createElement("footer");
  footer.className = "footer";
  footer.innerHTML = `
    <div class="footer__top">
      <p class="footer__big">Websites and stores for businesses that sell.</p>
      <div><h2 class="mono">Pages</h2><ul><li><a href="${base}index.html">Home</a></li>${links.map(([, l, h]) => `<li><a href="${h}">${l}</a></li>`).join("")}</ul></div>
      <div><h2 class="mono">Contact</h2><ul>
        <li><a href="mailto:${P.email}">Email</a></li>
        <li><a href="${P.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><a href="tel:${P.phone.replace(/\s/g, "")}">${P.phone}</a></li></ul></div>
      <div><h2 class="mono">Social</h2><ul>
        <li><a href="${P.linkedin}" target="_blank" rel="noopener">LinkedIn</a></li>
        <li><a href="${P.instagram}" target="_blank" rel="noopener">Instagram</a></li></ul></div>
    </div>
    <p class="footer__word" aria-hidden="true">Mayur Waghela</p>
    <div class="footer__base mono"><span>© ${new Date().getFullYear()} Mayur Waghela · ${P.city}</span><span>Built with Three.js and GSAP</span></div>`;
  document.body.append(footer);

  /* ---------- Split text into masked lines ---------- */
  window.splitLines = (el) => {
    const words = el.innerHTML.trim().split(/\s+(?![^<]*>)/);
    el.innerHTML = words.map((w) => `<span class="sw" style="display:inline-block">${w}</span>`).join(" ");
    const spans = [...el.querySelectorAll(".sw")];
    const lines = [];
    let top = null;
    spans.forEach((s) => {
      if (s.offsetTop !== top) { lines.push([]); top = s.offsetTop; }
      lines[lines.length - 1].push(s.innerHTML);
    });
    el.innerHTML = lines.map((l) => `<span class="line-mask"><span>${l.join(" ")}</span></span>`).join("");
    return [...el.querySelectorAll(".line-mask > span")];
  };

  /* ---------- Curtain transitions ---------- */
  const curtain = document.createElement("div");
  curtain.className = "curtain"; curtain.setAttribute("aria-hidden", "true");
  curtain.innerHTML = `<span></span>`;
  document.body.append(curtain);
  const label = curtain.querySelector("span");

  window.__entered = new Promise((resolve) => {
    const go = () => {
      const loaded = document.querySelector(".loader") && !root.classList.contains("no-loader");
      if (!G || reduce || loaded) { root.classList.remove("is-entering"); if (G) gsap.set(curtain, { yPercent: 100 }); resolve(); return; }
      gsap.set(curtain, { yPercent: 0 });
      root.classList.remove("is-entering");
      gsap.to(curtain, { yPercent: -100, duration: 1, ease: "expo.inOut", delay: 0.1, onComplete: () => { gsap.set(curtain, { yPercent: 100 }); } });
      setTimeout(resolve, 450);
    };
    if (window.__loaderDone) window.__loaderDone.then(go);
    else if (document.readyState === "complete") go();
    else addEventListener("load", go, { once: true });
  });
  addEventListener("pageshow", (e) => { if (e.persisted && G) gsap.set(curtain, { yPercent: 100 }); });

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0 || a.target === "_blank") return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.search === location.search) return;
    if (!G || reduce) return;
    e.preventDefault();
    label.textContent = a.dataset.label || a.textContent.trim().split("\n")[0].slice(0, 40);
    gsap.timeline({ onComplete: () => (location.href = url.href) })
      .fromTo(curtain, { yPercent: 100 }, { yPercent: 0, duration: 0.75, ease: "expo.inOut" })
      .fromTo(label, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: "expo.out" }, "-=0.25");
  });

  /* ---------- Smooth scroll + nav behaviour ---------- */
  if (!reduce && window.Lenis) {
    const lenis = new Lenis({ duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
    window.__lenis = lenis;
    if (G && window.ScrollTrigger) { lenis.on("scroll", ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0); }
  }
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY;
    nav.classList.toggle("is-solid", y > 40);
    nav.classList.toggle("is-hidden", y > lastY && y > 400 && nav.dataset.open !== "true");
    lastY = y;
  }, { passive: true });

  /* ---------- Cursor + magnetic ---------- */
  if (fine && !reduce && G) {
    const dot = Object.assign(document.createElement("div"), { className: "cursor-dot" });
    const ring = Object.assign(document.createElement("div"), { className: "cursor-ring" });
    dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
    document.body.append(dot, ring);
    const dx = gsap.quickTo(dot, "x", { duration: 0.1 }), dy = gsap.quickTo(dot, "y", { duration: 0.1 });
    const rx = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3" }), ry = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3" });
    addEventListener("pointermove", (e) => { dx(e.clientX); dy(e.clientY); rx(e.clientX); ry(e.clientY); dot.style.opacity = ring.style.opacity = 1; }, { passive: true });
    document.addEventListener("pointerover", (e) => {
      const v = e.target.closest("[data-cursor='view']");
      ring.classList.toggle("is-view", !!v);
      ring.textContent = v ? "View" : "";
      ring.classList.toggle("is-link", !v && !!e.target.closest("a, button, label, input, textarea"));
    });
    document.querySelectorAll(".magnet").forEach((m) => {
      const xTo = gsap.quickTo(m, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" }), yTo = gsap.quickTo(m, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      m.addEventListener("pointermove", (e) => { const r = m.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.35); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
      m.addEventListener("pointerleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- Reveals ---------- */
  window.__entered.then(() => {
    if (!G || reduce) return;
    document.querySelectorAll("[data-split]").forEach((el) => {
      const lines = splitLines(el);
      const inHero = el.closest(".phead, .hero");
      gsap.from(lines, { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.08,
        scrollTrigger: inHero ? undefined : { trigger: el, start: "top 85%", once: true } });
    });
    gsap.utils.toArray("[data-rv]").forEach((el) => {
      gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
    });
  });
})();
