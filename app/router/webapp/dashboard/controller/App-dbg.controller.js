sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast"
  ],
  function (Controller, JSONModel, MessageToast) {
    "use strict";

    // Maps dashboard target keys to FLP semantic objects and actions.
    // These MUST match the intents defined in app/router/webapp/index.html
    var NAV_TARGETS = {
      employees:   { semanticObject: "Employees",   action: "manage" },
      departments: { semanticObject: "Departments",  action: "manage" },
      tasks:       { semanticObject: "Tasks",        action: "manage" },
      documents:   { semanticObject: "Documents",    action: "manage" },
      assets:      { semanticObject: "Assets",       action: "manage" },
      trainings:   { semanticObject: "Trainings",    action: "manage" },
      reports:     { semanticObject: "Reports",      action: "display" }
    };

    // Fallback URLs for standalone mode (not inside FLP)
    var STANDALONE_URLS = {
      employees:   "/employees/index.html",
      departments: "/departments/index.html",
      tasks:       "/onboarding-tasks/index.html",
      documents:   "/documents/index.html",
      assets:      "/assets/index.html",
      trainings:   "/trainings/index.html",
      reports:     "/reports/index.html"
    };

    var PRIORITY_WEIGHT = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1
    };

    return Controller.extend("dashboard.controller.App", {

      onInit: function () {
        var oDashboard = new JSONModel(this._emptyDashboard());
        oDashboard.setSizeLimit(9999);
        this.getView().setModel(oDashboard, "dashboard");

        // Detect if running inside FLP shell
        this._bInsideFLP = this._isInsideFLP();

        this._loadSession();
        this._loadDashboard();
      },

      onRefresh: function () {
        this._loadDashboard(true);
      },

      /* ── Navigation (FLP-aware) ──────────────────────────── */

      onNavigate: function (oEvent) {
        var sTarget = oEvent.getSource().data("target");
        if (!sTarget) {
          MessageToast.show("Navigation target not configured");
          return;
        }

        if (this._bInsideFLP) {
          this._navigateViaFLP(sTarget);
        } else {
          this._navigateStandalone(sTarget);
        }
      },

      onHome: function () {
        if (this._bInsideFLP) {
          // Navigate to FLP home (Shell-home)
          this._getCrossAppNav().then(function (oCrossAppNav) {
            oCrossAppNav.toExternal({
              target: { shellHash: "#Shell-home" }
            });
          }).catch(function () {
            window.location.href = "/";
          });
        } else {
          window.location.href = "/";
        }
      },

      onLogout: function () {
        if (this._bInsideFLP && window.sap && window.sap.ushell && window.sap.ushell.Container) {
          // Use FLP's built-in logout (which is overridden in router/index.html to /do/logout)
          window.sap.ushell.Container.logout();
        } else {
          // Standalone: redirect to approuter logout endpoint
          window.location.replace("/do/logout");
        }
      },

      _navigateViaFLP: function (sTarget) {
        var mTarget = NAV_TARGETS[sTarget];
        if (!mTarget) {
          MessageToast.show("Unknown target: " + sTarget);
          return;
        }

        this._getCrossAppNav().then(function (oCrossAppNav) {
          oCrossAppNav.toExternal({
            target: {
              semanticObject: mTarget.semanticObject,
              action: mTarget.action
            }
          });
        }).catch(function () {
          // Fallback: if CrossAppNav fails, use hash navigation
          var sHash = "#" + mTarget.semanticObject + "-" + mTarget.action;
          window.location.hash = sHash;
        });
      },

      _navigateStandalone: function (sTarget) {
        var sUrl = STANDALONE_URLS[sTarget];
        if (sUrl) {
          window.open(sUrl, "_blank");
        } else {
          MessageToast.show("Unknown target: " + sTarget);
        }
      },

      _getCrossAppNav: function () {
        if (window.sap && window.sap.ushell && window.sap.ushell.Container) {
          if (typeof window.sap.ushell.Container.getServiceAsync === "function") {
            return window.sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
          }
          // Older API
          try {
            var oService = window.sap.ushell.Container.getService("CrossApplicationNavigation");
            return Promise.resolve(oService);
          } catch (e) {
            return Promise.reject(e);
          }
        }
        return Promise.reject(new Error("FLP shell not available"));
      },

      _isInsideFLP: function () {
        // Check if the FLP shell container is available
        return !!(window.sap && window.sap.ushell && window.sap.ushell.Container);
      },

      /* ── Session ─────────────────────────────────────────── */

      _loadSession: function () {
        var that = this;

        fetch("/api/me")
          .then(function (r) {
            if (!r.ok) { throw new Error("session"); }
            return r.json();
          })
          .then(function (oUser) {
            that._applySession(oUser);
          })
          .catch(function () {
            // In local dev without auth → give full access
            that._applySession({
              id: "local-dev",
              displayName: "Developer",
              roles: ["HRAdmin"],
              apps: ["employees","departments","tasks","documents","assets","trainings","reports","dashboard"]
            });
          });
      },

      _applySession: function (oUser) {
        var aRoles  = (oUser && oUser.roles) || [];
        var mAccess = {
          employees: false,
          departments: false,
          tasks: false,
          documents: false,
          assets: false,
          trainings: false,
          reports: true
        };

        var ROLE_MAP = {
          HRAdmin:   ["employees","departments","tasks","documents","assets","trainings","reports"],
          HRManager: ["employees","departments","tasks","documents","trainings","reports"],
          ITAdmin:   ["tasks","assets","reports"],
          Employee:  ["tasks","documents","trainings","reports"]
        };

        aRoles.forEach(function (sRole) {
          (ROLE_MAP[sRole] || []).forEach(function (sApp) {
            mAccess[sApp] = true;
          });
        });

        var sName = (oUser && (oUser.displayName || oUser.id)) || "User";

        this.getView().getModel("dashboard").setProperty("/session", {
          loading: false,
          userId: (oUser && oUser.id) || "",
          displayName: sName,
          userText: "Signed in as " + sName,
          roleText: "Role: " + (aRoles.length ? aRoles.join(", ") : "–"),
          accessText: "",
          roles: aRoles,
          access: mAccess
        });
      },

      /* ── Data Loading ────────────────────────────────────── */

      _loadDashboard: function (bShowToast) {
        var that = this;
        var oModel = this.getView().getModel("dashboard");
        oModel.setProperty("/busy", true);

        Promise.all([
          this._readEntity("/Employees"),
          this._readEntity("/Departments"),
          this._readEntity("/OnboardingTasks"),
          this._readEntity("/Documents"),
          this._readEntity("/Assets"),
          this._readEntity("/Trainings")
        ])
          .then(function (aResults) {
            var oData = that._buildDashboardData({
              employees:   aResults[0],
              departments: aResults[1],
              tasks:       aResults[2],
              documents:   aResults[3],
              assets:      aResults[4],
              trainings:   aResults[5]
            });

            // Preserve session
            oData.session = oModel.getProperty("/session") || that._emptySession();
            oModel.setData(oData);

            if (bShowToast) {
              MessageToast.show("Dashboard refreshed");
            }
          })
          .catch(function (err) {
            console.error("Dashboard load error:", err);
            MessageToast.show("Unable to load dashboard data");
          })
          .finally(function () {
            oModel.setProperty("/busy", false);
          });
      },

      _readEntity: function (sPath) {
        var oDataModel = this.getOwnerComponent().getModel();
        var oBinding = oDataModel.bindList(sPath);

        return oBinding.requestContexts(0, 9999).then(function (aCtx) {
          return aCtx.map(function (c) {
            return Object.assign({}, c.getObject());
          });
        });
      },

      /* ── Build Dashboard Model ───────────────────────────── */

      _buildDashboardData: function (m) {
        var aEmp   = m.employees   || [];
        var aDept  = m.departments || [];
        var aTask  = m.tasks       || [];
        var aDoc   = m.documents   || [];
        var aAsset = m.assets      || [];
        var aTrain = m.trainings   || [];

        var mDepts = this._mapById(aDept);
        var iTotal = aEmp.length;
        var iAvg   = this._round(this._avg(aEmp, "onboardingProgress"));

        var iCompletedTasks = aTask.filter(this._isCompleted).length;
        var iPending = aTask.length - iCompletedTasks;

        var iOpenDocs = aDoc.filter(function (d) { return d.status !== "Verified"; }).length;

        var iCompletedTrainings = aTrain.filter(this._isCompleted).length;

        var iAvailAssets = aAsset.filter(function (a) { return a.status === "Available"; }).length;

        var iOverdue = this._overdueTasks(aTask).length;

        var iHighPri = aTask.filter(function (t) {
          return !this._isCompleted(t) && (t.priority === "High" || t.priority === "Critical");
        }.bind(this)).length;

        var iInactive = aEmp.filter(function (e) {
          return e.status === "Inactive" || e.status === "OnLeave";
        }).length;

        return {
          busy: false,
          lastUpdatedText: "Updated " + new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),

          kpis: {
            totalEmployees:     this._kpi(iTotal, "Neutral"),
            avgProgress:        this._pctKpi(iAvg),
            pendingTasks:       this._riskKpi(iPending, iPending > 0),
            overdueTasks:       this._riskKpi(iOverdue, iOverdue > 0),
            highPriorityTasks:  this._riskKpi(iHighPri, iHighPri > 0),
            openDocuments:      this._riskKpi(iOpenDocs, iOpenDocs > 0),
            availableAssets:    this._kpi(iAvailAssets, "Good"),
            trainingCompletion: this._pctKpi(this._rate(iCompletedTrainings, aTrain.length)),
            taskClosure:        this._pctKpi(this._rate(iCompletedTasks, aTask.length)),
            documentReadiness:  this._pctKpi(this._rate(aDoc.length - iOpenDocs, aDoc.length)),
            inactiveEmployees:  this._riskKpi(iInactive, iInactive > 0)
          },

          departmentProgress: this._deptProgress(aEmp, mDepts),
          peopleAtRisk:       this._atRisk(aEmp, mDepts),
          statusDistribution: this._distribution(aEmp, "status"),
          taskDistribution:   this._distribution(aTask, "status"),
          assetDistribution:  this._distribution(aAsset, "status"),
          priorityTasks:      this._priorityQueue(aTask),
          documentQueue:      this._docQueue(aDoc)
        };
      },

      _deptProgress: function (aEmp, mDepts) {
        var groups = {};
        var that = this;

        aEmp.forEach(function (e) {
          var n = that._deptName(e, mDepts);
          groups[n] = groups[n] || [];
          groups[n].push(e);
        });

        return Object.keys(groups).sort().map(function (name) {
          var g   = groups[name];
          var avg = that._round(that._avg(g, "onboardingProgress"));
          return {
            name: name,
            countText: g.length + " employee(s)",
            avgProgress: avg,
            avgProgressText: avg + "%",
            state: that._pctState(avg)
          };
        });
      },

      _atRisk: function (aEmp, mDepts) {
        var that = this;
        return aEmp
          .filter(function (e) {
            return Number(e.onboardingProgress || 0) < 75 || e.status === "Pending";
          })
          .sort(function (a, b) {
            return Number(a.onboardingProgress || 0) - Number(b.onboardingProgress || 0);
          })
          .slice(0, 6)
          .map(function (e) {
            var p = that._round(Number(e.onboardingProgress || 0));
            return {
              name: ((e.firstName || "") + " " + (e.lastName || "")).trim(),
              employeeNumber: e.employeeNumber,
              departmentName: that._deptName(e, mDepts),
              progress: p,
              state: that._pctState(p),
              statusText: "Status: " + (e.status || "–")
            };
          });
      },

      _distribution: function (aItems, sProp) {
        var groups = {};
        var total  = aItems.length || 1;
        var that   = this;

        aItems.forEach(function (o) {
          var v = o[sProp] || "–";
          groups[v] = (groups[v] || 0) + 1;
        });

        return Object.keys(groups).sort().map(function (s) {
          var c = groups[s];
          var sh = that._round((c / total) * 100);
          return {
            status: s,
            count: c,
            countText: c + " item(s)",
            share: sh,
            shareText: sh + "%",
            state: that._statusState(s)
          };
        });
      },

      _priorityQueue: function (aTasks) {
        var that = this;
        return aTasks
          .filter(function (t) { return !that._isCompleted(t); })
          .sort(function (a, b) {
            var d = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
            return d !== 0 ? d : new Date(a.dueDate || 0) - new Date(b.dueDate || 0);
          })
          .slice(0, 8)
          .map(function (t) {
            return {
              taskName:      t.taskName,
              assignedTo:    t.assignedTo,
              dueDateText:   that._fmtDate(t.dueDate),
              priority:      t.priority,
              priorityState: that._priState(t.priority),
              status:        t.status,
              state:         that._statusState(t.status)
            };
          });
      },

      _docQueue: function (aDocs) {
        var that = this;
        return aDocs
          .filter(function (d) { return d.status !== "Verified"; })
          .map(function (d) {
            return {
              documentType:    d.documentType,
              fileName:        d.fileName,
              uploadedDateText: that._fmtDate(d.uploadedDate),
              status:          d.status,
              state:           that._statusState(d.status)
            };
          });
      },

      _overdueTasks: function (a) {
        var now = new Date(); now.setHours(0,0,0,0);
        var that = this;
        return a.filter(function (t) {
          return !that._isCompleted(t) && t.dueDate && new Date(t.dueDate) < now;
        });
      },

      /* ── Helpers ─────────────────────────────────────────── */

      _isCompleted: function (o) {
        return o.status === "Completed" || o.status === "Verified";
      },

      _mapById: function (a) {
        return a.reduce(function (m, o) { m[o.ID] = o; return m; }, {});
      },

      _deptName: function (e, m) {
        var d = m[e.department_ID];
        return d ? d.name : "Unassigned";
      },

      _avg: function (a, p) {
        if (!a.length) return 0;
        return a.reduce(function (s, o) { return s + Number(o[p] || 0); }, 0) / a.length;
      },

      _rate: function (done, total) {
        return total ? this._round((done / total) * 100) : 0;
      },

      _round: function (v) { return Math.round(Number(v || 0)); },

      _kpi: function (v, c) {
        return { value: v, display: "" + v, color: c || "Neutral", state: this._colorState(c) };
      },

      _pctKpi: function (v) {
        return { value: v, display: v + "%", color: this._pctColor(v), state: this._pctState(v) };
      },

      _riskKpi: function (v, bad) {
        return { value: v, display: "" + v, color: bad ? "Critical" : "Good", state: bad ? "Error" : "Success" };
      },

      _pctColor: function (p) { return p >= 85 ? "Good" : p >= 60 ? "Critical" : "Error"; },
      _pctState: function (p) { return p >= 85 ? "Success" : p >= 60 ? "Warning" : "Error"; },

      _colorState: function (c) {
        if (c === "Good") return "Success";
        if (c === "Critical") return "Warning";
        if (c === "Error") return "Error";
        return "None";
      },

      _statusState: function (s) {
        if (s === "Completed" || s === "Verified" || s === "Active" || s === "Available") return "Success";
        if (s === "Pending" || s === "InProgress" || s === "Uploaded" || s === "Assigned" || s === "Open") return "Warning";
        if (s === "Rejected" || s === "Inactive" || s === "Critical") return "Error";
        return "Information";
      },

      _priState: function (p) {
        return (p === "Critical" || p === "High") ? "Error" : (p === "Medium") ? "Warning" : "Success";
      },

      _fmtDate: function (s) {
        if (!s) return "–";
        return new Date(s).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
      },

      _emptyDashboard: function () {
        return {
          busy: false,
          lastUpdatedText: "",
          session: this._emptySession(),
          kpis: {
            totalEmployees: this._kpi(0),
            avgProgress: this._pctKpi(0),
            pendingTasks: this._riskKpi(0, false),
            overdueTasks: this._riskKpi(0, false),
            highPriorityTasks: this._riskKpi(0, false),
            openDocuments: this._riskKpi(0, false),
            availableAssets: this._kpi(0, "Good"),
            trainingCompletion: this._pctKpi(0),
            taskClosure: this._pctKpi(0),
            documentReadiness: this._pctKpi(0),
            inactiveEmployees: this._riskKpi(0, false)
          },
          departmentProgress: [],
          peopleAtRisk: [],
          statusDistribution: [],
          taskDistribution: [],
          assetDistribution: [],
          priorityTasks: [],
          documentQueue: []
        };
      },

      _emptySession: function () {
        return {
          loading: true,
          userId: "",
          displayName: "",
          userText: "Checking your access...",
          roleText: "",
          accessText: "",
          roles: [],
          access: {
            employees: true,
            departments: true,
            tasks: true,
            documents: true,
            assets: true,
            trainings: true,
            reports: true
          }
        };
      }
    });
  }
);
