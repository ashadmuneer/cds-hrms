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
  const appSet = new Set(["reports"]);

  roles.forEach((role) => {
    (ROLE_TO_APPS[role] || []).forEach((app) => appSet.add(app));
  });

  return Array.from(appSet);
}

cds.on("bootstrap", (app) => {
  app.get("/api/me", (req, res) => {
    const user = req.user || {};
    const roles = collectRoles(user);
    const apps = collectApps(roles);

    res.json({
      id: user.id || "",
      displayName: getDisplayName(user),
      roles,
      apps
    });
  });
});
