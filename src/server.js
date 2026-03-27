import express from "express";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import pgSimple from "connect-pg-simple";
import passport from "./config/passport.js";
import { apiReference } from "@scalar/express-api-reference";
import { connectDB, disconnectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import jobroutes from "./routes/job.routes.js";
import userroutes from "./routes/user.routes.js";
import companyroutes from "./routes/company.routes.js";
import applicationRoute from "./routes/application.route.js";
import githubAuthRoutes from "./routes/github.routes.js";
import openApiDocument from "./utils/openapi.js";
import protect from "./middlewares/protect.middleware.js";
import authorize from "./middlewares/authorize.middleware.js";

dotenv.config(); // Load environment variables from .env file
await connectDB(); // Connect to the database when the server starts
const app = express(); // Create an Express application
app.use(helmet());
// Serve static files from the public directory
app.use(express.static("public"));
const PORT = process.env.PORT || 3000;
app.use(express.json());	
app.use(cookieParser()); // Middleware to parse cookies from incoming requests
const pgSession = pgSimple(session);

app.use(
  session({
    store: new pgSession({
      conString: process.env.DATABASE_URL,
      tableName: "session",
    }),
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      secure: process.env.NODE_ENV === "production",
    },
  }),
);
app.use(passport.initialize());
app.use(passport.session());
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/jobs", jobroutes);
app.use("/api/v1/users", userroutes);
app.use("/api/v1/companies", companyroutes);
app.use("/api/v1/applications", applicationRoute);
app.use("/auth", githubAuthRoutes);
app.get("/openapi.json", protect, authorize("company_admin"), (req, res) => {
  res.status(200).json(openApiDocument);
});

app.get(
  "/docs",
  protect,
  authorize("company_admin"),
  apiReference({
    theme: "kepler",
    url: "/openapi.json",
  }),
);

const server = app.listen(PORT || 3000, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.status(200).send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Portal | Find Your Dream Career</title>
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />
    <meta name="description" content="A premium job portal to connect top talent with best companies." />
    <meta property="og:title" content="Job Portal" />
    <meta property="og:description" content="Find your next career move." />
    <meta property="og:image" content="/favicon.png" />
    <meta name="theme-color" content="#5bc8af" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap"
      rel="stylesheet"
    />
    <style>
      :root {
        --ink: #11262d;
        --paper: #f6efe1;
        --mint: #5bc8af;
        --gold: #f0b429;
        --coral: #f56f5a;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        min-height: 100vh;
        color: var(--ink);
        font-family: "Space Grotesk", sans-serif;
        background:
          radial-gradient(circle at 20% 15%, rgba(245, 111, 90, 0.28) 0 12%, transparent 40%),
          radial-gradient(circle at 85% 70%, rgba(91, 200, 175, 0.34) 0 18%, transparent 45%),
          linear-gradient(130deg, #fff9ec 0%, var(--paper) 52%, #e9f8f4 100%);
        overflow: hidden;
      }

      body::before,
      body::after {
        content: "";
        position: fixed;
        inset: -30%;
        pointer-events: none;
      }

      body::before {
        background-image:
          linear-gradient(rgba(17, 38, 45, 0.06) 1px, transparent 1px),
          linear-gradient(90deg, rgba(17, 38, 45, 0.06) 1px, transparent 1px);
        background-size: 42px 42px;
        animation: drift 18s linear infinite;
      }

      body::after {
        background:
          radial-gradient(circle, rgba(240, 180, 41, 0.35) 0 2px, transparent 2px) 0 0 / 38px 38px,
          radial-gradient(circle, rgba(17, 38, 45, 0.16) 0 1px, transparent 1px) 10px 10px / 28px 28px;
        mix-blend-mode: multiply;
        animation: driftReverse 24s linear infinite;
      }

      main {
        position: relative;
        z-index: 1;
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .card {
        width: min(760px, 100%);
        border: 2px solid rgba(17, 38, 45, 0.14);
        border-radius: 24px;
        // background: rgba(255, 255, 255, 0.68);
        backdrop-filter: blur(20px);
        // box-shadow: 0 20px 50px rgba(17, 38, 45, 0.18);
        padding: clamp(24px, 4vw, 44px);
        animation: popIn 700ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }

      h1 {
        margin: 0;
        font-size: clamp(1.9rem, 3.4vw, 3rem);
        line-height: 1.08;
        letter-spacing: -0.03em;
      }

      p {
        margin-top: 12px;
        max-width: 62ch;
        line-height: 1.58;
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 20px;
      }

      .btn {
        cursor: pointer;
        text-decoration: none;
        font-weight: 700;
        font-size: 0.95rem;
        color: var(--ink);
        border: 2px solid var(--ink);
        border-radius: 999px;
        padding: 10px 16px;
        background: #fff;
        transition: transform 180ms ease, box-shadow 180ms ease;
      }

      .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 0 rgba(17, 38, 45, 0.16);
      }

      .btn.docs {
        background: var(--mint);
      }

      .btn.openapi {
        background: var(--gold);
      }

      .btn.auth {
        background: var(--coral);
      }

      .hint {
        margin-top: 14px;
        font-size: 0.85rem;
        opacity: 0.82;
      }

      .modal-backdrop {
        position: fixed;
        inset: 0;
        display: none;
        place-items: center;
        background: rgba(10, 18, 22, 0.45);
        z-index: 20;
        padding: 16px;
      }

      .modal-backdrop.show {
        display: grid;
      }

      .modal {
        width: min(460px, 100%);
        background: #fffef7;
        border: 2px solid rgba(17, 38, 45, 0.2);
        border-radius: 16px;
        box-shadow: 0 16px 34px rgba(17, 38, 45, 0.26);
        padding: 18px;
      }

      .modal h2 {
        margin: 0;
        font-size: 1.15rem;
      }

      .field {
        margin-top: 12px;
      }

      .field label {
        display: block;
        font-size: 0.85rem;
        margin-bottom: 6px;
      }

      .field input,
      .field select {
        width: 100%;
        border: 1px solid rgba(17, 38, 45, 0.34);
        border-radius: 10px;
        padding: 10px;
        font: inherit;
      }

      .modal-actions {
        margin-top: 14px;
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }

      .modal-btn {
        border: 2px solid var(--ink);
        border-radius: 999px;
        background: #fff;
        padding: 8px 14px;
        font-weight: 700;
        cursor: pointer;
      }

      .modal-btn.primary {
        background: var(--mint);
      }

      .error-msg {
        margin-top: 10px;
        min-height: 1.25rem;
        color: #b42318;
        font-size: 0.84rem;
      }

      @keyframes drift {
        from {
          transform: translate(0, 0) rotate(0deg);
        }
        to {
          transform: translate(-30px, -26px) rotate(0.3deg);
        }
      }

      @keyframes driftReverse {
        from {
          transform: translate(0, 0) rotate(0deg);
        }
        to {
          transform: translate(26px, 30px) rotate(-0.3deg);
        }
      }

      @keyframes popIn {
        from {
          opacity: 0;
          transform: translateY(18px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    </style>
  </head>
  <body>
    <audio id="bgMusic" src="/bg-s.mp3" loop></audio>
    <main>
      <section class="card">
        <h1>Job Portal Backend Is Live</h1>
        <p>
          This service powers authentication, users, companies, jobs, and applications.
          Use the links below to explore OpenAPI and interactive API docs.
        </p>
        <div class="actions">
          <button class="btn docs protected-link" data-target="/docs" type="button">Open API Docs</button>
          <button class="btn openapi protected-link" data-target="/openapi.json" type="button">OpenAPI JSON</button>
          <button class="btn auth protected-link" data-target="/api/v1/auth" type="button">Auth Endpoint</button>
        </div>
        <p class="hint">Base URL: /api/v1</p>
      </section>
    </main>

    <div class="modal-backdrop" id="authModal">
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle">
        <h2 id="modalTitle">Enter Access Credentials</h2>
        <div class="field">
          <label for="tokenInput">Bearer Token</label>
          <input id="tokenInput" type="password" placeholder="Paste your token" />
        </div>
        <p class="error-msg" id="errorMsg"></p>
        <div class="modal-actions">
          <button class="modal-btn" id="cancelBtn" type="button">Cancel</button>
          <button class="modal-btn primary" id="submitBtn" type="button">Open</button>
        </div>
      </div>
    </div>

    <script>
      (function () {
        const modal = document.getElementById('authModal');
        const tokenInput = document.getElementById('tokenInput');
        const errorMsg = document.getElementById('errorMsg');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        const links = document.querySelectorAll('.protected-link');
        let targetEndpoint = '';
        const audio = document.getElementById('bgMusic');
        document.addEventListener("click", () => {
          audio.play();
        }, { once: true });
        const openModal = (target) => {
          targetEndpoint = target;
          errorMsg.textContent = '';
          tokenInput.value = '';
          modal.classList.add('show');
          tokenInput.focus();
        };

        const closeModal = () => {
          modal.classList.remove('show');
          targetEndpoint = '';
        };

        const openResponseInNewTab = async (endpoint, token) => {
          const res = await fetch(endpoint, {
            method: 'GET',
            headers: {
              Authorization: 'Bearer ' + token,
            },
          });

          if (!res.ok) {
            const text = await res.text();
            const randomStatuses = [401, 403, 404, 418, 429];
            const randomMessages = [
              'Access denied',
              'khom mes ah chkae nis',
              'khom nas ah jmr',
              'Request blocked',
              'jes hot ot?',
            ];
            const status = randomStatuses[Math.floor(Math.random() * randomStatuses.length)];
            const message = randomMessages[Math.floor(Math.random() * randomMessages.length)];
            throw new Error(message + ' (' + status + ').');
          }

          const type = res.headers.get('content-type') || '';
          const popup = window.open('', '_blank');
          if (!popup) {
            throw new Error('Popup blocked by browser. Allow popups and retry.');
          }

          if (type.includes('application/json')) {
            const json = await res.json();
            popup.document.write('<pre style="font-family: ui-monospace, SFMono-Regular, Menlo, monospace; white-space: pre-wrap;">' + JSON.stringify(json, null, 2) + '</pre>');
          } else {
            const html = await res.text();
            popup.document.open();
            popup.document.write(html);
            popup.document.close();
          }
        };

        links.forEach((btn) => {
          btn.addEventListener('click', () => {
            openModal(btn.getAttribute('data-target'));
          });
        });

        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (event) => {
          if (event.target === modal) {
            closeModal();
          }
        });

        submitBtn.addEventListener('click', async () => {
          const token = tokenInput.value.trim();

          if (!token) {
            errorMsg.textContent = 'Token is required.';
            return;
          }

          errorMsg.textContent = '';
          submitBtn.disabled = true;

          try {
            await openResponseInNewTab(targetEndpoint, token);
            closeModal();
          } catch (error) {
            errorMsg.textContent = error.message;
          } finally {
            submitBtn.disabled = false;
          }
        });
      })();
    </script>
  </body>
</html>`);
});
// =========================================================================================================

// ================================================================================================================
// This for unhandle promise rejection, for example when database connection fails
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  // server.close(async () => {
  //   await disconnectDB();
  //   process.exit(1);
  // });
});

// This for uncaught exception, for example when there is an error in the code that is not handled
process.on("uncaughtException", async (err) => {
  console.error("Uncaught Exception:", err);
  await disconnectDB();
  process.exit(1);
});

// This for graceful shutdown, for example when the server is stopped or restarted
// process.on("SIGINT", async () => {
//   console.log("SIGINT received, shutting down gracefully...");
//   await disconnectDB();
//   process.exit(0);
// });
// ================================================================================================================
