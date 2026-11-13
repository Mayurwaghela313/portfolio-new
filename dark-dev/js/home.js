(async () => {
const reduce = window.__reduce;
const G = typeof window.gsap !== "undefined";
const { ARROW } = window.__ui;
const P = window.PROJECTS;

/* ---------- Marquee + work rows ---------- */
const mq = document.getElementById("marquee");
mq.innerHTML = [...P, ...P].map((p) => `<span>${p.name}</span>`).join("");

document.getElementById("works").innerHTML = P.slice(0, 4).map((p, i) => `
  <a class="work" href="work/project.html?p=${p.slug}" data-label="${p.name}">
    <div class="work__media" data-cursor="view">
      <img src="${shotURL(p.url)}" alt="Home page of ${p.name}" loading="lazy" width="1280" height="960">
      <span class="work__chip"><span class="chip">${p.platform}</span><span class="chip">${p.industry}</span></span>
    </div>
    <div class="work__info">
      <span class="work__no mono">0${i + 1} / 08 · ${p.city}</span>
      <h3 class="work__name">${p.name}</h3>
      <p class="work__sum">${p.summary}</p>
      <span class="work__go">Read the case <i>${ARROW}</i></span>
    </div>
  </a>`).join("");

/* ---------- Laptop ---------- */
const name = document.getElementById("screen-name");
const meta = document.getElementById("screen-meta");
const laptop = await window.mountLaptop(document.getElementById("gl"), {
  shots: P.map((p) => ({ src: shotURL(p.url), slug: p.slug })),
  onShow: (i) => {
    if (!G || reduce) { name.textContent = P[i].name; meta.textContent = P[i].platform; return; }
    gsap.to([name, meta], { opacity: 0, y: -8, duration: 0.25, ease: "power2.in", onComplete: () => {
      name.textContent = P[i].name; meta.textContent = P[i].platform;
      gsap.fromTo([name, meta], { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out" });
    } });
  },
});

window.__entered.then(() => {
  if (laptop) laptop.open(reduce ? 0 : 2);
  if (!G || reduce) return;

  /* Hero intro */
  const lines = splitLines(document.querySelector("[data-hero-title]"));
  gsap.timeline()
    .from(lines, { yPercent: 110, duration: 1.4, ease: "expo.out", stagger: 0.09 })
    .from("[data-hero]", { y: 30, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08 }, 0.25)
    .from(".hero__glow", { scale: 0.4, opacity: 0, duration: 2.4, ease: "expo.out" }, 0);

  /* Laptop reacts to scroll through the hero */
  if (laptop) {
    gsap.to(laptop.state, { scroll: 1, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  }
  gsap.to(".hero__copy", { yPercent: -25, opacity: 0.2, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

  /* Marquee runs faster with scroll speed */
  const loop = gsap.to(mq, { xPercent: -50, duration: 40, ease: "none", repeat: -1 });
  ScrollTrigger.create({ onUpdate: (s) => {
    const v = Math.min(Math.abs(s.getVelocity()) / 300, 6);
    gsap.to(loop, { timeScale: (s.direction === -1 ? -1 : 1) * (1 + v), duration: 0.3, overwrite: true,
      onComplete: () => gsap.to(loop, { timeScale: 1, duration: 1 }) });
  } });

  /* About: words light up as you read */
  const at = document.getElementById("about-text");
  at.innerHTML = at.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
  gsap.to(at.querySelectorAll(".w"), { opacity: 1, stagger: 0.1, ease: "none",
    scrollTrigger: { trigger: at, start: "top 80%", end: "bottom 50%", scrub: 0.5 } });

  /* Work: image wipes in, then parallax inside its frame */
  gsap.utils.toArray(".work").forEach((w) => {
    const media = w.querySelector(".work__media");
    const img = media.querySelector("img");
    gsap.fromTo(media, { clipPath: "inset(18% 12% 18% 12% round 18px)" }, { clipPath: "inset(0% 0% 0% 0% round 18px)", ease: "none",
      scrollTrigger: { trigger: w, start: "top 95%", end: "top 35%", scrub: true } });
    gsap.fromTo(img, { yPercent: -8 }, { yPercent: 0, ease: "none",
      scrollTrigger: { trigger: w, start: "top bottom", end: "bottom top", scrub: true } });
    gsap.from(w.querySelectorAll(".work__info > *"), { y: 40, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.08,
      scrollTrigger: { trigger: w, start: "top 70%", once: true } });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
});
})();
