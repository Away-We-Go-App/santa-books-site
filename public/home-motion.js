(() => {
  "use strict";
  const canvas = document.querySelector("#christmas-scene"),
    ctx = canvas.getContext("2d");
  const snowfall = document.querySelector("#homepage-snow"),
    snowCtx = snowfall.getContext("2d");
  const stage = document.querySelector(".christmas-stage"),
    button = document.querySelector("#motion-toggle");
  if (!ctx || !snowCtx) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)"),
    sprites = {},
    CYCLE = 27,
    TAU = Math.PI * 2;
  let paused = reduce.matches,
    ready = false,
    elapsed = 5,
    last = 0,
    raf = 0,
    lastScene = -1,
    lastSnow = 0,
    inView = true;
  let snowWidth = 0,
    snowHeight = 0;
  ctx.scale(2, 2);
  function shadow(x, y, rx, ry, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const g = ctx.createRadialGradient(0, 0, 0.1, 0, 0, 1);
    g.addColorStop(0, "rgba(63,55,31," + alpha + ")");
    g.addColorStop(1, "rgba(63,55,31,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, 1, 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  function deer(
    x,
    feet,
    phase,
    moving,
    headAngle = 0,
    attention = 0,
  ) {
    const frame =
      moving > 0.01 ? ((Math.floor((phase + 1 / 24) * 8) % 8) + 8) % 8 : 0;
    const im = sprites["walk-views"].im,
      cw = im.width / 4,
      ch = im.height / 2,
      sx = (frame % 4) * cw,
      sy = Math.floor(frame / 4) * ch;
    // Registration offsets keep the generated poses on the same ground line.
    const size = 0.6;
    ctx.save();
    ctx.translate(x - 120, feet - 298);
    ctx.scale(size, size);
    ctx.translate(
      [0, 8, 2, 6, 6, 12, 8, 10][frame],
      [0, 5, -1, -1, 17, 26, 24, 24][frame],
    );
    const draw = () => ctx.drawImage(im, sx, sy, cw, ch, 0, 0, 384, 512);
    if (attention < 0.001) {
      draw();
    } else {
      ctx.save();
      ctx.beginPath();
      // Split below the face: the closed smile must never be clipped.
      ctx.rect(0, 315, 384, 197);
      ctx.clip();
      draw();
      ctx.restore();
      ctx.save();
      ctx.translate(267, 320);
      ctx.rotate(headAngle);
      ctx.translate(-267, -320);
      ctx.beginPath();
      ctx.rect(0, 0, 384, 322);
      ctx.closePath();
      ctx.clip();
      draw();
      ctx.restore();
    }
    ctx.restore();
  }
  function smooth(a, b, t) {
    const u = Math.max(0, Math.min(1, (t - a) / (b - a)));
    return u * u * (3 - 2 * u);
  }
  function emotion(t) {
    const clock = Math.floor((((t % CYCLE) + CYCLE) % CYCLE) * 12) / 12;
    const anticipate =
      smooth(8.0, 8.25, clock) * (1 - smooth(8.3, 8.65, clock));
    const look = smooth(8.55, 9.55, clock) * (1 - smooth(12.25, 13.2, clock));
    const tilt = smooth(11.55, 11.85, clock) * (1 - smooth(12.0, 12.35, clock));
    const hello =
      smooth(10.0, 10.65, clock) * (1 - smooth(11.75, 12.65, clock));
    return {
      headAngle: 0.025 * anticipate - 0.14 * look + 0.035 * tilt,
      attention: look,
      hello,
      clock,
    };
  }
  function tree(t, hello) {
    const clock = Math.floor((((t % CYCLE) + CYCLE) % CYCLE) * 12) / 12;
    const bow = (delay) =>
      smooth(9.7 + delay, 10.65 + delay, clock) *
      (1 - smooth(11.35 + delay, 12.65 + delay, clock));
    const shift = (y) =>
      -30 * Math.pow(Math.max(0, 1 - y / 485), 2.4) * bow((y / 485) * 0.55);
    ctx.save();
    ctx.translate(500, 50);
    const sx = shift(45);
    if (hello > 0) {
      const halo = ctx.createRadialGradient(sx, 45, 8, sx, 45, 95);
      halo.addColorStop(0, "rgba(245,191,72," + 0.36 * hello + ")");
      halo.addColorStop(0.5, "rgba(245,191,72," + 0.14 * hello + ")");
      halo.addColorStop(1, "rgba(245,191,72,0)");
      ctx.fillStyle = halo;
      ctx.fillRect(sx - 100, -55, 200, 200);
    }
    const source = sprites.tree;
    for (let y = 0; y < 485; y += 2) {
      const h = Math.min(2, 485 - y),
        offset = shift(y),
        next = shift(y + h);
      ctx.save();
      ctx.transform(1, 0, (next - offset) / h, 1, offset, y);
      ctx.drawImage(
        source.im,
        source.box[0],
        source.box[1] + (source.box[3] * y) / 485,
        source.box[2],
        (source.box[3] * h) / 485,
        -160,
        0,
        320,
        h + 0.15,
      );
      ctx.restore();
    }
    if (hello > 0) {
      const glow = ctx.createRadialGradient(sx, 45, 0, sx, 45, 38);
      glow.addColorStop(0, "rgba(255,246,186," + 0.62 * hello + ")");
      glow.addColorStop(1, "rgba(255,233,143,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(sx - 45, 0, 90, 90);
    }
    ctx.restore();
  }

  function draw(t) {
    ctx.clearRect(0, 0, 1000, 640);
    // Diffuse contact shadows establish the floor without a hard stage edge.
    shadow(500, 535, 222, 43, 0.14);
    shadow(500, 548, 350, 60, 0.035);
    const clock = Math.floor((((t % CYCLE) + CYCLE) % CYCLE) * 12) / 12;
    let walkTime,
      pace = 1;
    if (clock < 6) {
      walkTime = clock;
    } else if (clock < 8) {
      const u = (clock - 6) / 2;
      walkTime = 6 + 2 * u - u * u;
      pace = 1 - u;
    } else if (clock < 13) {
      walkTime = 7;
      pace = 0;
    } else if (clock < 15) {
      const u = (clock - 13) / 2;
      walkTime = 7 + u * u;
      pace = u;
    } else {
      walkTime = clock - 7;
    }
    const x = -120 + 62 * walkTime,
      feet = 580,
      scale = 0.24;
    // Hold the complete character pose on twos, including its travel, so feet stay planted.
    const speed = pace * 62,
      distance = x + 120,
      phase = distance / ((152 * scale) / 0.76) - 1 / 24;
    const feeling = emotion(t);
    const actor = () => {
      shadow(x, feet, (62 * scale) / 0.2, 10, 0.15);
      deer(
        x,
        feet,
        phase,
        Math.min(1, speed / 25),
        feeling.headAngle,
        feeling.attention,
      );
    };
    tree(t, feeling.hello);
    actor();
  }

  function resizeSnow() {
    snowWidth = innerWidth;
    snowHeight = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    snowfall.width = Math.round(snowWidth * dpr);
    snowfall.height = Math.round(snowHeight * dpr);
    snowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function drawSnow(t) {
    snowCtx.clearRect(0, 0, snowWidth, snowHeight);
    const count = snowWidth < 600 ? 22 : 46;
    for (let i = 0; i < count; i++) {
      const front = i % 3 === 0,
        r = front ? 2.3 : 1.4;
      const x =
        (((i * 137.507 + Math.sin(t * 0.22 + i) * 16) % snowWidth) +
          snowWidth) %
        snowWidth;
      const y = ((i * 83.7 + t * (front ? 22 : 13)) % (snowHeight + 12)) - 6;
      snowCtx.globalAlpha = front ? 0.48 : 0.3;
      snowCtx.fillStyle = front ? "#aab9b2" : "#b8c3b6";
      snowCtx.beginPath();
      snowCtx.ellipse(x, y, r * 0.83, r, 0, 0, TAU);
      snowCtx.fill();
      snowCtx.fillStyle = "#fffdf5";
      snowCtx.beginPath();
      snowCtx.arc(x - r * 0.15, y - r * 0.2, r * 0.6, 0, TAU);
      snowCtx.fill();
    }
    snowCtx.globalAlpha = 1;
  }
  function updateControl() {
    button.textContent = paused ? "Play animation" : "Pause animation";
    button.setAttribute("aria-pressed", String(paused));
  }
  function tick(now) {
    raf = 0;
    if (paused || document.hidden) return;
    if (last) elapsed += Math.min((now - last) / 1000, 0.1);
    last = now;
    const pose = Math.floor(elapsed * 12);
    if (inView && pose !== lastScene) {
      draw(elapsed);
      lastScene = pose;
    }
    if (now - lastSnow >= 1000 / 30) {
      drawSnow(elapsed);
      lastSnow = now;
    }
    raf = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf);
    raf = 0;
    last = 0;
    updateControl();
    if (ready && !paused && !document.hidden) raf = requestAnimationFrame(tick);
  }
  button.addEventListener("click", () => {
    paused = !paused;
    sync();
  });
  reduce.addEventListener("change", () => {
    paused = reduce.matches;
    if (paused) {
      elapsed = 10.8;
      if (ready) draw(elapsed);
      snowCtx.clearRect(0, 0, snowWidth, snowHeight);
    }
    sync();
  });
  document.addEventListener("visibilitychange", sync);
  addEventListener(
    "resize",
    () => {
      resizeSnow();
      if (ready && !reduce.matches) drawSnow(elapsed);
    },
    { passive: true },
  );
  new IntersectionObserver(
    (entries) => {
      inView = entries[0].isIntersecting;
    },
    { threshold: 0 },
  ).observe(stage);
  resizeSnow();
  Promise.all(
    ["tree", "walk-views"].map(
      (name) =>
        new Promise((resolve, reject) => {
          const im = new Image();
          im.onload = () => {
            sprites[name] = {
              im,
              box:
                name === "tree"
                  ? [227, 17, 767, 1235]
                  : [0, 0, im.width, im.height],
            };
            resolve();
          };
          im.onerror = reject;
          im.src = "/assets/christmas-motion/" + name + ".webp";
        }),
    ),
  )
    .then(() => {
      ready = true;
      elapsed = paused ? 10.8 : 5;
      draw(elapsed);
      stage.classList.add("motion-ready");
      button.hidden = false;
      sync();
    })
    .catch(() => {
      /* Keep the original static artwork if either asset cannot load. */
    });
})();
