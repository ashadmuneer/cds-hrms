using { onboarding as db } from '../db/schema';

@requires: 'authenticated-user'
service OnboardingService {

  // ╔══════════════════════════════════════════════════════════════════════╗
  // ║  ROLE-BASED ACCESS CONTROL (RBAC)                                   ║
  // ║                                                                      ║
  // ║  HRAdmin   → System admin: full CRUD on everything                  ║
  // ║  HRManager → Day-to-day HR: hires employees, assigns tasks/docs    ║
  // ║  ITAdmin   → IT support: manages assets & IT-related tasks          ║
  // ║  Employee  → Self-service: views own data, uploads own docs         ║
  // ╚══════════════════════════════════════════════════════════════════════╝

  // ── Employees ──────────────────────────────────────────────────────────
  // HRAdmin   : Full CRUD + approve
  // HRManager : CREATE + READ + UPDATE + approve (hire people, edit profiles)
  // ITAdmin   : READ only (see employee info for provisioning)
  // Employee  : READ own profile only
  @odata.draft.enabled
  @cds.redirection.target
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: ['CREATE', 'READ', 'UPDATE', 'approveOnboarding'], to: 'HRManager' },
    { grant: 'READ', to: 'ITAdmin' },
    { grant: 'READ', to: 'Employee', where: 'email = $user' }
  ]
  entity Employees as projection on db.Employees actions {
    action approveOnboarding() returns Employees;
  };

  // ── Departments ────────────────────────────────────────────────────────
  // HRAdmin   : Full CRUD (create/rename/delete departments)
  // HRManager : READ only (view departments)
  // ITAdmin   : READ only
  // Employee  : READ only
  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'ITAdmin', 'Employee'] }
  ]
  entity Departments as projection on db.Departments;

  // ── Onboarding Tasks ──────────────────────────────────────────────────
  // HRAdmin   : Full CRUD
  // HRManager : CREATE + READ + UPDATE + DELETE (assign/manage all tasks)
  // ITAdmin   : READ all + UPDATE tasks assigned to them
  // Employee  : READ own tasks + UPDATE/sign tasks assigned to them
  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: ['CREATE', 'READ', 'UPDATE', 'DELETE'], to: 'HRManager' },
    { grant: 'READ', to: 'ITAdmin' },
    { grant: ['UPDATE'], to: 'ITAdmin', where: 'assignedTo = $user' },
    { grant: 'READ', to: 'Employee', where: 'employee.email = $user' },
    { grant: ['UPDATE', 'digitallySign'], to: 'Employee', where: 'assignedTo = $user' }
  ]
  entity OnboardingTasks as projection on db.OnboardingTasks actions {
    action digitallySign() returns OnboardingTasks;
  };

  // ── Documents ─────────────────────────────────────────────────────────
  // HRAdmin   : Full CRUD
  // HRManager : CREATE + READ + UPDATE (upload/manage employee documents)
  // ITAdmin   : READ only
  // Employee  : READ + CREATE + UPDATE own documents
  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: ['CREATE', 'READ', 'UPDATE'], to: 'HRManager' },
    { grant: 'READ', to: 'ITAdmin' },
    { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Documents as projection on db.Documents;

  // ── Assets ────────────────────────────────────────────────────────────
  // HRAdmin   : Full CRUD
  // ITAdmin   : Full CRUD (manage IT equipment, laptops, badges)
  // HRManager : READ only (view asset assignments)
  // Employee  : READ own assets only
  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: ['HRAdmin', 'ITAdmin'] },
    { grant: 'READ', to: 'HRManager' },
    { grant: 'READ', to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Assets as projection on db.Assets;

  // ── Trainings ─────────────────────────────────────────────────────────
  // HRAdmin   : Full CRUD
  // HRManager : CREATE + READ + UPDATE (assign training programs)
  // ITAdmin   : READ only
  // Employee  : READ + UPDATE own (mark completion, record score)
  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: ['CREATE', 'READ', 'UPDATE'], to: 'HRManager' },
    { grant: 'READ', to: 'ITAdmin' },
    { grant: ['READ', 'UPDATE'], to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Trainings as projection on db.Trainings;

  // ── Reports View (read-only) ──────────────────────────────────────────
  @readonly
  @cds.redirection.target: false
  @restrict: [
    { grant: 'READ', to: ['HRAdmin', 'HRManager', 'ITAdmin'] },
    { grant: 'READ', to: 'Employee', where: 'email = $user' }
  ]
  entity EmployeeOverview as select from Employees {
    key ID,
    employeeNumber,
    firstName,
    lastName,
    email,
    department.name as departmentName,
    joiningDate,
    status,
    onboardingProgress
  };
}
