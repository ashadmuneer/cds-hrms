const cds = require("@sap/cds");

module.exports = class OnboardingService extends cds.ApplicationService {
  init() {
    const { Employees, OnboardingTasks, Documents, Assets, Trainings } = this.entities;

    const validateEmployee = (req) => {
      const { email, joiningDate, department_ID: departmentId } = req.data;
      if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.error(400, "Enter a valid email address", "email");
      }
      if (joiningDate === null) req.error(400, "Joining date is required", "joiningDate");
      if (departmentId === null) req.error(400, "Department is required", "department_ID");
    };

    this.before(["CREATE", "UPDATE"], Employees, validateEmployee);
    if (Employees.drafts) this.before(["PATCH", "SAVE"], Employees.drafts, validateEmployee);

    this.before(["CREATE", "UPDATE"], OnboardingTasks, (req) => {
      if (req.data.dueDate && req.data.dueDate <= new Date().toISOString().slice(0, 10)) {
        req.error(400, "Task due date must be in the future", "dueDate");
      }
    });

    this.before(["CREATE", "UPDATE"], Documents, (req) => {
      if (req.data.uploadedDate === undefined && req.event === "CREATE") {
        req.data.uploadedDate = new Date().toISOString().slice(0, 10);
      }
    });

    this.before(["CREATE", "UPDATE"], Assets, (req) => {
      if (req.data.employee_ID && !req.data.assignedDate) {
        req.data.assignedDate = new Date().toISOString().slice(0, 10);
      }
      if (req.data.employee_ID) req.data.status = "Assigned";
    });

    this.before(["CREATE", "UPDATE"], Trainings, (req) => {
      if (req.data.status === "Completed" && !req.data.completedAt) {
        req.data.completedAt = new Date().toISOString().slice(0, 10);
      }
    });

    return super.init();
  }
};
