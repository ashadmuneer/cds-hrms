using { onboarding as db } from '../db/schema';

@requires: 'authenticated-user'
service OnboardingService {
  @odata.draft.enabled
  @cds.redirection.target
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: ['READ', 'approveOnboarding'], to: 'HRManager' },
    { grant: 'READ', to: 'ITAdmin' },
    { grant: 'READ', to: 'Employee', where: 'email = $user' }
  ]
  entity Employees as projection on db.Employees actions {
    action approveOnboarding() returns Employees;
  };

  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'ITAdmin', 'Employee'] }
  ]
  entity Departments as projection on db.Departments;

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: 'HRManager' },
    { grant: ['READ', 'UPDATE'], to: 'ITAdmin', where: 'assignedTo = $user' },
    { grant: 'READ', to: 'Employee', where: 'employee.email = $user' },
    { grant: ['UPDATE', 'digitallySign'], to: 'Employee', where: 'assignedTo = $user' }
  ]
  entity OnboardingTasks as projection on db.OnboardingTasks actions {
    action digitallySign() returns OnboardingTasks;
  };

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: 'HRManager' },
    { grant: ['READ', 'CREATE', 'UPDATE'], to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Documents as projection on db.Documents;

  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: ['HRAdmin', 'ITAdmin'] },
    { grant: 'READ', to: 'HRManager' },
    { grant: 'READ', to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Assets as projection on db.Assets;

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: 'HRManager' },
    { grant: 'READ', to: 'Employee', where: 'employee.email = $user' }
  ]
  entity Trainings as projection on db.Trainings;

  @readonly
  @cds.redirection.target: false
  @restrict: [
    { grant: 'READ', to: ['HRAdmin', 'HRManager'] },
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
