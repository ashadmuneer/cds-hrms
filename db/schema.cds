using { cuid, managed } from '@sap/cds/common';

namespace onboarding;

type EmployeeStatus : String enum {
  Draft;
  Pending;
  Active;
  OnLeave;
  Inactive;
  Completed;
}

type TaskStatus : String enum {
  Pending;
  InProgress;
  Completed;
  Rejected;
}

type Priority : String enum {
  Low;
  Medium;
  High;
  Critical;
}

type DocumentStatus : String enum {
  Pending;
  Uploaded;
  Verified;
  Rejected;
}

type AssetStatus : String enum {
  Available;
  Assigned;
  Maintenance;
  Retired;
}

type TrainingStatus : String enum {
  Assigned;
  InProgress;
  Completed;
}

@assert.unique: { DepartmentCode: [code] }
entity Departments : cuid, managed {
  code        : String(10)  @mandatory;
  name        : String(100) @mandatory;
  description : String(500);
  employees   : Association to many Employees on employees.department = $self;
}

@assert.unique: {
  EmployeeNumber: [employeeNumber],
  EmployeeEmail: [email]
}
entity Employees : cuid, managed {
  employeeNumber       : String(20)  @mandatory;
  firstName            : String(80)  @mandatory;
  lastName             : String(80)  @mandatory;
  dateOfBirth          : Date;
  gender               : String(30);
  email                : String(255) @mandatory;
  phone                : String(30);
  department           : Association to Departments @mandatory;
  designation          : String(120);
  manager              : Association to Employees;
  joiningDate          : Date @mandatory;
  employmentType       : String(50);
  location             : String(120);
  permanentAddress     : String(500);
  currentAddress       : String(500);
  city                 : String(100);
  state                : String(100);
  country              : String(100);
  zipCode              : String(20);
  emergencyContactName : String(160);
  emergencyRelationship: String(80);
  emergencyPhone       : String(30);
  status               : EmployeeStatus default #Pending;
  onboardingProgress   : Decimal(5,2) default 0;
  documents            : Association to many Documents on documents.employee = $self;
  tasks                : Association to many OnboardingTasks on tasks.employee = $self;
  trainings            : Association to many Trainings on trainings.employee = $self;
  assets               : Association to many Assets on assets.employee = $self;
}

entity OnboardingTasks : cuid, managed {
  taskName    : String(160) @mandatory;
  description : String(1000);
  employee    : Association to Employees @mandatory;
  assignedTo  : String(255) @mandatory;
  dueDate     : Date @mandatory;
  priority    : Priority default #Medium;
  status      : TaskStatus default #Pending;
}

entity Documents : cuid, managed {
  documentType : String(80) @mandatory;
  fileName     : String(255) @mandatory;
  mediaType    : String(100);
  fileContent  : LargeBinary;
  uploadedDate : Date;
  status       : DocumentStatus default #Pending;
  employee     : Association to Employees @mandatory;
}

@assert.unique: { AssetNumber: [assetNumber] }
entity Assets : cuid, managed {
  assetNumber  : String(50) @mandatory;
  assetType    : String(80) @mandatory;
  description  : String(500);
  serialNumber : String(100);
  employee     : Association to Employees;
  assignedDate : Date;
  status       : AssetStatus default #Available;
}

entity Trainings : cuid, managed {
  course      : String(160) @mandatory;
  description : String(1000);
  employee    : Association to Employees @mandatory;
  dueDate     : Date @mandatory;
  status      : TrainingStatus default #Assigned;
  score       : Decimal(5,2);
  completedAt : Date;
}
