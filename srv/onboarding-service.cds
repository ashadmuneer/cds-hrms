using { onboarding as db } from '../db/schema';

@requires: 'authenticated-user'
service OnboardingService {
  @odata.draft.enabled
  @cds.redirection.target
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'ITAdmin', 'Employee'] }
  ]
  entity Employees as projection on db.Employees;

  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'ITAdmin', 'Employee'] }
  ]
  entity Departments as projection on db.Departments;

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'Employee'] },
    { grant: ['READ', 'UPDATE'], to: 'ITAdmin' }
  ]
  entity OnboardingTasks as projection on db.OnboardingTasks;

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'Employee'] }
  ]
  entity Documents as projection on db.Documents;

  @odata.draft.enabled
  @restrict: [
    { grant: '*', to: ['HRAdmin', 'ITAdmin'] },
    { grant: 'READ', to: ['HRManager', 'Employee'] }
  ]
  entity Assets as projection on db.Assets;

  @restrict: [
    { grant: '*', to: 'HRAdmin' },
    { grant: 'READ', to: ['HRManager', 'Employee'] }
  ]
  entity Trainings as projection on db.Trainings;

  @readonly
  @cds.redirection.target: false
  entity EmployeeOverview as select from Employees {
    key ID,
    employeeNumber,
    firstName,
    lastName,
    department.name as departmentName,
    joiningDate,
    status,
    onboardingProgress
  };
}
