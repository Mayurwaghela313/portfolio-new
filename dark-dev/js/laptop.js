/* A floating 3D laptop whose screen browses through each client site. */
// Classic script, not a module: browsers block local module files when the
// page is opened by double-click (file://). three.js still loads from the CDN.
window.mountLaptop = async function (host, { shots, onShow, layout = "right" } = {}) {
  let THREE, RoundedBoxGeometry, RoomEnvironment;
  try {
    THREE = await import("three");
    ({ RoundedBoxGeometry } = await import("three/addons/geometries/RoundedBoxGeometry.js"));
    ({ RoomEnvironment } = await import("three/addons/environments/RoomEnvironment.js"));
  } catch (e) { return null; }
  // WebGL refuses local image files on file://, so use the embedded copies there.
  if (location.protocol === "file:" && !window.SHOT_DATA) {
    await new Promise((r) => { const sc = document.createElement("script"); sc.src = (document.body.dataset.base || "") + "js/shots.js"; sc.onload = sc.onerror = r; document.head.append(sc); });
  }
  const reduce = window.__reduce;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 2.4, 10);
  camera.lookAt(0, 0.35, 0);

  // violet rim + cool fill
  const rim = new THREE.PointLight(0x8b7bff, 40, 20, 2); rim.position.set(-3, 3, -3); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, 0.6); fill.position.set(3, 4, 5); scene.add(fill);

  const rig = new THREE.Group();   // scroll + layout transforms
  const float = new THREE.Group(); // idle float + cursor tilt
  rig.add(float); scene.add(rig);

  /* ---------- Materials ---------- */
  const alu = new THREE.MeshStandardMaterial({ color: 0x8a90a0, metalness: 0.9, roughness: 0.28 });
  const aluDark = new THREE.MeshStandardMaterial({ color: 0x15171d, metalness: 0.4, roughness: 0.6 });

  /* ---------- Base ---------- */
  const W = 3.3, D = 2.25, T = 0.11;
  const base = new THREE.Mesh(new RoundedBoxGeometry(W, T, D, 4, 0.06), alu);
  float.add(base);

  // keyboard + trackpad drawn on a canvas
  const kc = document.createElement("canvas"); kc.width = 1024; kc.height = 700;
  const k = kc.getContext("2d");
  k.fillStyle = "#7c8291"; k.fillRect(0, 0, 1024, 700);
  k.fillStyle = "#101217";
  const rr = (x, y, w, h, r) => { k.beginPath(); k.roundRect(x, y, w, h, r); k.fill(); };
  rr(70, 40, 884, 370, 14);
  k.fillStyle = "#1c1f27";
  const cols = 14, kw = 884 / cols;
  for (let r = 0; r < 6; r++) for (let c = 0; c < cols; c++) {
    if (r === 5 && c > 3 && c < 9) continue;
    rr(78 + c * kw, 48 + r * 60, kw - 10, r === 0 ? 34 : 50, 7);
  }
  rr(78 + 4 * kw, 48 + 5 * 60, kw * 5 - 10, 50, 7);
  k.fillStyle = "#6c7181"; rr(330, 440, 364, 230, 18);
  const keyTex = new THREE.CanvasTexture(kc); keyTex.colorSpace = THREE.SRGBColorSpace; keyTex.anisotropy = 8;
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.12, D - 0.12), new THREE.MeshStandardMaterial({ map: keyTex, metalness: 0.5, roughness: 0.5 }));
  deck.rotation.x = -Math.PI / 2; deck.position.y = T / 2 + 0.001;
  float.add(deck);

  /* ---------- Lid ---------- */
  const lid = new THREE.Group();
  lid.position.set(0, T / 2, -D / 2 + 0.02);
  float.add(lid);
  const LH = 2.15, LT = 0.07;
  const shell = new THREE.Mesh(new RoundedBoxGeometry(W, LH, LT, 4, 0.05), alu);
  shell.position.set(0, LH / 2, -LT / 2);
  lid.add(shell);
  const bezel = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.06, LH - 0.06), aluDark);
  bezel.position.set(0, LH / 2, 0.002);
  lid.add(bezel);

  // screen: crossfades between two textures and slowly scrolls the page
  const SW = W - 0.22, SH = LH - 0.26;
  const loader = new THREE.TextureLoader();
  const texes = shots.map((s) => {
    const t = loader.load((window.SHOT_DATA || {})[s.slug] || s.src); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  });
  const screenMat = new THREE.ShaderMaterial({
    uniforms: {
      uA: { value: texes[0] }, uB: { value: texes[1 % texes.length] },
      uMix: { value: 0 }, uScrollA: { value: 0 }, uScrollB: { value: 0 },
      uView: { value: (SH / SW) / 0.75 }, uOn: { value: 0 },
    },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `
      uniform sampler2D uA, uB; uniform float uMix, uScrollA, uScrollB, uView, uOn; varying vec2 vUv;
      vec3 samp(sampler2D t, float s){ vec2 uv = vec2(vUv.x, 1.0 - ((1.0 - vUv.y) * uView + s * (1.0 - uView))); return texture2D(t, uv).rgb; }
      void main(){
        vec3 c = mix(samp(uA, uScrollA), samp(uB, uScrollB), uMix);
        // subtle glass sheen + vignette
        float v = smoothstep(1.25, 0.35, length(vUv - 0.5) * 1.6);
        c *= mix(0.82, 1.0, v);
        c += vec3(0.06) * smoothstep(0.55, 1.0, vUv.y + vUv.x * 0.35);
        gl_FragColor = vec4(c * uOn, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenMat);
  screen.position.set(0, LH / 2 + 0.03, 0.004);
  lid.add(screen);

  /* ---------- Contact shadow ---------- */
  const sc = document.createElement("canvas"); sc.width = sc.height = 256;
  const sg = sc.getContext("2d"); const g = sg.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, "rgba(0,0,0,0.75)"); g.addColorStop(1, "rgba(0,0,0,0)"); sg.fillStyle = g; sg.fillRect(0, 0, 256, 256);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(6, 3.6), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.9;
  rig.add(shadow);

  /* ---------- State ---------- */
  const state = { open: 0, scroll: 0, mx: 0, my: 0, tx: 0, ty: 0 };
  lid.rotation.x = Math.PI / 2;
  addEventListener("pointermove", (e) => { state.tx = e.clientX / innerWidth - 0.5; state.ty = e.clientY / innerHeight - 0.5; }, { passive: true });

  let w = 1, h = 1;
  function resize() {
    const r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    const narrow = w < 900;
    rig.userData.baseX = narrow || layout === "center" ? 0 : 1.95;
    rig.userData.baseS = layout === "center" ? Math.min(1, w / 520) * 0.95 : narrow ? Math.min(1.15, w / 400) : 1;
  }
  resize();
  addEventListener("resize", resize);

  /* ---------- Screen slideshow ---------- */
  let idx = 0;
  const show = (i) => onShow && onShow(i);
  show(0);
  const G = window.gsap;
  if (G && !reduce && texes.length > 1) {
    const cycle = () => {
      const next = (idx + 1) % texes.length;
      screenMat.uniforms.uB.value = texes[next];
      screenMat.uniforms.uScrollB.value = 0;
      G.timeline()
        .to(screenMat.uniforms.uScrollA, { value: 1, duration: 2.6, ease: "power2.inOut" })
        .to(screenMat.uniforms.uMix, { value: 1, duration: 0.7, ease: "power2.inOut", onStart: () => show(next) })
        .add(() => {
          idx = next;
          screenMat.uniforms.uA.value = texes[idx];
          screenMat.uniforms.uScrollA.value = 0;
          screenMat.uniforms.uMix.value = 0;
        })
        .to({}, { duration: 0.6, onComplete: cycle });
    };
    setTimeout(cycle, 2600);
  }

  /* ---------- Loop ---------- */
  const clock = new THREE.Clock();
  let running = true, raf = 0;
  function frame() {
    const t = clock.getElapsedTime();
    state.mx += (state.tx - state.mx) * 0.06; state.my += (state.ty - state.my) * 0.06;
    const s = state.scroll;
    lid.rotation.x = THREE.MathUtils.lerp(Math.PI / 2, -0.28, state.open) + s * 0.9;
    screenMat.uniforms.uOn.value = Math.min(1, state.open * 1.4);
    float.position.y = reduce ? 0 : Math.sin(t * 1.1) * 0.08;
    float.rotation.y = -0.38 + state.mx * 0.45 + (reduce ? 0 : Math.sin(t * 0.5) * 0.04);
    float.rotation.x = 0.12 + state.my * 0.18;
    float.rotation.z = Math.sin(t * 0.7) * 0.015;
    rig.position.x = rig.userData.baseX - s * 0.8;
    rig.position.y = -0.15 - s * 1.4;
    rig.rotation.y = s * 0.9;
    const sc2 = rig.userData.baseS * (1 - s * 0.15);
    rig.scale.setScalar(sc2);
    shadow.material.opacity = 0.9 - float.position.y * 1.5;
    renderer.render(scene, camera);
  }
  const loop = () => { frame(); raf = requestAnimationFrame(loop); };
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) { running = true; loop(); }
    else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
  });
  io.observe(host);
  loop();

  return { state, open(d = 1.8) { if (G && !reduce) G.to(state, { open: 1, duration: d, ease: "expo.inOut" }); else state.open = 1; } };
};
