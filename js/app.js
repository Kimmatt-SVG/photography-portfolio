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

  const cursor = $(".cursor");
  if (cursor && matchMedia("(pointer: fine)").matches) {
    const hoverSel = "a, button, .series-row, .frame, .gallery img";
    document.addEventListener("pointerover", (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.add("is-hover");
      if (e.target.closest("[data-view]")) cursor.classList.add("is-view");
    });
    document.addEventListener("pointerout", (e) => {
      if (e.target.closest(hoverSel)) cursor.classList.remove("is-hover");
      if (e.target.closest("[data-view]")) cursor.classList.remove("is-view");
    });
  } else {
    cursor?.remove();
    document.body.style.cursor = "auto";
  }

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

  const header = $(".site-header");
  let lastY = 0;
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      header?.classList.toggle("is-hidden", y > lastY && y > 80);
      lastY = y;
    },
    { passive: true }
  );

  const toggle = $(".nav-toggle");
  const mobile = $(".mobile-nav");
  toggle?.addEventListener("click", () => {
    const open = mobile.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
  });
  mobile?.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      mobile.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Menu";
    }
  });

  const bindPreview = (rows) => {
    const preview = $(".preview");
    const previewImg = preview?.querySelector("img");
    if (!preview || !previewImg || !matchMedia("(pointer: fine)").matches) return;
    rows.forEach((row) => {
      row.addEventListener("mouseenter", () => {
        previewImg.src = row.dataset.cover;
        preview.classList.toggle("is-wide", row.dataset.wide === "1");
        preview.classList.add("is-on");
      });
      row.addEventListener("mouseleave", () => {
        preview.classList.remove("is-on", "is-wide");
      });
    });
  };

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
    bindPreview($$(".series-row", indexRoot));
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
    bindPreview($$(".series-row", filmRoot));
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

  const frames = $("[data-frames]");
  if (frames) {
    frames.innerHTML = SERIES.slice(0, 3)
      .map(
        (s) => `
        <a class="frame" href="work/${s.id}.html" data-view>
          <img src="${s.cover}" alt="${s.title}" />
          <span>${s.title}</span>
        </a>`
      )
      .join("");
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
      const updateCount = () => {
        const figures = $$("figure", gallery);
        const left = gallery.scrollLeft;
        let idx = 0;
        figures.forEach((fig, i) => {
          if (fig.offsetLeft - gallery.offsetLeft <= left + 40) idx = i;
        });
        if (counter) counter.textContent = `${String(idx + 1).padStart(2, "0")} / ${String(series.images.length).padStart(2, "0")}`;
      };
      gallery.addEventListener("scroll", updateCount, { passive: true });
      updateCount();

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
      gallery.addEventListener("click", (e) => {
        const img = e.target.closest("img");
        if (!img || !lightbox) return;
        lightImg.src = img.dataset.full;
        lightbox.classList.add("is-open");
      });
      lightbox?.addEventListener("click", () => lightbox.classList.remove("is-open"));
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") lightbox?.classList.remove("is-open");
        if (e.key === "ArrowRight") gallery.scrollBy({ left: 420, behavior: "smooth" });
        if (e.key === "ArrowLeft") gallery.scrollBy({ left: -420, behavior: "smooth" });
      });
    }
  }
})();
