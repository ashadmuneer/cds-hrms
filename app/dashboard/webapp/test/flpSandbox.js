sap.ui.define([], function () {
  "use strict";

  window["sap-ushell-config"] = {
    defaultRenderer: "fiori2",
    bootstrapPlugins: {
      RuntimeAuthoringPlugin: {
        component: "sap.ushell.plugins.rta",
        config: {
          validateAppVersion: false,
        },
      },
    },
    renderers: {
      fiori2: {
        componentData: {
          config: {
            search: "hidden",
            enableSearch: false,
          },
        },
      },
    },
    applications: {
      "dashboard-tile": {
        title: "Onboarding Dashboard",
        description: "Analytical overview of employee onboarding progress",
        additionalInformation: "SAPUI5.Component=dashboard",
        applicationType: "URL",
        url: "../",
      },
      "Employees-manage": {
        title: "Employees",
        description: "Manage employees",
        additionalInformation: "SAPUI5.Component=employees",
        applicationType: "URL",
        url: "../../employees/",
      },
      "Departments-manage": {
        title: "Departments",
        description: "Manage departments",
        additionalInformation: "SAPUI5.Component=departments",
        applicationType: "URL",
        url: "../../departments/",
      },
      "OnboardingTasks-manage": {
        title: "Onboarding Tasks",
        description: "Manage onboarding tasks",
        additionalInformation: "SAPUI5.Component=onboardingtasks",
        applicationType: "URL",
        url: "../../onboardingtasks/",
      },
      "Documents-manage": {
        title: "Documents",
        description: "Manage documents",
        additionalInformation: "SAPUI5.Component=documents",
        applicationType: "URL",
        url: "../../documents/",
      },
      "Assets-manage": {
        title: "Assets",
        description: "Manage assets",
        additionalInformation: "SAPUI5.Component=assets",
        applicationType: "URL",
        url: "../../assets/",
      },
      "Trainings-manage": {
        title: "Training",
        description: "Manage training",
        additionalInformation: "SAPUI5.Component=trainings",
        applicationType: "URL",
        url: "../../trainings/",
      },
      "Reports-display": {
        title: "Reports",
        description: "Display onboarding reports",
        additionalInformation: "SAPUI5.Component=reports",
        applicationType: "URL",
        url: "../../reports/",
      },
    },
  };
});
