const profile = {
  username: "viton13bussiness-collab",
  email: "viton13bussiness@gmail.com",
  github: "https://github.com/viton13bussiness-collab",
};

const fallbackProjects = [
  {
    name: "Personal Portfolio",
    description:
      "A cinematic one-page portfolio for Tarasov Vitaly Alekseevich with live GitHub data, motion, and static hosting.",
    html_url: profile.github,
    language: "JavaScript",
    stargazers_count: 0,
    forks_count: 0,
    topic: "Live site",
  },
  {
    name: "Design Department System",
    description:
      "A professional visual system with structured departments, strong typography, and responsive composition.",
    html_url: profile.github,
    language: "CSS",
    stargazers_count: 0,
    forks_count: 0,
    topic: "Design",
  },
  {
    name: "IT Project Feed",
    description:
      "The projects section automatically displays public repositories from GitHub when they are available.",
    html_url: profile.github,
    language: "GitHub API",
    stargazers_count: 0,
    forks_count: 0,
    topic: "Automation",
  },
];

const canvas = document.querySelector("#signal-canvas");
const ctx = canvas.getContext("2d");
const pointer = { x: 0, y: 0, active: false };
let nodes = [];
let width = 0;
let height = 0;
let animationFrame = null;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  const count = Math.max(48, Math.min(110, Math.floor((width * height) / 14500)));
  nodes = Array.from({ length: count }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.45,
    vy: (Math.random() - 0.5) * 0.45,
    size: 1 + Math.random() * 1.8,
  }));
}

function drawCanvas() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(246, 242, 232, 0.68)";

  for (const node of nodes) {
    node.x += node.vx;
    node.y += node.vy;

    if (node.x < -20) node.x = width + 20;
    if (node.x > width + 20) node.x = -20;
    if (node.y < -20) node.y = height + 20;
    if (node.y > height + 20) node.y = -20;

    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
    ctx.fill();
  }

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const distance = Math.hypot(dx, dy);

      if (distance < 128) {
        const alpha = (1 - distance / 128) * 0.16;
        ctx.strokeStyle = `rgba(99, 217, 255, ${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  if (pointer.active) {
    const gradient = ctx.createRadialGradient(pointer.x, pointer.y, 0, pointer.x, pointer.y, 190);
    gradient.addColorStop(0, "rgba(232, 255, 88, 0.16)");
    gradient.addColorStop(1, "rgba(232, 255, 88, 0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(pointer.x, pointer.y, 190, 0, Math.PI * 2);
    ctx.fill();
  }

  animationFrame = window.requestAnimationFrame(drawCanvas);
}

function setupCanvas() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resizeCanvas();
  if (!reduceMotion) {
    drawCanvas();
  }

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  });
  window.addEventListener("pointerleave", () => {
    pointer.active = false;
  });
}

function setupReveal() {
  const elements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15 }
  );

  elements.forEach((element) => observer.observe(element));
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
}

function languageLabel(repo) {
  if (repo.language) return repo.language;
  if (repo.topic) return repo.topic;
  return "Project";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function projectCard(repo, index) {
  const description =
    repo.description ||
    "A public GitHub project focused on technical delivery, clean product structure, and practical launch value.";
  const updated = repo.updated_at ? `Updated ${formatDate(repo.updated_at)}` : "Portfolio item";
  const type = repo.topic || languageLabel(repo);
  const meta = [
    languageLabel(repo),
    `${repo.stargazers_count || 0} stars`,
    `${repo.forks_count || 0} forks`,
    updated,
  ];

  return `
    <article class="project-card reveal" style="transition-delay: ${index * 70}ms">
      <div>
        <span class="project-type">${escapeHtml(type)}</span>
        <h3>${escapeHtml(repo.name)}</h3>
        <p>${escapeHtml(description)}</p>
      </div>
      <div class="project-meta">
        ${meta.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
      </div>
      <a class="card-link" href="${escapeHtml(repo.html_url)}" target="_blank" rel="noreferrer" aria-label="Open ${escapeHtml(repo.name)} on GitHub"></a>
    </article>
  `;
}

async function loadGitHub() {
  const repoGrid = document.querySelector("#repo-grid");
  const repoCount = document.querySelector("#repo-count");
  const profileAge = document.querySelector("#profile-age");

  try {
    const [userResponse, repoResponse] = await Promise.all([
      fetch(`https://api.github.com/users/${profile.username}`),
      fetch(`https://api.github.com/users/${profile.username}/repos?sort=updated&per_page=6`),
    ]);

    if (!userResponse.ok || !repoResponse.ok) {
      throw new Error("GitHub API request failed");
    }

    const user = await userResponse.json();
    const repos = await repoResponse.json();
    if (repoCount) {
      repoCount.textContent = user.public_repos ?? "0";
    }
    if (profileAge) {
      profileAge.textContent = user.created_at ? new Date(user.created_at).getFullYear() : "2024";
    }

    const visibleRepos = repos
      .filter((repo) => !repo.fork)
      .slice(0, 6);

    repoGrid.innerHTML = (visibleRepos.length ? visibleRepos : fallbackProjects)
      .map(projectCard)
      .join("");
  } catch (error) {
    repoGrid.innerHTML = fallbackProjects.map(projectCard).join("");
  }

  setupReveal();
}

function setupCards() {
  document.addEventListener("pointermove", (event) => {
    for (const card of document.querySelectorAll(".project-card, .craft-item")) {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
    }
  });
}

function init() {
  document.querySelector("#year").textContent = new Date().getFullYear();
  setupCanvas();
  setupReveal();
  setupCards();
  loadGitHub();
}

init();

window.addEventListener("beforeunload", () => {
  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame);
  }
});
