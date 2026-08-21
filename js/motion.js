import { animate, createTimeline, stagger } from "https://cdn.jsdelivr.net/npm/animejs@4.3.6/+esm";

const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const rand = (min, max) => min + Math.random() * (max - min);

const splitChars = (el) => {
  if (!el || el.dataset.split === "1") return $$(".char-inner", el);
  const text = el.textContent;
  el.dataset.split = "1";
  el.setAttribute("aria-label", text);
  el.innerHTML = [...text]
    .map((ch) =>
      ch === " "
        ? `<span class="char space">&nbsp;</span>`
        : `<span class="char"><span class="char-inner">${ch}</span></span>`
    )
    .join("");
  return $$(".char-inner", el);
};

const splitWords = (el) => {
  if (!el || el.dataset.words === "1") return $$(".word", el);
  el.dataset.words = "1";
  el.innerHTML = el.textContent
    .trim()
    .split(/\s+/)
    .map((w) => `<span class="word">${w}</span>`)
    .join(" ");
  return $$(".word", el);
};

const whenVisible = (el, fn) => {
  if (!el) return;
  if (reduced) return fn();
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fn();
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  io.observe(el);
};

const playIntro = () => {
  const intro = $(".intro");
  if (!intro || intro.classList.contains("is-gone")) return;

  const kicker = $(".intro-kicker");
  const enter = $(".enter");
  const lines = $$(".intro h1 .line");
  const chars = lines.flatMap((line) => splitChars(line));
  const rings = $$(".intro-mark .ring");

  const field = document.createElement("div");
  field.className = "intro-orbs";
  field.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 14; i += 1) {
    const orb = document.createElement("span");
    orb.className = "orb";
    field.append(orb);
  }
  intro.append(field);

  let leaving = false;
  let introTl;
  const finish = () => window.KM_markEntered?.();
  const leave = () => {
    if (leaving || intro.classList.contains("is-gone")) return;
    leaving = true;
    introTl?.pause();
    if (reduced) {
      finish();
      return;
    }
    const safety = setTimeout(finish, 1600);
    const out = createTimeline({
      defaults: { ease: "in(3)" },
      onComplete: () => {
        clearTimeout(safety);
        finish();
      },
    });
    if (chars.length) {
      out.add(chars, {
        y: "-120%",
        opacity: 0,
        duration: 640,
        delay: stagger(16, { from: "center" }),
      });
    }
    const orbs = $$(".orb");
    if (orbs.length) out.add(orbs, { scale: 0, opacity: 0, duration: 420, delay: stagger(12) }, 0);
    out.add([kicker, enter, ".intro-mark"].filter(Boolean), { opacity: 0, duration: 480 }, 60);
    out.add(intro, { opacity: 0, duration: 700 }, 160);
  };
  window.KM_playIntroLeave = leave;

  if (reduced) return;

  rings.forEach((ring) => {
    const len = ring.getTotalLength();
    ring.style.strokeDasharray = `${len}`;
    ring.style.strokeDashoffset = `${len}`;
  });

  introTl = createTimeline({ defaults: { ease: "out(3)" } });
  const tl = introTl;
  tl.add(".intro-mark", { opacity: [0, 1], duration: 500 }, 0);
  tl.add(
    rings,
    {
      strokeDashoffset: 0,
      duration: 1400,
      delay: stagger(160),
      ease: "inOut(2)",
    },
    80
  );
  tl.add(
    chars,
    {
      y: ["110%", "0%"],
      opacity: [0, 1],
      rotate: [8, 0],
      duration: 880,
      delay: stagger(26),
    },
    240
  );
  tl.add(kicker, { opacity: [0, 1], y: [14, 0], letterSpacing: ["0.7em", "0.42em"], duration: 900 }, 160);
  tl.add(enter, { opacity: [0, 1], y: [18, 0], duration: 700 }, "-=420");
  tl.add(".intro-mark", { rotate: "1turn", duration: 28000, ease: "linear", loop: true }, 800);
  tl.add(".ring-b", { rotate: "-1turn", duration: 18000, ease: "linear", loop: true }, 800);

  $$(".orb").forEach((orb, i) => {
    orb.style.left = `${rand(6, 94)}%`;
    orb.style.top = `${rand(8, 92)}%`;
    animate(orb, {
      opacity: [0, 0.55, 0.15],
      scale: [0, 1, 0.7],
      x: () => rand(-40, 40),
      y: () => rand(-50, 50),
      duration: () => rand(4000, 8000),
      delay: i * 90,
      ease: "inOutSine",
      loop: true,
      alternate: true,
    });
  });
};

const playHero = () => {
  const hero = $(".hero");
  if (!hero || reduced) return;
  const img = $("img", hero);
  const copy = $$(".hero-copy p, .hero-copy h2, .scroll-hint");
  if (img) {
    animate(img, { scale: [1.18, 1.04], duration: 2800, ease: "out(2)" });
    animate(hero, {
      clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
      duration: 1200,
      ease: "inOut(3)",
    });
  }
  animate(copy, {
    opacity: [0, 1],
    y: [28, 0],
    delay: stagger(90, { start: 480 }),
    duration: 820,
    ease: "out(3)",
  });
  const hint = $(".scroll-hint");
  if (hint) {
    animate(hint, {
      y: [0, 10],
      opacity: [0.45, 1],
      duration: 1000,
      ease: "inOutSine",
      loop: true,
      alternate: true,
    });
  }

  if (img && fine) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      animate(img, {
        x: px * 24,
        y: py * 16,
        duration: 650,
        ease: "out(3)",
      });
    });
  }
};

const playTicker = () => {
  const track = $(".ticker-track");
  if (!track || reduced) return;
  animate(track, {
    x: ["0%", "-50%"],
    duration: 28000,
    ease: "linear",
    loop: true,
  });
};

const playProgress = () => {
  const bar = document.createElement("div");
  bar.className = "progress";
  document.body.append(bar);
  if (reduced) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? scrollY / max : 0;
    animate(bar, { scaleX: p, duration: 180, ease: "out(2)" });
  };
  window.addEventListener("scroll", update, { passive: true });
  update();
};

const playParallax = () => {
  if (reduced) return;
  const heroImg = $(".hero img");
  const frames = $$(".frame img, .about-photo img");
  window.addEventListener(
    "scroll",
    () => {
      if (heroImg) {
        animate(heroImg, { y: scrollY * 0.18, duration: 0 });
      }
      frames.forEach((img, i) => {
        const rect = img.getBoundingClientRect();
        const p = (rect.top / innerHeight - 0.5) * (i % 2 === 0 ? 18 : -14);
        animate(img, { y: p, duration: 0 });
      });
    },
    { passive: true }
  );
};

const playMagnetic = () => {
  if (!fine || reduced) return;
  $$(".ghost, .nav a, .wordmark, .email").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - (r.left + r.width / 2);
      const y = e.clientY - (r.top + r.height / 2);
      animate(el, { x: x * 0.28, y: y * 0.28, duration: 280, ease: "out(3)" });
    });
    el.addEventListener("pointerleave", () => {
      animate(el, { x: 0, y: 0, duration: 420, ease: "out(4)" });
    });
  });
};

const playTilt = () => {
  if (!fine || reduced) return;
  $$(".frame, .short, .preview").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -8;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 10;
      animate(el, { rotateX: rx, rotateY: ry, duration: 350, ease: "out(3)" });
    });
    el.addEventListener("pointerleave", () => {
      animate(el, { rotateX: 0, rotateY: 0, duration: 500, ease: "out(4)" });
    });
  });
};

const playCursor = () => {
  const dot = $(".cursor");
  if (!dot || !fine || reduced) return;
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.append(ring);
  let x = 0;
  let y = 0;
  let rx = 0;
  let ry = 0;
  window.addEventListener(
    "pointermove",
    (e) => {
      x = e.clientX;
      y = e.clientY;
      animate(dot, { x, y, duration: 80, ease: "out(1)" });
      animate(ring, { x, y, duration: 420, ease: "out(3)" });
    },
    { passive: true }
  );
  document.addEventListener("pointerover", (e) => {
    if (e.target.closest("a, button, .series-row, .frame, .gallery img")) {
      animate(ring, { scale: 1.85, duration: 280, ease: "out(3)" });
    }
  });
  document.addEventListener("pointerout", (e) => {
    if (e.target.closest("a, button, .series-row, .frame, .gallery img")) {
      animate(ring, { scale: 1, duration: 280, ease: "out(3)" });
    }
  });
};

const playGrain = () => {
  const grain = $(".grain");
  if (!grain || reduced) return;
  animate(grain, {
    opacity: [0.07, 0.14],
    duration: 2400,
    ease: "inOutSine",
    loop: true,
    alternate: true,
  });
};

const playPageLinks = () => {
  if (reduced) return;
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#") || a.target === "_blank") return;
    e.preventDefault();
    const curtain = document.createElement("div");
    curtain.className = "curtain";
    document.body.append(curtain);
    animate(curtain, {
      y: ["100%", "0%"],
      duration: 520,
      ease: "in(3)",
      onComplete: () => {
        location.href = a.href;
      },
    });
  });
};

const playPage = () => {
  const header = $(".site-header");
  if (header && !reduced) {
    animate($$(".site-header .wordmark, .nav a, .nav-toggle"), {
      opacity: [0, 1],
      y: [-14, 0],
      delay: stagger(60),
      duration: 700,
      ease: "out(3)",
    });
  }

  $$(".page-hero h1, .series-top h1, .contact-block .email").forEach((el) => {
    const chars = splitChars(el);
    if (reduced) return;
    animate(chars, {
      y: ["110%", "0%"],
      opacity: [0, 1],
      delay: stagger(16),
      duration: 720,
      ease: "out(3)",
    });
  });

  $$(".section-head").forEach((head) => {
    const line = document.createElement("span");
    line.className = "head-line";
    head.append(line);
    whenVisible(head, () => {
      animate(head, { opacity: [0, 1], y: [18, 0], duration: 700, ease: "out(3)" });
      animate(line, { scaleX: [0, 1], duration: 900, ease: "inOut(3)", delay: 120 });
    });
  });

  $$(".statement h2").forEach((el) => {
    const words = splitWords(el);
    whenVisible(el, () => {
      animate(words, {
        opacity: [0, 1],
        y: [22, 0],
        delay: stagger(28),
        duration: 640,
        ease: "out(3)",
      });
    });
  });

  $$(".about-copy p, .cv div, .film-head, .film p").forEach((el) => {
    el.classList.add("will-animate");
    whenVisible(el, () => {
      animate(el, { opacity: [0, 1], y: [28, 0], duration: 800, ease: "out(3)" });
    });
  });

  const rows = $$(".series-row");
  if (rows.length && !reduced) {
    whenVisible(rows[0], () => {
      animate(rows, {
        opacity: [0, 1],
        x: [-28, 0],
        delay: stagger(80),
        duration: 760,
        ease: "out(3)",
      });
    });
  }

  const frames = $$(".frame");
  if (frames.length && !reduced) {
    whenVisible(frames[0], () => {
      animate(frames, {
        clipPath: ["inset(100% 0 0 0)", "inset(0% 0 0 0)"],
        opacity: [0.4, 1],
        delay: stagger(120),
        duration: 1000,
        ease: "inOut(3)",
      });
    });
    frames.forEach((frame) => {
      const img = $("img", frame);
      frame.addEventListener("pointerenter", () => {
        if (img) animate(img, { scale: 1.08, duration: 900, ease: "out(3)" });
      });
      frame.addEventListener("pointerleave", () => {
        if (img) animate(img, { scale: 1, duration: 800, ease: "out(3)" });
      });
    });
  }

  $$(".series-row, .ghost").forEach((el) => {
    el.addEventListener("pointerenter", () => {
      if (reduced) return;
      animate(el, { scale: 1.02, duration: 260, ease: "out(3)" });
    });
    el.addEventListener("pointerleave", () => {
      if (reduced) return;
      animate(el, { scale: 1, duration: 300, ease: "out(3)" });
    });
  });

  const preview = $(".preview");
  if (preview && !reduced) {
    const obs = new MutationObserver(() => {
      if (preview.classList.contains("is-on")) {
        animate(preview, { scale: [0.86, 1], rotate: [-2, 0], duration: 480, ease: "out(4)" });
        const img = $("img", preview);
        if (img) animate(img, { scale: [1.12, 1], duration: 900, ease: "out(3)" });
      }
    });
    obs.observe(preview, { attributes: true, attributeFilter: ["class"] });
  }

  const galleryFigs = $$("[data-gallery] figure");
  if (galleryFigs.length && !reduced) {
    animate(galleryFigs, {
      opacity: [0, 1],
      x: [48, 0],
      rotate: [3, 0],
      delay: stagger(80),
      duration: 720,
      ease: "out(3)",
    });
  }

  const shorts = $$(".short");
  if (shorts.length && !reduced) {
    animate(shorts, {
      opacity: [0, 1],
      y: [40, 0],
      scale: [0.96, 1],
      delay: stagger(110),
      duration: 740,
      ease: "out(3)",
    });
  }

  $$(".film-embed, .short-embed").forEach((el) => {
    whenVisible(el, () => {
      animate(el, {
        clipPath: ["inset(0 0 100% 0)", "inset(0 0 0% 0)"],
        duration: 900,
        ease: "inOut(3)",
      });
    });
  });
};

const playCurtain = () => {
  const curtain = document.createElement("div");
  curtain.className = "curtain";
  document.body.append(curtain);
  if (reduced) {
    curtain.remove();
    return;
  }
  animate(curtain, {
    y: ["0%", "-105%"],
    duration: 920,
    ease: "inOut(3)",
    delay: 60,
    onComplete: () => curtain.remove(),
  });
};

playCurtain();
playIntro();
playHero();
playTicker();
playProgress();
playParallax();
playMagnetic();
playTilt();
playCursor();
playGrain();
playPageLinks();
playPage();
