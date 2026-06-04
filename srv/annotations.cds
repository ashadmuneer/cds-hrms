using OnboardingService as service from './onboarding-service';

annotate service.Employees with @(
  UI.HeaderInfo: {
    TypeName: 'Employee',
    TypeNamePlural: 'Employees',
    Title: { Value: employeeNumber },
    Description: { Value: email }
  },
  UI.SelectionFields: [employeeNumber, firstName, lastName, department_ID, joiningDate, status],
  UI.LineItem: [
    { Value: employeeNumber, Label: 'Employee ID' },
    { Value: firstName, Label: 'First Name' },
    { Value: lastName, Label: 'Last Name' },
    { Value: email, Label: 'Email' },
    { Value: department.name, Label: 'Department' },
    { Value: manager.employeeNumber, Label: 'Manager' },
    { Value: joiningDate, Label: 'Joining Date' },
    { Value: status, Label: 'Status' }
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
  UI.LineItem: [{ Value: taskName }, { Value: employee.employeeNumber, Label: 'Employee' }, { Value: assignedTo }, { Value: dueDate }, { Value: priority }, { Value: status }],
  UI.Facets: [{ $Type: 'UI.ReferenceFacet', Label: 'Task Details', Target: '@UI.FieldGroup#Details' }],
  UI.FieldGroup#Details: { Data: [{ Value: taskName }, { Value: description }, { Value: employee_ID }, { Value: assignedTo }, { Value: dueDate }, { Value: priority }, { Value: status }] }
);

annotate service.Documents with @(
  UI.HeaderInfo: { TypeName: 'Document', TypeNamePlural: 'Documents', Title: { Value: fileName }, Description: { Value: documentType } },
  UI.SelectionFields: [documentType, employee_ID, uploadedDate, status],
  UI.LineItem: [{ Value: documentType }, { Value: fileName }, { Value: employee.employeeNumber, Label: 'Employee' }, { Value: uploadedDate }, { Value: status }],
  UI.Facets: [{ $Type: 'UI.ReferenceFacet', Label: 'Document Details', Target: '@UI.FieldGroup#Details' }],
  UI.FieldGroup#Details: { Data: [{ Value: documentType }, { Value: fileName }, { Value: mediaType }, { Value: employee_ID }, { Value: uploadedDate }, { Value: status }] }
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
