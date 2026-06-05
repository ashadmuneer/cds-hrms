sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/ui/core/Popup",
    "sap/ushell/Container",
  ],
  function (Controller, JSONModel, MessageToast, Popup, ShellContainer) {
    "use strict";

    const APP_TARGETS = {
      employees: {
        semanticObject: "Employees",
        action: "manage",
        url: "../employees/",
      },
      departments: {
        semanticObject: "Departments",
        action: "manage",
        url: "../departments/",
      },
      tasks: {
        semanticObject: "OnboardingTasks",
        action: "manage",
        url: "../onboarding-tasks/",
      },
      documents: {
        semanticObject: "Documents",
        action: "manage",
        url: "../documents/",
      },
      assets: {
        semanticObject: "Assets",
        action: "manage",
        url: "../assets/",
      },
      trainings: {
        semanticObject: "Trainings",
        action: "manage",
        url: "../trainings/",
      },
      reports: {
        semanticObject: "Reports",
        action: "display",
        url: "../reports/",
      },
    };

    const ROLE_TO_APPS = {
      HRAdmin: ["employees", "departments", "tasks", "documents", "assets", "trainings", "reports"],
      HRManager: ["employees", "departments", "tasks", "documents", "trainings", "reports"],
      ITAdmin: ["tasks", "assets", "reports"],
      Employee: ["tasks", "documents", "trainings", "reports"],
    };

    const PRIORITY_WEIGHT = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return Controller.extend("dashboard.controller.App", {
      onInit: function () {
        this.getView().setModel(
          new JSONModel(this._emptyDashboard()),
          "dashboard",
        );
        this._loadSession();
        this._loadDashboard();
      },

      onRefresh: function () {
        this._loadDashboard(true);
      },

      onNavigate: function (oEvent) {
        const sTarget = oEvent.getSource().data("target");
        const mTarget = APP_TARGETS[sTarget];

        if (!mTarget) {
          this._showToast(
            this.getResourceBundle().getText("navigationTargetMissing"),
          );
          return;
        }

        if (!this._isTargetAllowed(sTarget)) {
          this._showToast(
            this.getResourceBundle().getText("navigationNotAllowed"),
          );
          return;
        }

        this._getCrossApplicationNavigation()
          .then(
            function (oCrossAppNav) {
              oCrossAppNav.toExternal({
                target: mTarget,
              });
            }.bind(this),
          )
          .catch(
            function () {
              this._showToast(
                this.getResourceBundle().getText(
                  "standardNavigationUnavailable",
                ),
              );
            }.bind(this),
          );
      },

      _showToast: function (sMessage) {
        MessageToast.show(sMessage, {
          my: Popup.Dock.CenterBottom,
          at: Popup.Dock.CenterBottom,
        });
      },

      _getCrossApplicationNavigation: function () {
        if (!ShellContainer) {
          return Promise.reject(
            new Error("SAP Fiori launchpad shell is not available"),
          );
        }

        if (ShellContainer.getServiceAsync) {
          return ShellContainer.getServiceAsync("CrossApplicationNavigation");
        }

        return Promise.reject(
          new Error("SAP Fiori launchpad shell does not support async navigation"),
        );
      },

      _loadSession: function () {
        fetch("/api/me")
          .then(function (oResponse) {
            if (!oResponse.ok) {
              throw new Error("Failed to resolve session");
            }

            return oResponse.json();
          })
          .then(
            function (oUser) {
              this.getView()
                .getModel("dashboard")
                .setProperty("/session", this._normalizeSession(oUser));
            }.bind(this),
          )
          .catch(
            function () {
              this.getView()
                .getModel("dashboard")
                .setProperty("/session", this._emptySession());
            }.bind(this),
          );
      },

      _loadDashboard: function (bShowToast) {
        const oDashboardModel = this.getView().getModel("dashboard");

        oDashboardModel.setProperty("/busy", true);

        Promise.all([
          this._readEntity("/Employees"),
          this._readEntity("/Departments"),
          this._readEntity("/OnboardingTasks"),
          this._readEntity("/Documents"),
          this._readEntity("/Assets"),
          this._readEntity("/Trainings"),
        ])
          .then(
            function (aResults) {
              const oData = this._buildDashboardData({
                employees: aResults[0],
                departments: aResults[1],
                tasks: aResults[2],
                documents: aResults[3],
                assets: aResults[4],
                trainings: aResults[5],
              });

              oData.session =
                oDashboardModel.getProperty("/session") ||
                this._emptySession();
              oDashboardModel.setData(oData);

              if (bShowToast) {
                this._showToast(
                  this.getResourceBundle().getText("dashboardRefreshed"),
                );
              }
            }.bind(this),
          )
          .catch(
            function () {
              this._showToast(
                this.getResourceBundle().getText("dashboardLoadError"),
              );
            }.bind(this),
          )
          .finally(function () {
            oDashboardModel.setProperty("/busy", false);
          });
      },

      _normalizeSession: function (oUser) {
        const aRoles = Array.isArray(oUser && oUser.roles)
          ? oUser.roles.filter(function (sRole) {
              return Boolean(ROLE_TO_APPS[sRole]);
            })
          : [];
        const mAccess = this._resolveAccess(aRoles);
        const aRoleLabels = aRoles.map(
          function (sRole) {
            return this.getResourceBundle().getText(sRole);
          }.bind(this),
        );
        const aAllowedApps = Object.keys(mAccess)
          .filter(function (sTarget) {
            return mAccess[sTarget];
          })
          .map(
            function (sTarget) {
              return this.getResourceBundle().getText(sTarget);
            }.bind(this),
          );
        const sDisplayName =
          (oUser && oUser.displayName) || (oUser && oUser.id) || "User";

        return {
          loading: false,
          userId: (oUser && oUser.id) || "",
          displayName: sDisplayName,
          userText: this.getResourceBundle().getText("signedInAs", [
            sDisplayName,
          ]),
          roleText: this.getResourceBundle().getText("roleSummary", [
            aRoleLabels.length ? aRoleLabels.join(", ") : "-",
          ]),
          accessText: this.getResourceBundle().getText("accessSummary", [
            aAllowedApps.length ? aAllowedApps.join(", ") : "-",
          ]),
          roles: aRoles,
          access: mAccess,
        };
      },

      _resolveAccess: function (aRoles) {
        const mAccess = {
          employees: false,
          departments: false,
          tasks: false,
          documents: false,
          assets: false,
          trainings: false,
          reports: true,
        };

        aRoles.forEach(function (sRole) {
          (ROLE_TO_APPS[sRole] || []).forEach(function (sTarget) {
            mAccess[sTarget] = true;
          });
        });

        return mAccess;
      },

      _isTargetAllowed: function (sTarget) {
        const oSession =
          this.getView().getModel("dashboard").getProperty("/session") || {};
        const mAccess = oSession.access || {};

        return mAccess[sTarget] !== false;
      },

      _readEntity: function (sPath) {
        const oModel = this.getOwnerComponent().getModel();
        const oBinding = oModel.bindList(sPath);

        return oBinding.requestContexts(0, 1000).then(function (aContexts) {
          return aContexts.map(function (oContext) {
            return Object.assign({}, oContext.getObject());
          });
        });
      },

      _buildDashboardData: function (mData) {
        const aEmployees = mData.employees;
        const aTasks = mData.tasks;
        const aDocuments = mData.documents;
        const aAssets = mData.assets;
        const aTrainings = mData.trainings;
        const mDepartments = this._mapById(mData.departments);
        const iTotalEmployees = aEmployees.length;
        const iAvgProgress = this._round(
          this._average(aEmployees, "onboardingProgress"),
        );
        const iCompletedTasks = aTasks.filter(this._isCompleted).length;
        const iPendingTasks = aTasks.length - iCompletedTasks;
        const iOpenDocuments = aDocuments.filter(function (oDocument) {
          return oDocument.status !== "Verified";
        }).length;
        const iCompletedTrainings = aTrainings.filter(this._isCompleted).length;
        const iAvailableAssets = aAssets.filter(function (oAsset) {
          return oAsset.status === "Available";
        }).length;
        const iOverdueTasks = this._getOverdueTasks(aTasks).length;
        const iHighPriorityTasks = aTasks.filter(
          function (oTask) {
            return (
              !this._isCompleted(oTask) &&
              (oTask.priority === "High" || oTask.priority === "Critical")
            );
          }.bind(this),
        ).length;
        const iInactiveEmployees = aEmployees.filter(function (oEmployee) {
          return (
            oEmployee.status === "Inactive" || oEmployee.status === "OnLeave"
          );
        }).length;

        return {
          busy: false,
          lastUpdatedText: this._formatTimestamp(new Date()),
          kpis: {
            totalEmployees: this._kpi(iTotalEmployees, "Neutral"),
            avgProgress: this._percentKpi(iAvgProgress),
            pendingTasks: this._riskKpi(iPendingTasks, iPendingTasks > 0),
            overdueTasks: this._riskKpi(iOverdueTasks, iOverdueTasks > 0),
            highPriorityTasks: this._riskKpi(
              iHighPriorityTasks,
              iHighPriorityTasks > 0,
            ),
            openDocuments: this._riskKpi(iOpenDocuments, iOpenDocuments > 0),
            availableAssets: this._kpi(iAvailableAssets, "Good"),
            trainingCompletion: this._percentKpi(
              this._completionRate(iCompletedTrainings, aTrainings.length),
            ),
            taskClosure: this._percentKpi(
              this._completionRate(iCompletedTasks, aTasks.length),
            ),
            documentReadiness: this._percentKpi(
              this._completionRate(
                aDocuments.length - iOpenDocuments,
                aDocuments.length,
              ),
            ),
            inactiveEmployees: this._riskKpi(
              iInactiveEmployees,
              iInactiveEmployees > 0,
            ),
          },
          departmentProgress: this._buildDepartmentProgress(
            aEmployees,
            mDepartments,
          ),
          peopleAtRisk: this._buildPeopleAtRisk(aEmployees, mDepartments),
          statusDistribution: this._buildDistribution(aEmployees, "status"),
          taskDistribution: this._buildDistribution(aTasks, "status"),
          assetDistribution: this._buildDistribution(aAssets, "status"),
          priorityTasks: this._buildPriorityTasks(aTasks),
          documentQueue: this._buildDocumentQueue(aDocuments),
        };
      },

      _buildDepartmentProgress: function (aEmployees, mDepartments) {
        const mGroups = {};

        aEmployees.forEach(
          function (oEmployee) {
            const sDepartmentName = this._getDepartmentName(
              oEmployee,
              mDepartments,
            );
            mGroups[sDepartmentName] = mGroups[sDepartmentName] || [];
            mGroups[sDepartmentName].push(oEmployee);
          }.bind(this),
        );

        return Object.keys(mGroups)
          .sort()
          .map(
            function (sName) {
              const aGroup = mGroups[sName];
              const iAvgProgress = this._round(
                this._average(aGroup, "onboardingProgress"),
              );

              return {
                name: sName,
                countText: this.getResourceBundle().getText("employeeCount", [
                  aGroup.length,
                ]),
                avgProgress: iAvgProgress,
                avgProgressText: `${iAvgProgress}%`,
                state: this._stateFromPercent(iAvgProgress),
              };
            }.bind(this),
          );
      },

      _buildPeopleAtRisk: function (aEmployees, mDepartments) {
        return aEmployees
          .filter(function (oEmployee) {
            return (
              Number(oEmployee.onboardingProgress || 0) < 75 ||
              oEmployee.status === "Pending"
            );
          })
          .sort(function (oLeft, oRight) {
            return (
              Number(oLeft.onboardingProgress || 0) -
              Number(oRight.onboardingProgress || 0)
            );
          })
          .slice(0, 6)
          .map(
            function (oEmployee) {
              const iProgress = this._round(
                Number(oEmployee.onboardingProgress || 0),
              );

              return {
                name: `${oEmployee.firstName || ""} ${oEmployee.lastName || ""}`.trim(),
                employeeNumber: oEmployee.employeeNumber,
                departmentName: this._getDepartmentName(
                  oEmployee,
                  mDepartments,
                ),
                progress: iProgress,
                state: this._stateFromPercent(iProgress),
                statusText: this.getResourceBundle().getText(
                  "employeeStatusText",
                  [oEmployee.status || "-"],
                ),
              };
            }.bind(this),
          );
      },

      _buildDistribution: function (aItems, sProperty) {
        const mGroups = {};
        const iTotal = aItems.length || 1;

        aItems.forEach(function (oItem) {
          const sValue = oItem[sProperty] || "-";
          mGroups[sValue] = (mGroups[sValue] || 0) + 1;
        });

        return Object.keys(mGroups)
          .sort()
          .map(
            function (sStatus) {
              const iCount = mGroups[sStatus];
              const iShare = this._round((iCount / iTotal) * 100);

              return {
                status: sStatus,
                count: iCount,
                countText: this.getResourceBundle().getText("itemCount", [
                  iCount,
                ]),
                share: iShare,
                shareText: `${iShare}%`,
                state: this._stateFromStatus(sStatus),
              };
            }.bind(this),
          );
      },

      _buildPriorityTasks: function (aTasks) {
        return aTasks
          .filter(
            function (oTask) {
              return !this._isCompleted(oTask);
            }.bind(this),
          )
          .sort(function (oLeft, oRight) {
            const iPriorityDelta =
              (PRIORITY_WEIGHT[oRight.priority] || 0) -
              (PRIORITY_WEIGHT[oLeft.priority] || 0);

            if (iPriorityDelta !== 0) {
              return iPriorityDelta;
            }

            return new Date(oLeft.dueDate || 0) - new Date(oRight.dueDate || 0);
          })
          .slice(0, 8)
          .map(
            function (oTask) {
              return {
                taskName: oTask.taskName,
                assignedTo: oTask.assignedTo,
                dueDateText: this._formatDate(oTask.dueDate),
                priority: oTask.priority,
                priorityState: this._stateFromPriority(oTask.priority),
                status: oTask.status,
                state: this._stateFromStatus(oTask.status),
              };
            }.bind(this),
          );
      },

      _buildDocumentQueue: function (aDocuments) {
        return aDocuments
          .filter(function (oDocument) {
            return oDocument.status !== "Verified";
          })
          .map(
            function (oDocument) {
              return {
                documentType: oDocument.documentType,
                fileName: oDocument.fileName,
                uploadedDateText: this._formatDate(oDocument.uploadedDate),
                status: oDocument.status,
                state: this._stateFromStatus(oDocument.status),
              };
            }.bind(this),
          );
      },

      _getOverdueTasks: function (aTasks) {
        const oToday = new Date();
        oToday.setHours(0, 0, 0, 0);

        return aTasks.filter(
          function (oTask) {
            return (
              !this._isCompleted(oTask) &&
              oTask.dueDate &&
              new Date(oTask.dueDate) < oToday
            );
          }.bind(this),
        );
      },

      _isCompleted: function (oItem) {
        return oItem.status === "Completed" || oItem.status === "Verified";
      },

      _mapById: function (aItems) {
        return aItems.reduce(function (mResult, oItem) {
          mResult[oItem.ID] = oItem;
          return mResult;
        }, {});
      },

      _getDepartmentName: function (oEmployee, mDepartments) {
        const oDepartment = mDepartments[oEmployee.department_ID];
        return oDepartment
          ? oDepartment.name
          : this.getResourceBundle().getText("unassigned");
      },

      _average: function (aItems, sProperty) {
        if (!aItems.length) {
          return 0;
        }

        return (
          aItems.reduce(function (iTotal, oItem) {
            return iTotal + Number(oItem[sProperty] || 0);
          }, 0) / aItems.length
        );
      },

      _completionRate: function (iCompleted, iTotal) {
        if (!iTotal) {
          return 0;
        }

        return this._round((iCompleted / iTotal) * 100);
      },

      _kpi: function (vValue, sColor) {
        return {
          value: vValue,
          display: `${vValue}`,
          color: sColor || "Neutral",
          state: this._stateFromColor(sColor),
        };
      },

      _percentKpi: function (iValue) {
        return {
          value: iValue,
          display: `${iValue}%`,
          color: this._colorFromPercent(iValue),
          state: this._stateFromPercent(iValue),
        };
      },

      _riskKpi: function (iValue, bRisk) {
        return {
          value: iValue,
          display: `${iValue}`,
          color: bRisk ? "Critical" : "Good",
          state: bRisk ? "Error" : "Success",
        };
      },

      _colorFromPercent: function (iPercent) {
        if (iPercent >= 85) {
          return "Good";
        }
        if (iPercent >= 60) {
          return "Critical";
        }
        return "Error";
      },

      _stateFromPercent: function (iPercent) {
        if (iPercent >= 85) {
          return "Success";
        }
        if (iPercent >= 60) {
          return "Warning";
        }
        return "Error";
      },

      _stateFromColor: function (sColor) {
        if (sColor === "Good") {
          return "Success";
        }
        if (sColor === "Critical") {
          return "Warning";
        }
        if (sColor === "Error") {
          return "Error";
        }
        return "None";
      },

      _stateFromStatus: function (sStatus) {
        if (
          sStatus === "Completed" ||
          sStatus === "Verified" ||
          sStatus === "Active" ||
          sStatus === "Available"
        ) {
          return "Success";
        }
        if (
          sStatus === "Pending" ||
          sStatus === "InProgress" ||
          sStatus === "Uploaded" ||
          sStatus === "Assigned"
        ) {
          return "Warning";
        }
        if (
          sStatus === "Rejected" ||
          sStatus === "Inactive" ||
          sStatus === "Critical"
        ) {
          return "Error";
        }
        return "Information";
      },

      _stateFromPriority: function (sPriority) {
        if (sPriority === "Critical" || sPriority === "High") {
          return "Error";
        }
        if (sPriority === "Medium") {
          return "Warning";
        }
        return "Success";
      },

      _formatDate: function (sDate) {
        if (!sDate) {
          return "-";
        }

        return new Date(sDate).toLocaleDateString(undefined, {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      },

      _formatTimestamp: function (oDate) {
        return this.getResourceBundle().getText("lastUpdated", [
          oDate.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          }),
        ]);
      },

      _round: function (vValue) {
        return Math.round(Number(vValue || 0));
      },

      _emptyDashboard: function () {
        return {
          busy: false,
          lastUpdatedText: "",
          session: this._emptySession(),
          kpis: {
            totalEmployees: this._kpi(0),
            avgProgress: this._percentKpi(0),
            pendingTasks: this._riskKpi(0, false),
            overdueTasks: this._riskKpi(0, false),
            highPriorityTasks: this._riskKpi(0, false),
            openDocuments: this._riskKpi(0, false),
            availableAssets: this._kpi(0, "Good"),
            trainingCompletion: this._percentKpi(0),
            taskClosure: this._percentKpi(0),
            documentReadiness: this._percentKpi(0),
            inactiveEmployees: this._riskKpi(0, false),
          },
          departmentProgress: [],
          peopleAtRisk: [],
          statusDistribution: [],
          taskDistribution: [],
          assetDistribution: [],
          priorityTasks: [],
          documentQueue: [],
        };
      },

      _emptySession: function () {
        return {
          loading: true,
          userId: "",
          displayName: "",
          userText: this.getResourceBundle().getText("sessionLoading"),
          roleText: "",
          accessText: "",
          roles: [],
          access: {
            employees: false,
            departments: false,
            tasks: false,
            documents: false,
            assets: false,
            trainings: false,
            reports: true,
          },
        };
      },

      getResourceBundle: function () {
        return this.getOwnerComponent().getModel("i18n").getResourceBundle();
      },
    });
  },
);
