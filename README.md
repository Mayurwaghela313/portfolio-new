# Mayur Waghela portfolio: dark developer design

A second design direction, kept beside the saved Press Proof version in `../press-proof/`.

- **Look:** near-black (#0b0c10), violet accent (#8b7bff), Sora, Inter and JetBrains Mono.
- **3D:** a floating Three.js laptop whose lid opens on load and whose screen cycles through the eight client sites. It tilts with the cursor and turns as you scroll. The About page shows the same laptop.
- **Motion:** GSAP and ScrollTrigger with Lenis smooth scroll, a first-visit preloader, curtain page transitions, split-line headings, a magnetic cursor and buttons, and a marquee that speeds up with scroll.
- **Pages:** `index.html`, `work/index.html` (filterable), `work/project.html?p=<slug>`, `about.html`, `contact.html` (validated mailto brief).

Open `index.html` directly (double-click) or serve the folder, for example `python -m http.server 5174`, and open http://localhost:5174/. An internet connection is needed for GSAP, Three.js and the fonts. When opened as a local file, the laptop screen uses the embedded copies in `js/shots.js`, because browsers block local images in WebGL.

Project content lives in `js/data.js`. Set `confirmed: true` on a project once its brief and scope are checked with the client; that removes the "pending sign-off" note. The screenshots in `assets/shots/` were captured on 2026-11-05.
