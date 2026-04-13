document.addEventListener("DOMContentLoaded", function () {

const hoursRows = document.querySelectorAll(".hours-row[data-day]");

function getRomeDate() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(now);

  const values = Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  return {
    day: new Date(`${values.year}-${values.month}-${values.day}T12:00:00`).getDay(),
    hour: Number(values.hour),
    minute: Number(values.minute)
  };
}

function highlightTodayHours() {
  if (!hoursRows.length) return;

  const rome = getRomeDate();
  const today = String(rome.day);
  const closedDays = ["0", "1"];
  const schedule = { "2": [9, 19], "3": [9, 19], "4": [9, 19], "5": [9, 19], "6": [8, 18] };

  hoursRows.forEach((row) => {
    const isToday = row.dataset.day === today;
    row.classList.toggle("is-today", isToday);
    if (closedDays.includes(row.dataset.day)) row.classList.add("is-closed");
    if (isToday) row.setAttribute("aria-current", "date");
    else row.removeAttribute("aria-current");
  });

  /* Status indicator */
  var statusEl = document.getElementById("hours-status");
  if (!statusEl) return;

  var hours = schedule[today];
  var html = "";

  if (hours) {
    var now = rome.hour * 60 + rome.minute;
    var open = hours[0] * 60;
    var close = hours[1] * 60;

    if (now >= open && now < close) {
      var rem = close - now;
      var h = Math.floor(rem / 60);
      var m = rem % 60;
      var t = h > 0 ? (h + (h === 1 ? " ora" : " ore") + (m > 0 ? " e " + m + " min" : "")) : (m + " min");
      html = '<span class="status-dot is-open"></span>Aperto &mdash; chiudiamo tra ' + t;
    } else {
      html = '<span class="status-dot is-closed"></span>Chiuso ora';
    }
  } else {
    html = '<span class="status-dot is-closed"></span>Chiuso oggi';
  }

  statusEl.innerHTML = html;
}

highlightTodayHours();

/* --- Gallery crossfade with dots --- */
(function initGalleryCrossfade() {
  var slides = document.querySelectorAll(".intro-slide");
  var dotsWrap = document.querySelector(".gallery-dots");
  if (slides.length < 2 || !dotsWrap) return;
  var current = 0;
  var timer;

  /* Build dots */
  slides.forEach(function (_, i) {
    var dot = document.createElement("button");
    dot.className = "gallery-dot" + (i === 0 ? " is-active" : "");
    dot.setAttribute("aria-label", "Foto " + (i + 1));
    dot.addEventListener("click", function () { goTo(i); });
    dotsWrap.appendChild(dot);
  });

  var dots = dotsWrap.querySelectorAll(".gallery-dot");

  function goTo(n) {
    slides[current].classList.remove("is-active");
    dots[current].classList.remove("is-active");
    current = n;
    slides[current].classList.add("is-active");
    dots[current].classList.add("is-active");
    resetTimer();
  }

  function advance() {
    goTo((current + 1) % slides.length);
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(advance, 4000);
  }

  resetTimer();

  /* Pause when not visible */
  var visual = document.querySelector(".intro-visual");
  if (visual && "IntersectionObserver" in window) {
    var visObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) resetTimer();
      else clearInterval(timer);
    }, { threshold: 0.1 });
    visObs.observe(visual);
  }
})();

/* --- Reviews carousel --- */
(function initCarousel() {
  var track = document.querySelector(".carousel-track");
  var prevBtn = document.querySelector(".carousel-prev");
  var nextBtn = document.querySelector(".carousel-next");
  var dotsWrap = document.querySelector(".carousel-dots");
  if (!track || !prevBtn || !nextBtn || !dotsWrap) return;

  var cards = track.querySelectorAll(".review-card");
  var currentPage = 0;
  var totalCards = cards.length;

  function getCardsPerView() {
    if (window.innerWidth <= 720) return 1;
    if (window.innerWidth <= 1024) return 2;
    return 3;
  }

  function getTotalPages() {
    return Math.ceil(totalCards / getCardsPerView());
  }

  function buildDots() {
    dotsWrap.innerHTML = "";
    var total = getTotalPages();
    for (var i = 0; i < total; i++) {
      var dot = document.createElement("button");
      dot.className = "carousel-dot" + (i === currentPage ? " is-active" : "");
      dot.setAttribute("aria-label", "Pagina " + (i + 1));
      dot.addEventListener("click", (function (idx) {
        return function () { goToPage(idx); };
      })(i));
      dotsWrap.appendChild(dot);
    }
  }

  function updateDots() {
    var dots = dotsWrap.querySelectorAll(".carousel-dot");
    dots.forEach(function (dot, i) {
      dot.classList.toggle("is-active", i === currentPage);
    });
  }

  function updateArrows() {
    prevBtn.disabled = currentPage === 0;
    nextBtn.disabled = currentPage >= getTotalPages() - 1;
  }

  function goToPage(n) {
    var total = getTotalPages();
    currentPage = Math.max(0, Math.min(n, total - 1));
    var cpv = getCardsPerView();
    var gap = parseFloat(getComputedStyle(track).gap) || 14.4;
    var cardW = cards[0].offsetWidth;
    var offset = currentPage * cpv * (cardW + gap);
    var maxOffset = track.scrollWidth - track.parentElement.offsetWidth;
    offset = Math.min(offset, Math.max(0, maxOffset));
    track.style.transform = "translateX(-" + offset + "px)";
    updateDots();
    updateArrows();
  }

  prevBtn.addEventListener("click", function () { goToPage(currentPage - 1); });
  nextBtn.addEventListener("click", function () { goToPage(currentPage + 1); });

  /* Touch swipe */
  var startX = 0, startY = 0, isDragging = false;
  track.addEventListener("touchstart", function (e) {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });
  track.addEventListener("touchmove", function (e) {
    if (!isDragging) return;
    if (Math.abs(e.touches[0].clientX - startX) > Math.abs(e.touches[0].clientY - startY) && Math.abs(e.touches[0].clientX - startX) > 10) {
      e.preventDefault();
    }
  }, { passive: false });
  track.addEventListener("touchend", function (e) {
    if (!isDragging) return;
    isDragging = false;
    var diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      goToPage(diff < 0 ? currentPage + 1 : currentPage - 1);
    }
  }, { passive: true });

  /* Resize */
  var resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var total = getTotalPages();
      if (currentPage >= total) currentPage = total - 1;
      buildDots();
      goToPage(currentPage);
    }, 200);
  });

  buildDots();
  updateArrows();
})();

/* --- Reviews badge animation --- */
(function initReviewsAnimation() {
  var badge = document.querySelector(".reviews-badge");
  if (!badge || !("IntersectionObserver" in window)) return;

  var counter = badge.querySelector(".reviews-counter");
  var stars = badge.querySelectorAll(".review-star");
  var animated = false;

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting && !animated) {
        animated = true;
        observer.unobserve(badge);
        var start = performance.now();
        var duration = 1500;
        function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          counter.textContent = (eased * 5).toFixed(1);
          if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
        stars.forEach(function (star, i) {
          setTimeout(function () { star.classList.add("is-filled"); }, 300 + i * 180);
        });
      }
    });
  }, { threshold: 0.3 });

  observer.observe(badge);
})();

/* --- Read more toggle --- */
(function initReadMore() {
  var wraps = document.querySelectorAll(".review-text-wrap");
  wraps.forEach(function (wrap) {
    requestAnimationFrame(function () {
      if (wrap.scrollHeight > wrap.clientHeight + 2) {
        var btn = document.createElement("button");
        btn.className = "review-read-more is-visible";
        btn.textContent = "Leggi tutto";
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          var expanded = wrap.classList.toggle("is-expanded");
          btn.textContent = expanded ? "Chiudi" : "Leggi tutto";
        });
        wrap.parentElement.appendChild(btn);
      }
    });
  });
})();

/* --- Product overlay toggle --- */
(function initProducts() {
  var cards = document.querySelectorAll(".product-card");
  if (!cards.length) return;
  cards.forEach(function (card) {
    card.addEventListener("click", function () {
      var wasOpen = card.classList.contains("is-open");
      cards.forEach(function (c) { c.classList.remove("is-open"); });
      if (!wasOpen) card.classList.add("is-open");
    });
  });
})();

/* --- Reveal on scroll --- */
(function initReveal() {
  var els = document.querySelectorAll(".reveal");
  if (!els.length || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("is-visible"); });
    return;
  }
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
  els.forEach(function (el) { observer.observe(el); });
})();

/* --- Parallax hero background --- */
(function initParallax() {
  var hero = document.querySelector(".hero");
  if (!hero || window.innerWidth < 768) return;
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        var y = window.scrollY;
        if (y <= hero.offsetHeight) {
          hero.style.setProperty("--parallax-y", (y * 0.3) + "px");
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });
})();


/* --- Smooth scroll solo per anchor link --- */
document.querySelectorAll('a[href^="#"]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    var target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

(function initCookieBanner() {
  var banner = document.getElementById("cookie-banner");
  var acceptBtn = document.getElementById("cookie-accept");
  var rejectBtn = document.getElementById("cookie-reject");
  var closeBtn = document.getElementById("cookie-close");
  var manageBtn = document.getElementById("cookie-manage");
  var mapContainer = document.getElementById("map-container");
  if (!banner) return;

  function loadMap() {
    if (!mapContainer || mapContainer.querySelector("iframe")) return;
    var src = mapContainer.dataset.src;
    if (!src) return;
    var iframe = document.createElement("iframe");
    iframe.title = "Mappa del negozio A PUT\u00ccA DEL BARB\u00c9E";
    iframe.src = src;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "no-referrer-when-downgrade";
    var placeholder = mapContainer.querySelector(".map-placeholder");
    if (placeholder) placeholder.remove();
    mapContainer.appendChild(iframe);
  }

  function hideBanner() {
    banner.hidden = true;
  }

  function reject() {
    localStorage.setItem("cookie-consent", "rejected");
    hideBanner();
  }

  /* Scadenza 6 mesi (linee guida Garante) */
  var SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
  var consentTime = localStorage.getItem("cookie-consent-time");
  var consent = localStorage.getItem("cookie-consent");

  if (consent && consentTime && (Date.now() - Number(consentTime)) > SIX_MONTHS) {
    localStorage.removeItem("cookie-consent");
    localStorage.removeItem("cookie-consent-time");
    consent = null;
  }

  /* Applica scelta precedente al caricamento */
  if (consent === "accepted") {
    loadMap();
  }
  /* Se rejected o nessuna scelta: la mappa NON si carica */

  if (!consent) {
    banner.hidden = false;
  }

  function saveTime() {
    localStorage.setItem("cookie-consent-time", String(Date.now()));
  }

  acceptBtn.addEventListener("click", function () {
    localStorage.setItem("cookie-consent", "accepted");
    saveTime();
    hideBanner();
    loadMap();
  });

  rejectBtn.addEventListener("click", function () {
    reject();
    saveTime();
  });

  /* X chiude il banner = rifiuto (solo cookie tecnici, come da linee guida Garante) */
  if (closeBtn) {
    closeBtn.addEventListener("click", function () { reject(); saveTime(); });
  }

  /* Link "Gestisci cookie" nel footer riapre il banner */
  if (manageBtn) {
    manageBtn.addEventListener("click", function (e) {
      e.preventDefault();
      localStorage.removeItem("cookie-consent");
      /* Rimuovi mappa se presente */
      var iframe = mapContainer && mapContainer.querySelector("iframe");
      if (iframe) {
        iframe.remove();
        var ph = document.createElement("div");
        ph.className = "map-placeholder";
        ph.innerHTML = '<p>La mappa viene mostrata dopo aver accettato i cookie.<br><a href="https://www.google.com/maps?q=Via+Sant%27Albino+16,+20900+Monza+MB" target="_blank" rel="noopener noreferrer">Apri su Google Maps</a></p>';
        mapContainer.appendChild(ph);
      }
      banner.hidden = false;
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    });
  }
})();

}); /* end DOMContentLoaded */
