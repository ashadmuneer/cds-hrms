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
          } catch (e) {}
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
          } catch (e) {}
        }
      }
    }

    const safeUser = user || {};
    const roles = collectRoles(safeUser);
    const apps = collectApps(roles);

    res.json({
      id: safeUser.id || "",
      displayName: getDisplayName(safeUser),
      roles,
      apps
    });
  });
});
