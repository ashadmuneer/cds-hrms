const cds = require("@sap/cds");

module.exports = class OnboardingService extends cds.ApplicationService {
  init() {
    const { Employees, OnboardingTasks, Documents, Assets, Trainings, Departments } = this.entities;

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║  VALIDATION HANDLERS (before CREATE / UPDATE)                       ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    const validateEmployee = (req) => {
      const { email, joiningDate, department_ID: departmentId } = req.data;
      if (email !== undefined && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        req.error(400, "Please enter a valid email address (e.g., john@company.com)", "email");
      }
      if (joiningDate === null) req.error(400, "Joining date is required", "joiningDate");
      if (departmentId === null) req.error(400, "Please select a department", "department_ID");
    };

    this.before(["CREATE", "UPDATE"], Employees, validateEmployee);
    if (Employees.drafts) this.before(["PATCH", "SAVE"], Employees.drafts, validateEmployee);

    this.before(["CREATE", "UPDATE"], OnboardingTasks, (req) => {
      if (req.data.dueDate && req.data.dueDate <= new Date().toISOString().slice(0, 10)) {
        req.error(400, "Due date must be in the future. Please select a later date.", "dueDate");
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

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║  SUCCESS MESSAGES (after CREATE / UPDATE / DELETE)                   ║
    // ║  These show as toast notifications in Fiori Elements UI             ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Employees ────────────────────────────────────────────────────────
    this.after("CREATE", Employees, async (employee, req) => {
      if (!employee.ID) return;

      // Auto-generate onboarding tasks for new employee
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

      const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Employee";
      req.info(`✅ ${name} has been successfully onboarded! ${standardTasks.length} onboarding tasks were automatically assigned.`);
    });

    this.after("UPDATE", Employees, (employee, req) => {
      const name = [employee.firstName, employee.lastName].filter(Boolean).join(" ") || "Employee";
      req.info(`✅ ${name}'s profile has been updated successfully.`);
    });

    this.after("DELETE", Employees, (_, req) => {
      req.info("✅ Employee record has been deleted successfully.");
    });

    // ── Departments ──────────────────────────────────────────────────────
    this.after("CREATE", Departments, (dept, req) => {
      req.info(`✅ Department "${dept.name || "New"}" has been created successfully.`);
    });

    this.after("UPDATE", Departments, (dept, req) => {
      req.info(`✅ Department "${dept.name || ""}" has been updated successfully.`);
    });

    this.after("DELETE", Departments, (_, req) => {
      req.info("✅ Department has been deleted successfully.");
    });

    // ── Onboarding Tasks ────────────────────────────────────────────────
    this.after("CREATE", OnboardingTasks, (task, req) => {
      req.info(`✅ Task "${task.taskName || "New Task"}" has been created and assigned successfully.`);
    });

    this.after("UPDATE", OnboardingTasks, async (task, req) => {
      // Recalculate onboarding progress
      let empId = task.employee_ID || req.data.employee_ID;
      if (!empId) {
        const t = await SELECT.one.from(OnboardingTasks).where({ ID: req.data.ID || task.ID });
        if (t) empId = t.employee_ID;
      }

      if (empId) {
        const tasks = await SELECT.from(OnboardingTasks).where({ employee_ID: empId });
        if (tasks.length > 0) {
          const completedTasks = tasks.filter(t => t.status === "Completed").length;
          const progress = (completedTasks / tasks.length) * 100;
          await UPDATE(Employees).set({ onboardingProgress: progress }).where({ ID: empId });

          if (task.status === "Completed") {
            req.info(`✅ Task "${task.taskName || ""}" marked as completed. Onboarding progress: ${progress.toFixed(0)}%`);
          } else {
            req.info(`✅ Task "${task.taskName || ""}" has been updated successfully.`);
          }
        }
      } else {
        req.info(`✅ Task has been updated successfully.`);
      }
    });

    this.after("DELETE", OnboardingTasks, (_, req) => {
      req.info("✅ Task has been deleted successfully.");
    });

    // ── Documents ────────────────────────────────────────────────────────
    this.after("CREATE", Documents, (doc, req) => {
      req.info(`✅ Document "${doc.fileName || doc.documentType || "New"}" has been uploaded successfully.`);
    });

    this.after("UPDATE", Documents, (doc, req) => {
      if (doc.status === "Verified") {
        req.info(`✅ Document "${doc.fileName || ""}" has been verified and approved.`);
      } else if (doc.status === "Rejected") {
        req.warn(`⚠️ Document "${doc.fileName || ""}" has been rejected. Please re-upload.`);
      } else {
        req.info(`✅ Document "${doc.fileName || ""}" has been updated successfully.`);
      }
    });

    this.after("DELETE", Documents, (_, req) => {
      req.info("✅ Document has been deleted successfully.");
    });

    // ── Assets ───────────────────────────────────────────────────────────
    this.after("CREATE", Assets, (asset, req) => {
      req.info(`✅ Asset "${asset.assetType || ""} (${asset.assetNumber || "New"})" has been registered successfully.`);
    });

    this.after("UPDATE", Assets, (asset, req) => {
      if (asset.status === "Assigned") {
        req.info(`✅ Asset "${asset.assetNumber || ""}" has been assigned to the employee.`);
      } else if (asset.status === "Retired") {
        req.info(`✅ Asset "${asset.assetNumber || ""}" has been marked as retired.`);
      } else {
        req.info(`✅ Asset "${asset.assetNumber || ""}" has been updated successfully.`);
      }
    });

    this.after("DELETE", Assets, (_, req) => {
      req.info("✅ Asset record has been deleted successfully.");
    });

    // ── Trainings ────────────────────────────────────────────────────────
    this.after("CREATE", Trainings, (training, req) => {
      req.info(`✅ Training "${training.course || "New"}" has been assigned successfully.`);
    });

    this.after("UPDATE", Trainings, (training, req) => {
      if (training.status === "Completed") {
        const scoreText = training.score ? ` Score: ${training.score}%` : "";
        req.info(`🎉 Training "${training.course || ""}" completed successfully!${scoreText}`);
      } else if (training.status === "InProgress") {
        req.info(`✅ Training "${training.course || ""}" is now in progress.`);
      } else {
        req.info(`✅ Training "${training.course || ""}" has been updated successfully.`);
      }
    });

    this.after("DELETE", Trainings, (_, req) => {
      req.info("✅ Training record has been deleted successfully.");
    });

    // ╔══════════════════════════════════════════════════════════════════════╗
    // ║  CUSTOM ACTIONS                                                     ║
    // ╚══════════════════════════════════════════════════════════════════════╝

    // ── Approve Onboarding ───────────────────────────────────────────────
    this.on("approveOnboarding", Employees, async (req) => {
      const empId = req.params[0].ID || req.params[0];
      const employee = await SELECT.one.from(Employees).where({ ID: empId });

      if (!employee) return req.reject(404, "Employee not found. The record may have been deleted.");

      if (employee.status === "Active") {
        return req.reject(400, `${employee.firstName} ${employee.lastName} is already approved and active.`);
      }

      if (employee.onboardingProgress < 100) {
        const pending = 100 - employee.onboardingProgress;
        return req.reject(
          400,
          `Cannot approve: ${employee.firstName} ${employee.lastName} still has ${pending.toFixed(0)}% of onboarding tasks pending. All tasks must be completed before approval.`
        );
      }

      await UPDATE(Employees).set({ status: "Active" }).where({ ID: empId });

      req.info(
        `🎉 ${employee.firstName} ${employee.lastName} has been approved! Status changed to Active. Welcome aboard!`
      );

      return await SELECT.one.from(Employees).where({ ID: empId });
    });

    // ── Digital Signature ────────────────────────────────────────────────
    this.on("digitallySign", OnboardingTasks, async (req) => {
      const taskId = req.params[0].ID || req.params[0];
      const task = await SELECT.one.from(OnboardingTasks).where({ ID: taskId });

      if (!task) return req.reject(404, "Task not found. It may have been deleted.");
      if (task.status === "Completed") return req.reject(400, `Task "${task.taskName}" is already completed and signed.`);

      const timestamp = new Date().toISOString();
      const signature = `\n\n[Digitally Signed by ${req.user.id} on ${timestamp}]`;
      const newDesc = (task.description || "") + signature;

      await UPDATE(OnboardingTasks)
        .set({
          status: "Completed",
          description: newDesc
        })
        .where({ ID: taskId });

      // Recalculate onboarding progress
      const empId = task.employee_ID;
      if (empId) {
        const tasks = await SELECT.from(OnboardingTasks).where({ employee_ID: empId });
        const completedTasks = tasks.filter(t => t.status === "Completed" || t.ID === taskId).length;
        const progress = (completedTasks / tasks.length) * 100;
        await UPDATE(Employees).set({ onboardingProgress: progress }).where({ ID: empId });
      }

      req.info(
        `✅ Task "${task.taskName}" has been digitally signed by ${req.user.id} and marked as completed.`
      );

      return await SELECT.one.from(OnboardingTasks).where({ ID: taskId });
    });

    return super.init();
  }
};
