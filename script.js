const menuBtn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");
const year = document.getElementById("year");
const progressBar = document.getElementById("topProgressBar");
const filterRow = document.getElementById("projectFilters");
const projectItems = Array.from(document.querySelectorAll(".project"));
const revealItems = Array.from(document.querySelectorAll(".reveal"));
const parallaxItems = Array.from(document.querySelectorAll("[data-parallax]"));

if (year) year.textContent = new Date().getFullYear();

if (menuBtn && menu) {
  menuBtn.addEventListener("click", () => {
    const isOpen = menu.classList.toggle("open");
    menuBtn.classList.toggle("is-open", isOpen);
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menu.classList.remove("open");
      menuBtn.classList.remove("is-open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

if (progressBar) {
  const updateProgress = () => {
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const percent = total > 0 ? (window.scrollY / total) * 100 : 0;
    progressBar.style.width = `${percent}%`;
  };
  window.addEventListener("scroll", updateProgress);
  updateProgress();
}

if (revealItems.length > 0) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    },
    { threshold: 0.14 }
  );
  revealItems.forEach((item) => observer.observe(item));
}

if (parallaxItems.length > 0) {
  const updateParallax = () => {
    const y = window.scrollY;
    parallaxItems.forEach((item) => {
      const speed = Number(item.dataset.parallax || "0.2");
      item.style.transform = `translateY(${y * speed}px)`;
    });
  };
  window.addEventListener("scroll", updateParallax);
  updateParallax();
}

if (filterRow && projectItems.length > 0) {
  const filterButtons = Array.from(filterRow.querySelectorAll(".filter-btn"));
  filterRow.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const selected = target.dataset.filter || "all";
    filterButtons.forEach((btn) => btn.classList.remove("active"));
    target.classList.add("active");

    projectItems.forEach((project) => {
      const category = project.dataset.category || "";
      const show = selected === "all" || selected === category;
      project.style.display = show ? "" : "none";
    });
  });
}

const lightboxImages = Array.from(document.querySelectorAll("[data-lightbox]"));
if (lightboxImages.length > 0) {
  const lightbox = document.createElement("div");
  lightbox.className = "lightbox";
  lightbox.innerHTML = '<button aria-label="Close lightbox">Close</button><img alt="Preview" />';
  document.body.appendChild(lightbox);

  const lightboxImg = lightbox.querySelector("img");
  const closeBtn = lightbox.querySelector("button");

  lightboxImages.forEach((img) => {
    img.addEventListener("click", () => {
      const src = img.getAttribute("src");
      if (!src || !lightboxImg) return;
      lightboxImg.setAttribute("src", src);
      lightbox.classList.add("open");
    });
  });

  const closeLightbox = () => lightbox.classList.remove("open");
  closeBtn?.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });
}

if (projectItems.length > 0) {
  const toDetailPage = (project) => {
    const params = new URLSearchParams({
      id: project.dataset.projectId || "",
      title: project.dataset.projectTitle || "Project",
      description: project.dataset.projectDescription || "",
      image: project.dataset.projectImage || "",
      model: project.dataset.projectModel || "",
      location: project.dataset.projectLocation || "",
      value: project.dataset.projectValue || "",
      duration: project.dataset.projectDuration || "",
      team: project.dataset.projectTeam || "",
    });
    window.location.href = `project-detail.html?${params.toString()}`;
  };

  projectItems.forEach((project) => {
    const trigger = project.querySelector(".project-open");
    if (trigger) {
      trigger.addEventListener("click", (event) => {
        event.stopPropagation();
        toDetailPage(project);
      });
    }
    project.addEventListener("click", () => toDetailPage(project));
  });
}

const detailTitle = document.getElementById("detailTitle");
if (detailTitle) {
  const params = new URLSearchParams(window.location.search);
  const get = (key, fallback = "") => params.get(key) || fallback;

  const textMap = {
    detailTitle: get("title", "Project Experience"),
    detailDescription: get("description", "Project details are not available."),
    detailLocation: get("location", ""),
    detailValue: get("value", ""),
    detailDuration: get("duration", ""),
    detailTeam: get("team", ""),
  };

  Object.entries(textMap).forEach(([id, value]) => {
    const node = document.getElementById(id);
    if (node) node.textContent = value;
  });

  const detailImage = document.getElementById("detailImage");
  const imageSrc = get("image", "");
  if (detailImage) {
    if (imageSrc) detailImage.setAttribute("src", imageSrc);
    else detailImage.removeAttribute("src");
  }

  const detailModelViewer = document.getElementById("detailModelViewer");
  const detailModelHint = document.getElementById("detailModelHint");
  if (detailModelViewer) {
    const modelSrc = get("model", "3d_assets/Hitem3d-1776090506237.glb");
    if (imageSrc) detailModelViewer.setAttribute("poster", imageSrc);

    const applyModelTint = () => {
      const tint = [0.68, 0.68, 0.66];
      const materials = detailModelViewer.model?.materials || [];
      materials.forEach((material) => {
        const pbr = material.pbrMetallicRoughness;
        if (!pbr) return;
        pbr.setBaseColorFactor(tint);
        pbr.setMetallicFactor(0.18);
        pbr.setRoughnessFactor(0.72);
      });
    };

    const startModelLoad = () => {
      if (detailModelViewer.dataset.lazyModelApplied === "1") return;
      detailModelViewer.dataset.lazyModelApplied = "1";
      detailModelViewer.setAttribute("src", modelSrc);
      detailModelViewer.addEventListener("load", () => {
        applyModelTint();
        if (detailModelHint) detailModelHint.textContent = "Interactive 3D is ready—orbit, zoom, and inspect the model.";
      }, { once: true });
    };

    const heroMount = document.querySelector(".project-detail-hero-grid");
    if (heroMount && "IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            startModelLoad();
            io.disconnect();
          }
        },
        { rootMargin: "180px 0px", threshold: 0.06 }
      );
      io.observe(heroMount);
    } else {
      startModelLoad();
    }
  }
}

const interactiveCards = Array.from(
  document.querySelectorAll(".card, .service, .project, .model-card, .contact-card")
);
interactiveCards.forEach((card) => {
  card.addEventListener("mousemove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const rotateY = ((x / rect.width) - 0.5) * 8;
    const rotateX = (0.5 - (y / rect.height)) * 8;
    card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "";
  });
});

const magneticElements = Array.from(document.querySelectorAll(".btn, .contact-action, .filter-btn"));
magneticElements.forEach((element) => {
  element.addEventListener("mousemove", (event) => {
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    element.style.transform = `translate(${x * 0.1}px, ${y * 0.1}px)`;
  });
  element.addEventListener("mouseleave", () => {
    element.style.transform = "";
  });
});

const cursorGlow = document.createElement("div");
cursorGlow.className = "cursor-glow";
document.body.appendChild(cursorGlow);
window.addEventListener("mousemove", (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
});

const ambientCanvas = document.createElement("canvas");
ambientCanvas.className = "ambient-canvas";
document.body.appendChild(ambientCanvas);
const ctx = ambientCanvas.getContext("2d");
let particles = [];

const setupCanvas = () => {
  ambientCanvas.width = window.innerWidth;
  ambientCanvas.height = window.innerHeight;
  particles = Array.from({ length: Math.min(48, Math.floor(window.innerWidth / 30)) }, () => ({
    x: Math.random() * ambientCanvas.width,
    y: Math.random() * ambientCanvas.height,
    r: Math.random() * 1.8 + 0.6,
    vx: (Math.random() - 0.5) * 0.35,
    vy: (Math.random() - 0.5) * 0.35,
  }));
};

const animateAmbient = () => {
  if (!ctx) return;
  ctx.clearRect(0, 0, ambientCanvas.width, ambientCanvas.height);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.x < 0 || p.x > ambientCanvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > ambientCanvas.height) p.vy *= -1;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(95, 174, 204, 0.30)";
    ctx.fill();
  });
  requestAnimationFrame(animateAmbient);
};

setupCanvas();
animateAmbient();
window.addEventListener("resize", setupCanvas);
