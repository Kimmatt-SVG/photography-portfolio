import { animate, createTimeline, stagger, onScroll } from "https://cdn.jsdelivr.net/npm/animejs@4.3.6/+esm";

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
  const rule = $(".intro-rule");
  const inner = $(".intro-inner");
  const mark = $(".intro-mark");
  const lines = $$(".intro h1 .line");
  const chars = lines.flatMap((line) => splitChars(line));
  const rings = $$(".intro-mark .ring");

  const field = document.createElement("div");
  field.className = "intro-orbs";
  field.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 12; i += 1) {
    const orb = document.createElement("span");
    orb.className = "orb";
    orb.style.left = `${rand(8, 92)}%`;
    orb.style.top = `${rand(10, 90)}%`;
    field.append(orb);
  }
  intro.append(field);

  let leaving = false;
  let introTl;
  const finish = () => {
    if (intro.classList.contains("is-gone")) {
      playHero();
      return;
    }
    window.KM_markEntered?.();
    playHero();
  };
  const leave = () => {
    if (leaving || intro.classList.contains("is-gone")) return;
    leaving = true;
    introTl?.pause();
    if (reduced) {
      finish();
      return;
    }
    const safety = setTimeout(finish, 1400);
    const out = createTimeline({
      defaults: { ease: "in(3)" },
      onComplete: () => {
        clearTimeout(safety);
        finish();
      },
    });
    if (chars.length) {
      out.add(
        chars,
        {
          y: "110%",
          opacity: 0,
          duration: 520,
          delay: stagger(12, { from: "center" }),
        },
        0
      );
    }
    out.add([kicker, enter, rule, mark].filter(Boolean), { opacity: 0, duration: 360 }, 40);
    out.add($$(".orb", intro), { opacity: 0, duration: 280 }, 0);
    out.add(inner, { scale: 0.96, duration: 420 }, 0);
    out.add(intro, { opacity: 0, duration: 640 }, 180);
  };
  window.KM_playIntroLeave = leave;

  if (reduced) return;

  rings.forEach((ring) => {
    const len = ring.getTotalLength();
    ring.style.strokeDasharray = `${len}`;
    ring.style.strokeDashoffset = `${len}`;
  });

  introTl = createTimeline({ defaults: { ease: "out(3)" } });
  introTl.add(mark, { opacity: [0, 1], scale: [0.88, 1], duration: 700 }, 0);
  introTl.add(
    rings,
    {
      strokeDashoffset: 0,
      duration: 1300,
      delay: stagger(140),
      ease: "inOut(2)",
    },
    80
  );
  introTl.add(
    chars,
    {
      y: ["110%", "0%"],
      opacity: [0, 1],
      duration: 820,
      delay: stagger(24),
    },
    120
  );
  introTl.add(kicker, { opacity: [0, 1], y: [16, 0], duration: 700 }, 80);
  if (rule) introTl.add(rule, { scaleX: [0, 1], duration: 720, ease: "inOut(3)" }, 360);
  introTl.add(enter, { opacity: [0, 1], y: [18, 0], duration: 680 }, 480);
  introTl.add(mark, { rotate: "1turn", duration: 28000, ease: "linear", loop: true }, 800);

  $$(".orb", intro).forEach((orb, i) => {
    animate(orb, {
      opacity: [0, 0.5, 0.12],
      x: () => rand(-36, 36),
      y: () => rand(-40, 40),
      duration: () => rand(4200, 7600),
      delay: i * 80,
      ease: "inOutSine",
      loop: true,
      alternate: true,
    });
  });
};

let heroPlayed = false;
const playHero = () => {
  const hero = $(".hero");
  if (!hero || reduced || heroPlayed) return;
  heroPlayed = true;
  const stage = $(".hero-stage", hero) || $("img", hero);
  if (stage) {
    animate(stage, { scale: [1.08, 1], duration: 2400, ease: "out(2)" });
    try {
      animate(stage, {
        y: 48,
        ease: "linear",
        autoplay: onScroll({
          target: hero,
          enter: "top top",
          leave: "bottom top",
          sync: 0.12,
        }),
      });
    } catch (err) {
      /* scroll sync is optional */
    }
  }

  if (stage && fine) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      animate(stage, {
        x: px * 18,
        duration: 650,
        ease: "out(3)",
      });
    });
  }
};

let heroCycleStarted = false;
const playHeroCycle = () => {
  if (heroCycleStarted) return;
  const slides = $$(".hero-stage img");
  if (slides.length < 2 || reduced) return;
  heroCycleStarted = true;
  setInterval(() => {
    const current = slides.findIndex((img) => img.classList.contains("is-on"));
    let next = current;
    while (next === current) next = Math.floor(Math.random() * slides.length);
    slides[current]?.classList.remove("is-on");
    slides[next].classList.add("is-on");
  }, 10000);
};
window.KM_playHeroCycle = playHeroCycle;

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
  const frames = $$(".about-photo img");
  window.addEventListener(
    "scroll",
    () => {
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
  $$(".ghost, .email").forEach((el) => {
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
    if (!href || href.startsWith("http") || href.startsWith("mailto") || href.startsWith("#") || a.target === "_blank") {
      return;
    }
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

  const galleryFigs = $$("[data-gallery] figure");
  if (galleryFigs.length && !reduced) {
    animate(galleryFigs, {
      opacity: [0, 1],
      y: [24, 0],
      delay: stagger(60),
      duration: 720,
      ease: "out(3)",
    });
  }

  const shorts = $$(".short");
  if (shorts.length && !reduced) {
    animate(shorts, {
      opacity: [0, 1],
      y: [40, 0],
      delay: stagger(110),
      duration: 740,
      ease: "out(3)",
    });
  }

  $$(".film-embed, .short-embed").forEach((el) => {
    whenVisible(el, () => {
      animate(el, { opacity: [0, 1], y: [18, 0], duration: 800, ease: "out(3)" });
    });
  });
};

const playCurtain = () => {
  if ($(".intro") && !$(".intro").classList.contains("is-gone")) return;
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
if (!$(".intro") || $(".intro").classList.contains("is-gone")) playHero();
playTicker();
playProgress();
playParallax();
playMagnetic();
playHeroCycle();
playGrain();
playPageLinks();
playPage();
