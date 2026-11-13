(() => {
/* Inner pages: work index, case page, about, contact. */
const page = document.body.dataset.page;
const reduce = window.__reduce;
const G = typeof window.gsap !== "undefined";
const { ARROW, OUT } = window.__ui;
const P = window.PROJECTS;
const ready = (fn) => window.__entered.then(() => { if (G && !reduce) fn(); });

/* ---------- Work index ---------- */
if (page === "work") {
  const grid = document.getElementById("grid");
  grid.innerHTML = P.map((p, i) => `
    <a class="card" href="project.html?p=${p.slug}" data-platform="${p.platform}" data-label="${p.name}">
      <div class="card__media" data-cursor="view">
        <img src="${shotURL(p.url)}" alt="Home page of ${p.name}" loading="${i < 2 ? "eager" : "lazy"}" width="1280" height="960">
        <span class="card__view" aria-hidden="true">View</span>
      </div>
      <div class="card__meta">
        <h2 class="card__name">${p.name}</h2>
        <span class="mono">${p.platform} · ${p.industry}</span>
      </div>
    </a>`).join("");
  const count = (k) => P.filter((p) => !k || p.platform === k).length;
  document.querySelectorAll(".filters button").forEach((b) => (b.querySelector("sup").textContent = count(b.dataset.f)));
  const cards = [...grid.children];
  document.querySelector(".filters").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    document.querySelectorAll(".filters button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    const show = (c) => !b.dataset.f || c.dataset.platform === b.dataset.f;
    if (!G || reduce) { cards.forEach((c) => (c.hidden = !show(c))); return; }
    gsap.to(cards, { opacity: 0, y: 24, duration: 0.25, ease: "power2.in", onComplete: () => {
      cards.forEach((c) => (c.hidden = !show(c)));
      ScrollTrigger.refresh();
      gsap.fromTo(cards.filter((c) => !c.hidden), { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06 });
    } });
  });
  ready(() => {
    cards.forEach((c, i) => {
      gsap.from(c, { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", delay: (i % 2) * 0.1,
        scrollTrigger: { trigger: c, start: "top 92%", once: true } });
      gsap.fromTo(c.querySelector("img"), { yPercent: -6, scale: 1.12 }, { yPercent: 0, scale: 1, ease: "none",
        scrollTrigger: { trigger: c, start: "top bottom", end: "bottom top", scrub: true } });
    });
  });
}

/* ---------- Case page ---------- */
if (page === "project") {
  const slug = new URLSearchParams(location.search).get("p");
  const i = Math.max(0, P.findIndex((p) => p.slug === slug));
  const p = P[i], n = P[(i + 1) % P.length];
  document.title = `${p.name} | ${p.platform} ${p.industry.toLowerCase()} site by Mayur Waghela`;
  document.querySelector('meta[name="description"]').content = p.summary;
  const $ = (id) => document.getElementById(id);
  $("c-title").innerHTML = `${p.name}<sup>0${i + 1}</sup>`;
  $("c-sum").textContent = p.summary;
  $("c-visit").href = p.url;
  $("c-img").src = shotURL(p.url);
  $("c-img").alt = `Home page of ${p.name}`;
  $("c-facts").innerHTML = [["Client", p.name], ["Platform", p.platform], ["Industry", p.industry], ["Location", p.city],
    ["Live site", `<a href="${p.url}" target="_blank" rel="noopener">${p.url.replace(/^https?:\/\/|\/$/g, "")}</a>`]]
    .map(([k, v]) => `<div><dt class="mono">${k}</dt><dd>${v}</dd></div>`).join("");
  $("c-brief").textContent = p.brief;
  $("c-scope").innerHTML = p.scope.map((s) => `<li>${s}</li>`).join("");
  if (!p.confirmed) $("c-pending").hidden = false;
  const next = $("c-next");
  next.href = `project.html?p=${n.slug}`; next.dataset.label = n.name;
  $("c-next-name").textContent = n.name;
  ready(() => {
    gsap.from(splitLines($("c-title")), { yPercent: 110, duration: 1.3, ease: "expo.out", stagger: 0.08 });
    gsap.from(".case-shot", { clipPath: "inset(30% 20% 0% 20% round 20px)", duration: 1.6, ease: "expo.inOut", delay: 0.15 });
    gsap.from("#c-img", { scale: 1.25, duration: 2, ease: "expo.out", delay: 0.15 });
    gsap.to("#c-img", { yPercent: -18, ease: "none", scrollTrigger: { trigger: ".case-shot", start: "top top+=80", end: "bottom top", scrub: true } });
    gsap.from(".next__name", { yPercent: 40, opacity: 0, ease: "none", scrollTrigger: { trigger: ".next", start: "top bottom", end: "center center", scrub: true } });
  });
}

/* ---------- About ---------- */
if (page === "about") {
  const host = document.getElementById("portrait");
  if (host) {
    window.mountLaptop(host, { shots: P.map((p) => ({ src: shotURL(p.url), slug: p.slug })), layout: "center" }).then((l) => {
      if (l) window.__entered.then(() => l.open(reduce ? 0 : 2.2));
    });
  }
}

/* ---------- Contact ---------- */
if (page === "contact") {
  const form = document.getElementById("brief");
  const rules = { name: (v) => v.trim() ? "" : "Add your name so I know who to reply to.",
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? "" : "Enter an email I can reply to, like you@company.com.",
    msg: (v) => v.trim().length >= 10 ? "" : "Add a line or two about the project." };
  const check = (el) => {
    const msg = rules[el.name](el.value), f = el.closest(".field"), err = f.querySelector(".err");
    f.dataset.invalid = String(!!msg); el.setAttribute("aria-invalid", String(!!msg));
    err.textContent = msg; err.hidden = !msg; return !msg;
  };
  Object.keys(rules).forEach((k) => {
    const el = form.elements[k];
    el.addEventListener("blur", () => el.value && check(el));
    el.addEventListener("input", () => el.closest(".field").dataset.invalid === "true" && check(el));
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = Object.keys(rules).map((k) => form.elements[k]).filter((el) => !check(el));
    if (bad.length) { bad[0].focus(); return; }
    const d = new FormData(form);
    const body = `${d.get("msg")}\n\nProject: ${d.get("type")}\n${d.get("name")} · ${d.get("email")}`;
    location.href = `mailto:${window.PERSON.email}?subject=${encodeURIComponent(`${d.get("type")} enquiry from ${d.get("name")}`)}&body=${encodeURIComponent(body)}`;
    document.getElementById("sent").hidden = false;
  });
}
})();
