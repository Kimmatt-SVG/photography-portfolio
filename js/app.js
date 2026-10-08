(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  const year = new Date().getFullYear();
  $$("[data-year]").forEach((el) => {
    el.textContent = year;
  });
  $$("[data-site-name]").forEach((el) => {
    el.textContent = SITE.name;
  });
  $$("[data-first]").forEach((el) => {
    el.textContent = SITE.firstName;
  });
  $$("[data-last]").forEach((el) => {
    el.textContent = SITE.lastName;
  });
  $$("[data-location]").forEach((el) => {
    el.textContent = SITE.location;
  });
  $$("[data-email]").forEach((el) => {
    if (SITE.email) {
      el.textContent = SITE.email;
      if (el.tagName === "A") el.href = `mailto:${SITE.email}`;
    } else {
      el.textContent = "Inquiries on request";
      if (el.tagName === "A") el.removeAttribute("href");
    }
  });
  $$("[data-instagram]").forEach((el) => {
    if (SITE.instagram) {
      el.href = SITE.instagram;
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  const intro = $(".intro");
  const enter = $(".enter");
  const seen = sessionStorage.getItem("km-entered");
  const dismissIntro = () => {
    intro?.classList.add("is-gone");
    document.body.classList.remove("intro-open");
    sessionStorage.setItem("km-entered", "1");
  };
  if (intro && !seen) {
    document.body.classList.add("intro-open");
  } else {
    intro?.classList.add("is-gone");
  }

  window.KM_markEntered = dismissIntro;

  const requestLeave = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (typeof window.KM_playIntroLeave === "function") {
      window.KM_playIntroLeave();
      setTimeout(() => {
        if (intro && !intro.classList.contains("is-gone")) dismissIntro();
      }, 1600);
      return;
    }
    dismissIntro();
  };
  enter?.addEventListener("click", requestLeave);
  intro?.addEventListener("click", (e) => {
    if (e.target.closest("a")) return;
    requestLeave(e);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    if (!intro || intro.classList.contains("is-gone")) return;
    requestLeave(e);
  });

  const heroStage = $(".hero-stage");
  if (heroStage && typeof SERIES !== "undefined") {
    const shuffle = (list) => {
      const pool = [...list];
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      return pool;
    };
    const isLandscape = (src) =>
      new Promise((resolve) => {
        const probe = new Image();
        probe.onload = () => resolve(probe.naturalWidth > probe.naturalHeight);
        probe.onerror = () => resolve(false);
        probe.src = src;
      });
    const fillHero = (slides) => {
      if (!slides.length) return;
      heroStage.replaceChildren();
      slides.forEach((slide, i) => {
        const img = document.createElement("img");
        img.src = slide.src;
        img.alt = slide.alt;
        img.decoding = "async";
        if (i === 0) img.classList.add("is-on");
        heroStage.append(img);
      });
      window.KM_playHeroCycle?.();
    };
    Promise.all(
      SERIES.map(async (s) => {
        const checked = await Promise.all(
          s.images.map(async (slide) => ({ slide, wide: await isLandscape(slide.src) }))
        );
        return shuffle(checked.filter((item) => item.wide).map((item) => item.slide)).slice(0, 3);
      })
    ).then((groups) => fillHero(shuffle(groups.flat())));
  }

  const indexRoot = $("[data-series-index]");
  if (indexRoot) {
    indexRoot.innerHTML = SERIES.map(
      (s) => `
      <a class="series-row" href="work/${s.id}.html" data-cover="${s.cover}" data-view>
        <span class="num">${s.number}</span>
        <h3>${s.title}</h3>
        <span class="meta">${s.category}</span>
        <span class="year">${s.year}</span>
      </a>`
    ).join("");
  }

  const filmRoot = $("[data-film-index]");
  if (filmRoot && typeof FILMS !== "undefined") {
    filmRoot.innerHTML = FILMS.map(
      (f) => `
      <a class="series-row" href="films.html#${f.id}" data-cover="https://i.ytimg.com/vi/${f.youtubeId}/maxresdefault.jpg" data-wide="1" data-view>
        <span class="num">${f.number}</span>
        <h3>${f.title}</h3>
        <span class="meta">${f.runtime}</span>
        <span class="year">${f.year}</span>
      </a>`
    ).join("");
  }

  const shortsRoot = $("[data-shorts]");
  if (shortsRoot && typeof SHORTS !== "undefined") {
    shortsRoot.innerHTML = SHORTS.map(
      (s) => `
      <figure class="short">
        <div class="short-embed">
          <iframe
            src="https://www.youtube-nocookie.com/embed/${s.id}"
            title="${s.youtubeTitle}"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowfullscreen
          ></iframe>
        </div>
        <figcaption>
          <strong>${s.title}</strong>
          <span>${s.runtime} · ${s.views} views</span>
        </figcaption>
      </figure>`
    ).join("");
  }

  const seriesId = document.body.dataset.series;
  if (seriesId) {
    const series = SERIES.find((s) => s.id === seriesId);
    if (series) {
      $("[data-series-title]") && ($("[data-series-title]").textContent = series.title);
      $("[data-series-kicker]") &&
        ($("[data-series-kicker]").textContent = `${series.category}  ·  ${series.year}`);
      $("[data-series-statement]") &&
        ($("[data-series-statement]").textContent = series.statement);
      const gallery = $("[data-gallery]");
      gallery.innerHTML = series.images
        .map(
          (img, i) => `
          <figure>
            <img src="../${img.src}" alt="${img.alt}" data-full="../${img.src}" data-index="${i}" loading="${i === 0 ? "eager" : "lazy"}" />
          </figure>`
        )
        .join("");

      const counter = $("[data-counter]");
      if (counter) {
        const n = series.images.length;
        counter.textContent = `${String(n).padStart(2, "0")} photographs`;
      }

      const prev = SERIES[(SERIES.findIndex((s) => s.id === seriesId) + SERIES.length - 1) % SERIES.length];
      const next = SERIES[(SERIES.findIndex((s) => s.id === seriesId) + 1) % SERIES.length];
      const prevA = $("[data-prev]");
      const nextA = $("[data-next]");
      if (prevA) {
        prevA.href = `${prev.id}.html`;
        prevA.textContent = `Prev  —  ${prev.title}`;
      }
      if (nextA) {
        nextA.href = `${next.id}.html`;
        nextA.textContent = `${next.title}  —  Next`;
      }

      const lightbox = $(".lightbox");
      const lightImg = lightbox?.querySelector("img");
      let lightIndex = 0;
      const showLight = (i) => {
        if (!lightbox || !lightImg) return;
        lightIndex = (i + series.images.length) % series.images.length;
        const frame = series.images[lightIndex];
        lightImg.src = `../${frame.src}`;
        lightImg.alt = frame.alt;
        lightbox.classList.add("is-open");
      };
      gallery.addEventListener("click", (e) => {
        const img = e.target.closest("img");
        if (!img) return;
        showLight(Number(img.dataset.index) || 0);
      });
      lightbox?.addEventListener("click", () => lightbox.classList.remove("is-open"));
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") lightbox?.classList.remove("is-open");
        if (!lightbox?.classList.contains("is-open")) return;
        if (e.key === "ArrowRight") showLight(lightIndex + 1);
        if (e.key === "ArrowLeft") showLight(lightIndex - 1);
      });
    }
  }
})();
