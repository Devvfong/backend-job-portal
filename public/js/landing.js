(function () {
  const isProd = window.location.hostname.includes("devqii.me");
  const appOrigin = isProd ? "https://devqii.me" : "http://localhost:3000";

  const links = {
    app: document.getElementById("appLink"),
    jobs: document.getElementById("jobsLink"),
    login: document.getElementById("loginLink"),
  };

  if (links.app) links.app.href = appOrigin;
  if (links.jobs) links.jobs.href = `${appOrigin}/jobs`;
  if (links.login) links.login.href = `${appOrigin}/login`;

  const statusPill = document.getElementById("statusPill");
  const statusText = document.getElementById("statusText");

  const setStatus = (state, label) => {
    if (!statusPill || !statusText) return;
    statusPill.dataset.state = state;
    statusText.textContent = label;
  };

  const formatCount = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}M+`;
    }
    if (value >= 10_000) return `${Math.round(value / 1_000)}k+`;
    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")}k+`;
    }
    return new Intl.NumberFormat().format(value);
  };

  const loadStats = async () => {
    try {
      const [settingsRes, statsRes] = await Promise.all([
        fetch("/api/v1/settings/public"),
        fetch("/api/v1/stats"),
      ]);

      if (settingsRes.ok) {
        const settings = await settingsRes.json();
        if (settings.maintenance_mode === "true" || settings.maintenance_mode === true) {
          setStatus("maintenance", "Maintenance");
        } else {
          setStatus("online", "Operational");
        }
      } else {
        setStatus("online", "Operational");
      }

      if (statsRes.ok) {
        const payload = await statsRes.json();
        const stats = payload.data || {};
        document.querySelectorAll("[data-stat]").forEach((el) => {
          const key = el.getAttribute("data-stat");
          el.textContent = formatCount(stats[key]);
        });
      }
    } catch {
      setStatus("offline", "Unavailable");
    }
  };

  loadStats();
})();