(function () {
  const isProd = window.location.hostname.includes("devqii.me");
  const appOrigin = isProd ? "https://devqii.me" : "http://localhost:3000";

  const appLink = document.getElementById("appLink");
  const jobsLink = document.getElementById("jobsLink");
  const statusPill = document.getElementById("statusPill");
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const bgMusic = document.getElementById("bgMusic");

  if (appLink) appLink.href = appOrigin;
  if (jobsLink) jobsLink.href = `${appOrigin}/jobs`;

  document.addEventListener(
    "click",
    () => {
      if (bgMusic) bgMusic.play().catch(() => {});
    },
    { once: true },
  );

  const setStatus = (state, label) => {
    statusPill.dataset.state = state;
    statusText.textContent = label;
  };

  const formatCount = (value) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
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
          setStatus("maintenance", "Maintenance mode");
        } else {
          setStatus("online", "All systems operational");
        }
      } else {
        setStatus("online", "API online");
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
      setStatus("offline", "Status unavailable");
    }
  };

  loadStats();
})();