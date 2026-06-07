using OnboardingService as service from './onboarding-service';

// ---------------------------------------------------------------------------
// USER-FRIENDLY FIELD LABELS, PLACEHOLDERS (QUICK INFO), AND VALIDATIONS
// ---------------------------------------------------------------------------
annotate service.Employees with {
  employeeNumber @title: 'Employee ID' @Common.QuickInfo: 'Unique employee identifier (e.g., EMP-1001)' @mandatory;
  firstName @title: 'First Name' @Common.QuickInfo: 'Enter the employee''s legal first name (e.g., Jane)' @mandatory;
  lastName @title: 'Last Name' @Common.QuickInfo: 'Enter the employee''s legal last name' @mandatory;
  email @title: 'Email Address' @Common.QuickInfo: 'Use corporate format: firstname.lastname@company.com' @mandatory @assert.format: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';
  phone @title: 'Phone Number' @Common.QuickInfo: 'Include the country code (e.g., +1 555-0100)';
  dateOfBirth @title: 'Date of Birth' @Common.QuickInfo: 'Select the date of birth (Format: YYYY-MM-DD)';
  gender @title: 'Gender' @Common.QuickInfo: 'Specify the employee''s gender';
  department @title: 'Department' @Common.QuickInfo: 'Select the department from the dropdown list' @mandatory;
  manager @title: 'Manager' @Common.QuickInfo: 'Select the assigned manager from the dropdown list';
  designation @title: 'Job Title' @Common.QuickInfo: 'Enter the official job title (e.g., Software Engineer)';
  joiningDate @title: 'Joining Date' @Common.QuickInfo: 'Select the official start date' @mandatory;
  employmentType @title: 'Employment Type' @Common.QuickInfo: 'e.g., Full-Time, Part-Time, Contract';
  location @title: 'Location' @Common.QuickInfo: 'Specify the office location or Remote';
  status @title: 'Employment Status' @Common.QuickInfo: 'e.g., Onboarding, Active, Terminated';
  onboardingProgress @title: 'Onboarding Progress (%)' @Common.QuickInfo: 'Calculated completion percentage of onboarding tasks';
  permanentAddress @title: 'Permanent Address' @Common.QuickInfo: 'Enter the full permanent residential address';
  currentAddress @title: 'Current Address' @Common.QuickInfo: 'Enter the current residential address';
  city @title: 'City' @Common.QuickInfo: 'Enter the city';
  state @title: 'State / Province' @Common.QuickInfo: 'Enter the state or province';
  country @title: 'Country' @Common.QuickInfo: 'Enter the country';
  zipCode @title: 'ZIP / Postal Code' @Common.QuickInfo: 'Enter the postal code';
  emergencyContactName @title: 'Emergency Contact Name' @Common.QuickInfo: 'Full name of the emergency contact';
  emergencyRelationship @title: 'Relationship' @Common.QuickInfo: 'e.g., Spouse, Parent, Sibling';
  emergencyPhone @title: 'Emergency Phone' @Common.QuickInfo: 'Include the country code (e.g., +1 555-0100)';
};

annotate service.OnboardingTasks with {
  taskName @title: 'Task Name' @Common.QuickInfo: 'Short, descriptive title for the task' @mandatory;
  description @title: 'Task Description' @Common.QuickInfo: 'Detailed instructions for the task';
  employee @title: 'Employee' @Common.QuickInfo: 'Select the employee this task belongs to' @mandatory;
  assignedTo @title: 'Assigned To' @Common.QuickInfo: 'Email or role responsible for completing the task';
  dueDate @title: 'Due Date' @Common.QuickInfo: 'Deadline for task completion';
  priority @title: 'Priority' @Common.QuickInfo: 'e.g., High, Medium, Low';
  status @title: 'Status' @Common.QuickInfo: 'e.g., Open, In Progress, Completed';
};

annotate service.Documents with {
  documentType @title: 'Document Type' @Common.QuickInfo: 'e.g., Passport, Degree, NDA' @mandatory;
  fileName @title: 'File Name' @Common.QuickInfo: 'Name of the uploaded file' @mandatory;
  mediaType @title: 'Media Type' @Core.IsMediaType;
  fileContent @title: 'Attachment' @Core.MediaType: mediaType @Core.ContentDisposition.Filename: fileName @Core.ContentDisposition.Type: 'inline';
  uploadedDate @title: 'Uploaded Date' @Common.QuickInfo: 'Date the document was uploaded';
  status @title: 'Document Status' @Common.QuickInfo: 'e.g., Pending, Uploaded, Verified, Rejected';
  employee @title: 'Employee' @Common.QuickInfo: 'The employee this document belongs to' @mandatory;
};


// ---------------------------------------------------------------------------
// UI FACETS AND LIST REPORT ANNOTATIONS
// ---------------------------------------------------------------------------
annotate service.Employees with @(
  UI.HeaderInfo: { TypeName: 'Employee', TypeNamePlural: 'Employees', Title: { Value: firstName }, Description: { Value: employeeNumber } },
  UI.DataPoint#Progress: { Value: onboardingProgress, TargetValue: 100, Visualization: #Progress, Title: 'Onboarding Progress (%)' },
  UI.SelectionFields: [employeeNumber, department_ID, status],
  UI.LineItem: [
    { $Type: 'UI.DataFieldForAction', Action: 'OnboardingService.approveOnboarding', Label: 'Approve' },
    { Value: employeeNumber },
    { Value: firstName },
    { Value: lastName },
    { Value: department.name, Label: 'Department' },
    { Value: manager.employeeNumber, Label: 'Manager' },
    { Value: joiningDate, Label: 'Joining Date' },
    { Value: onboardingProgress, Label: 'Progress' },
    { Value: status, Label: 'Status' }
  ],
  UI.Identification: [
    { $Type: 'UI.DataFieldForAction', Action: 'OnboardingService.approveOnboarding', Label: 'Approve Onboarding' }
  ],
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'General Information', Target: '@UI.FieldGroup#General' },
    { $Type: 'UI.ReferenceFacet', Label: 'Employment Details', Target: '@UI.FieldGroup#Employment' },
    { $Type: 'UI.ReferenceFacet', Label: 'Address', Target: '@UI.FieldGroup#Address' },
    { $Type: 'UI.ReferenceFacet', Label: 'Emergency Contact', Target: '@UI.FieldGroup#Emergency' },
    { $Type: 'UI.ReferenceFacet', Label: 'Documents', Target: 'documents/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', Label: 'Assets', Target: 'assets/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', Label: 'Onboarding Tasks', Target: 'tasks/@UI.LineItem' },
    { $Type: 'UI.ReferenceFacet', Label: 'Trainings', Target: 'trainings/@UI.LineItem' }
  ],
  UI.FieldGroup#General: {
    Data: [
      { Value: employeeNumber }, { Value: firstName }, { Value: lastName },
      { Value: dateOfBirth }, { Value: gender }, { Value: email }, { Value: phone }
    ]
  },
  UI.FieldGroup#Employment: {
    Data: [
      { Value: department_ID }, { Value: designation }, { Value: manager_ID },
      { Value: joiningDate }, { Value: employmentType }, { Value: location },
      { Value: status }, { Value: onboardingProgress }
    ]
  },
  UI.FieldGroup#Address: {
    Data: [
      { Value: permanentAddress }, { Value: currentAddress }, { Value: city },
      { Value: state }, { Value: country }, { Value: zipCode }
    ]
  },
  UI.FieldGroup#Emergency: {
    Data: [
      { Value: emergencyContactName }, { Value: emergencyRelationship }, { Value: emergencyPhone }
    ]
  }
);

annotate service.Departments with @(
  UI.HeaderInfo: { TypeName: 'Department', TypeNamePlural: 'Departments', Title: { Value: name }, Description: { Value: code } },
  UI.SelectionFields: [code, name],
  UI.LineItem: [{ Value: code }, { Value: name }, { Value: description }],
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Department Details', Target: '@UI.FieldGroup#Details' },
    { $Type: 'UI.ReferenceFacet', Label: 'Employees', Target: 'employees/@UI.LineItem' }
  ],
  UI.FieldGroup#Details: { Data: [{ Value: code }, { Value: name }, { Value: description }] }
);

annotate service.OnboardingTasks with @(
  UI.HeaderInfo: { TypeName: 'Onboarding Task', TypeNamePlural: 'Onboarding Tasks', Title: { Value: taskName }, Description: { Value: assignedTo } },
  UI.SelectionFields: [employee_ID, assignedTo, dueDate, priority, status],
  UI.LineItem: [
    { $Type: 'UI.DataFieldForAction', Action: 'OnboardingService.digitallySign', Label: 'Digitally Sign' },
    { Value: taskName }, 
    { Value: employee.employeeNumber, Label: 'Employee' }, 
    { Value: assignedTo }, 
    { Value: dueDate }, 
    { Value: priority }, 
    { Value: status }
  ],
  UI.Identification: [
    { $Type: 'UI.DataFieldForAction', Action: 'OnboardingService.digitallySign', Label: 'Digitally Sign Task' }
  ],
  UI.Facets: [{ $Type: 'UI.ReferenceFacet', Label: 'Task Details', Target: '@UI.FieldGroup#Details' }],
  UI.FieldGroup#Details: { Data: [{ Value: taskName }, { Value: description }, { Value: employee_ID }, { Value: assignedTo }, { Value: dueDate }, { Value: priority }, { Value: status }] }
);

annotate service.Documents with @(
  UI.HeaderInfo: { TypeName: 'Document', TypeNamePlural: 'Documents', Title: { Value: fileName }, Description: { Value: documentType } },
  UI.SelectionFields: [documentType, employee_ID, uploadedDate, status],
  UI.LineItem: [{ Value: documentType }, { Value: fileName }, { Value: employee.employeeNumber, Label: 'Employee' }, { Value: uploadedDate }, { Value: status }],
  UI.Facets: [
    { $Type: 'UI.ReferenceFacet', Label: 'Document Details', Target: '@UI.FieldGroup#Details' },
    { $Type: 'UI.ReferenceFacet', Label: 'Attachment', Target: '@UI.FieldGroup#Attachment' }
  ],
  UI.FieldGroup#Details: { Data: [{ Value: documentType }, { Value: fileName }, { Value: employee_ID }, { Value: uploadedDate }, { Value: status }] },
  UI.FieldGroup#Attachment: { Data: [{ Value: fileContent, Label: 'Upload File' }, { Value: mediaType }] }
);

annotate service.Assets with @(
  UI.HeaderInfo: { TypeName: 'Asset', TypeNamePlural: 'Assets', Title: { Value: assetNumber }, Description: { Value: assetType } },
  UI.SelectionFields: [assetType, employee_ID, assignedDate, status],
  UI.LineItem: [{ Value: assetNumber }, { Value: assetType }, { Value: serialNumber }, { Value: employee.employeeNumber, Label: 'Employee' }, { Value: assignedDate }, { Value: status }],
  UI.Facets: [{ $Type: 'UI.ReferenceFacet', Label: 'Asset Details', Target: '@UI.FieldGroup#Details' }],
  UI.FieldGroup#Details: { Data: [{ Value: assetNumber }, { Value: assetType }, { Value: description }, { Value: serialNumber }, { Value: employee_ID }, { Value: assignedDate }, { Value: status }] }
);

annotate service.Trainings with @(
  UI.HeaderInfo: { TypeName: 'Training', TypeNamePlural: 'Trainings', Title: { Value: course }, Description: { Value: status } },
  UI.SelectionFields: [employee_ID, dueDate, status],
  UI.LineItem: [{ Value: course }, { Value: employee.employeeNumber, Label: 'Employee' }, { Value: dueDate }, { Value: status }, { Value: score }],
  UI.Facets: [{ $Type: 'UI.ReferenceFacet', Label: 'Training Details', Target: '@UI.FieldGroup#Details' }],
  UI.FieldGroup#Details: { Data: [{ Value: course }, { Value: description }, { Value: employee_ID }, { Value: dueDate }, { Value: status }, { Value: score }, { Value: completedAt }] }
);

annotate service.Employees:department with @Common.ValueList: {
  CollectionPath: 'Departments',
  Parameters: [
    { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: department_ID, ValueListProperty: 'ID' },
    { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'code' },
    { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'name' }
  ]
};

annotate service.Employees:manager with @Common.ValueList: {
  CollectionPath: 'Employees',
  Parameters: [
    { $Type: 'Common.ValueListParameterInOut', LocalDataProperty: manager_ID, ValueListProperty: 'ID' },
    { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'employeeNumber' },
    { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'firstName' },
    { $Type: 'Common.ValueListParameterDisplayOnly', ValueListProperty: 'lastName' }
  ]
};

annotate service.EmployeeOverview with @(
  Aggregation.CustomAggregate#onboardingProgress: 'Edm.Decimal',
  Aggregation.ApplySupported: {
    Transformations: [
      'aggregate',
      'groupby',
      'filter',
      'search',
      'top',
      'skip',
      'orderby'
    ],
    Rollup: #None,
    PropertyRestrictions: true,
    GroupableProperties: [
      employeeNumber,
      firstName,
      lastName,
      departmentName,
      joiningDate,
      status
    ],
    AggregatableProperties: [
      { Property: onboardingProgress }
    ]
  },
  UI.HeaderInfo: {
    TypeName: 'Employee Overview',
    TypeNamePlural: 'Employee Overview',
    Title: { Value: employeeNumber },
    Description: { Value: departmentName }
  },
  UI.SelectionFields: [departmentName, joiningDate, status],
  UI.LineItem: [
    { Value: employeeNumber, Label: 'Employee ID' },
    { Value: firstName },
    { Value: lastName },
    { Value: departmentName, Label: 'Department' },
    { Value: joiningDate },
    { Value: status },
    { Value: onboardingProgress, Label: 'Onboarding Progress' }
  ],
  UI.Chart: {
    $Type: 'UI.ChartDefinitionType',
    Title: 'Onboarding Progress by Department',
    ChartType: #Column,
    Dimensions: [departmentName],
    Measures: [onboardingProgress],
    DimensionAttributes: [{
      $Type: 'UI.ChartDimensionAttributeType',
      Dimension: departmentName,
      Role: #Category
    }],
    MeasureAttributes: [{
      $Type: 'UI.ChartMeasureAttributeType',
      Measure: onboardingProgress,
      Role: #Axis1
    }]
  },
  UI.PresentationVariant: {
    Visualizations: ['@UI.Chart', '@UI.LineItem'],
    SortOrder: [{ Property: joiningDate, Descending: true }]
  }
);

annotate service.EmployeeOverview:onboardingProgress with @(
  Analytics.Measure: true,
  Aggregation.default: #AVG
);
