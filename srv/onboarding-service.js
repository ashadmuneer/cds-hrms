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

    this.after("CREATE", Employees, async (employee, req) => {
      if (!employee.ID) return;
      
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      const standardTasks = [
        {
          taskName: "Setup IT Equipment",
          description: "Provide laptop and configure necessary software.",
          employee_ID: employee.ID,
          assignedTo: "sarah.connor@company.com",
          dueDate: nextWeek,
          priority: "High",
          status: "Pending"
        },
        {
          taskName: "Create Email Account",
          description: "Provision corporate email and add to distribution lists.",
          employee_ID: employee.ID,
          assignedTo: "sarah.connor@company.com",
          dueDate: nextWeek,
          priority: "High",
          status: "Pending"
        },
        {
          taskName: "Sign Code of Conduct",
          description: "Read and acknowledge the company code of conduct.",
          employee_ID: employee.ID,
          assignedTo: employee.email,
          dueDate: nextWeek,
          priority: "High",
          status: "Pending"
        },
        {
          taskName: "Complete Security Training",
          description: "Mandatory cybersecurity awareness training.",
          employee_ID: employee.ID,
          assignedTo: employee.email,
          dueDate: nextWeek,
          priority: "Medium",
          status: "Pending"
        }
      ];

      await INSERT.into(OnboardingTasks).entries(standardTasks);
      console.log(`[Automation] Generated ${standardTasks.length} standard tasks for new employee: ${employee.email}`);
    });

    // 1. Automated Progress Calculation
    this.after(["UPDATE"], OnboardingTasks, async (task, req) => {
      // We need the employee_ID. It might not be in req.data if it's a partial update.
      let empId = task.employee_ID || req.data.employee_ID;
      
      if (!empId) {
         const t = await SELECT.one.from(OnboardingTasks).where({ ID: req.data.ID || task.ID });
         if (t) empId = t.employee_ID;
      }

      if (empId) {
        const tasks = await SELECT.from(OnboardingTasks).where({ employee_ID: empId });
        if (tasks.length > 0) {
          const completedTasks = tasks.filter(t => t.status === 'Completed').length;
          const progress = (completedTasks / tasks.length) * 100;
          await UPDATE(Employees).set({ onboardingProgress: progress }).where({ ID: empId });
        }
      }
    });

    // 2. Manager Approval Workflow
    this.on("approveOnboarding", Employees, async (req) => {
      const empId = req.params[0].ID || req.params[0];
      const employee = await SELECT.one.from(Employees).where({ ID: empId });
      
      if (!employee) return req.error(404, "Employee not found");
      
      if (employee.onboardingProgress < 100) {
        return req.error(400, "Cannot approve: Employee still has pending tasks.");
      }
      
      await UPDATE(Employees).set({ status: 'Active' }).where({ ID: empId });
      return await SELECT.one.from(Employees).where({ ID: empId });
    });

    // 3. Digital Consent
    this.on("digitallySign", OnboardingTasks, async (req) => {
      const taskId = req.params[0].ID || req.params[0];
      const task = await SELECT.one.from(OnboardingTasks).where({ ID: taskId });
      
      if (!task) return req.error(404, "Task not found");
      if (task.status === 'Completed') return req.error(400, "Task is already completed.");

      const timestamp = new Date().toISOString();
      const signature = `\n\n[Digitally Signed by ${req.user.id} on ${timestamp}]`;
      const newDesc = (task.description || '') + signature;

      await UPDATE(OnboardingTasks).set({ 
        status: 'Completed',
        description: newDesc
      }).where({ ID: taskId });

      // We need to trigger the progress calculation manually here since this is a custom action
      const empId = task.employee_ID;
      if (empId) {
        const tasks = await SELECT.from(OnboardingTasks).where({ employee_ID: empId });
        const completedTasks = tasks.filter(t => t.status === 'Completed' || t.ID === taskId).length;
        const progress = (completedTasks / tasks.length) * 100;
        await UPDATE(Employees).set({ onboardingProgress: progress }).where({ ID: empId });
      }

      return await SELECT.one.from(OnboardingTasks).where({ ID: taskId });
    });

    return super.init();
  }
};
