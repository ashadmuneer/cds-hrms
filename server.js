const cds = require("@sap/cds");

const ROLE_KEYS = ["HRAdmin", "HRManager", "ITAdmin", "Employee"];

const ROLE_TO_APPS = {
  HRAdmin: ["employees", "departments", "tasks", "documents", "assets", "trainings", "reports"],
  HRManager: ["employees", "departments", "tasks", "documents", "trainings", "reports"],
  ITAdmin: ["tasks", "assets", "reports"],
  Employee: ["tasks", "documents", "trainings", "reports"]
};

function collectRoles(user) {
  if (typeof user?.is !== "function") return [];
  return ROLE_KEYS.filter((role) => user.is(role));
}

function collectApps(roles) {
  const appSet = new Set(["dashboard"]); // Everyone sees the dashboard
  roles.forEach((role) => {
    (ROLE_TO_APPS[role] || []).forEach((app) => appSet.add(app));
  });
  return Array.from(appSet);
}

cds.on("bootstrap", (app) => {
  const isProduction = process.env.NODE_ENV === "production";

  // ── Global Auth Gate (LOCAL DEV ONLY) ────────────────────────────────
  // CAP serves static files without auth, so the browser never caches
  // Basic Auth credentials.  This forces a native login dialog on every
  // first request, ensuring credentials are sent with OData $batch too.
  // On BTP the App Router handles OAuth2 login, so we skip this gate.
  // ─────────────────────────────────────────────────────────────────────
  if (!isProduction) {
    app.use((req, res, next) => {
      if (req.path === "/health" || req.path.startsWith("/do/logout")) {
        return next();
      }
      if (!req.headers.authorization) {
        res.setHeader("WWW-Authenticate", 'Basic realm="CAP"');
        return res.status(401).send("Unauthorized");
      }
      next();
    });
  }

  // ── Health endpoint ──────────────────────────────────────────────────
  app.get("/health", (_req, res) => {
    res.json({ status: "UP" });
  });

  // ── User info endpoint ───────────────────────────────────────────────
  // On custom Express routes CAP's req.user does NOT have roles loaded.
  // We must decode the Authorization header ourselves in every case.
  // ─────────────────────────────────────────────────────────────────────
  app.get("/api/me", (req, res) => {
    let user = null;
    const authHeader = req.headers.authorization;


    if (authHeader && authHeader.startsWith("Bearer ")) {
      // ── BTP / XSUAA: decode the JWT ──
      try {
        const token = authHeader.split(" ")[1];
        const payload = JSON.parse(
          Buffer.from(token.split(".")[1], "base64").toString("utf8")
        );
        user = {
          id: payload.user_name || payload.email || payload.client_id || "User",
          attr: payload,
          is: (role) => {
            // XSUAA scopes: ["appname.HRAdmin", "openid", ...]
            if (payload.scope && payload.scope.some((s) => s.endsWith(`.${role}`))) return true;
            // Fallback: xs.system.attributes
            if (payload["xs.system.attributes"]?.["xs.rolecollections"]?.includes(role)) return true;
            return false;
          }
        };
      } catch (e) {
        console.warn("[api/me] JWT decode error:", e.message);
      }
    } else if (authHeader && authHeader.startsWith("Basic ")) {
      // ── Local dev: decode Basic Auth against mocked users ──
      try {
        const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8");
        const [username] = credentials.split(":");
        const mockUsers = cds.env.requires?.auth?.users || {};
        const mockEntry = mockUsers[username];
        // CAP transforms roles from ["HRAdmin"] to {HRAdmin:1} at runtime!
        let mockRoles = [];
        if (mockEntry && typeof mockEntry === "object" && mockEntry.roles) {
          if (Array.isArray(mockEntry.roles)) {
            mockRoles = mockEntry.roles;
          } else if (typeof mockEntry.roles === "object") {
            mockRoles = Object.keys(mockEntry.roles);
          }
        }

        user = {
          id: username,
          attr: { name: username },
          is: (role) => mockRoles.includes(role)
        };
      } catch (e) {
        console.warn("[api/me] Basic auth decode error:", e.message);
      }
    }

    // No valid user
    if (!user || !user.id || user.id === "anonymous") {
      if (isProduction) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      res.setHeader("WWW-Authenticate", 'Basic realm="CAP"');
      return res.status(401).send("Unauthorized");
    }

    const roles = collectRoles(user);
    const apps = collectApps(roles);

    // Build display name from JWT attributes or fallback
    let displayName = "User";
    if (user.attr) {
      const a = user.attr;
      displayName =
        a.display_name ||
        a.name ||
        (a.given_name && a.family_name ? `${a.given_name} ${a.family_name}` : null) ||
        a.given_name ||
        a.email ||
        user.id ||
        "User";
    } else {
      displayName = user.id || "User";
    }

    res.json({ id: user.id, displayName, roles, apps });
  });

  // ── Logout fallback ──────────────────────────────────────────────────
  app.get("/do/logout", (_req, res) => {
    res.send(`
      <div style="display:flex;align-items:center;justify-content:center;height:100vh;font-family:'72',Arial,sans-serif;background:#f5f6f7;">
        <div style="text-align:center;padding:3rem;background:white;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
          <h2 style="color:#0a6ed1;">Signed Out</h2>
          <p style="color:#556b82;margin:1rem 0 2rem;">You have successfully signed out.</p>
          <a href="/router/webapp/index.html" style="padding:0.7rem 2rem;background:#0a6ed1;color:white;text-decoration:none;border-radius:8px;font-size:1rem;">Sign In Again</a>
        </div>
      </div>
    `);
  });
});
