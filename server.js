const cds = require("@sap/cds");

const ROLE_KEYS = ["HRAdmin", "HRManager", "ITAdmin", "Employee"];

const ROLE_TO_APPS = {
  HRAdmin: ["employees", "departments", "tasks", "documents", "assets", "trainings", "reports"],
  HRManager: ["employees", "departments", "tasks", "documents", "trainings", "reports"],
  ITAdmin: ["tasks", "assets", "reports"],
  Employee: ["tasks", "documents", "trainings", "reports"]
};

function getDisplayName(user) {
  return (
    user?.attr?.display_name ||
    user?.attr?.name ||
    user?.attr?.given_name ||
    user?.id ||
    "User"
  );
}

function collectRoles(user) {
  if (typeof user?.is !== "function") {
    return [];
  }

  return ROLE_KEYS.filter((role) => user.is(role));
}

function collectApps(roles) {
  const appSet = new Set(["dashboard"]); // Everyone sees the dashboard by default

  roles.forEach((role) => {
    (ROLE_TO_APPS[role] || []).forEach((app) => appSet.add(app));
  });

  return Array.from(appSet);
}

cds.on("bootstrap", (app) => {
  // Health endpoint for BTP monitoring
  app.get("/health", (_req, res) => {
    res.json({ status: "UP" });
  });

  app.get("/api/me", (req, res) => {
    let user = req.user || cds.context?.user;

    // Fallback: If CAP auth middleware skipped this custom route, manually decode the JWT passed by App Router
    if (!user || !user.id) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        if (authHeader.startsWith("Bearer ")) {
          try {
            const token = authHeader.split(" ")[1];
            const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
            user = {
              id: payload.user_name || payload.email || payload.client_id || "Admin",
              attr: payload,
              is: (role) => payload.scope && payload.scope.some(s => s.endsWith(`.${role}`))
            };
          } catch (e) {
            console.warn("[api/me] JWT decode error:", e.message);
          }
        } else if (authHeader.startsWith("Basic ")) {
          try {
            const credentials = Buffer.from(authHeader.split(" ")[1], "base64").toString("utf8");
            const [username] = credentials.split(":");
            const mockUsers = cds.env.requires?.auth?.users || {};
            const mockUser = mockUsers[username] || { roles: [] };
            
            user = {
              id: username,
              attr: { name: username },
              is: (role) => mockUser.roles && mockUser.roles.includes(role)
            };
          } catch (e) {
            console.warn("[api/me] Basic auth decode error:", e.message);
          }
        }
      }
    }

    // Force authentication if no valid user is found
    if (!user || !user.id || user.id === "anonymous") {
      res.setHeader('WWW-Authenticate', 'Basic realm="CAP"');
      return res.status(401).send('Unauthorized');
    }

    const roles = collectRoles(user);
    const apps = collectApps(roles);

    res.json({
      id: user.id || "",
      displayName: getDisplayName(user),
      roles,
      apps
    });
  });

  // Graceful fallback for Fiori Launchpad's production logout redirect
  app.get("/do/logout", (req, res) => {
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
