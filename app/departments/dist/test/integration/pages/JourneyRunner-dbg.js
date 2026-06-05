sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"departments/test/integration/pages/DepartmentsList",
	"departments/test/integration/pages/DepartmentsObjectPage"
], function (JourneyRunner, DepartmentsList, DepartmentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('departments') + '/test/flpSandbox.html#departments-tile',
        pages: {
			onTheDepartmentsList: DepartmentsList,
			onTheDepartmentsObjectPage: DepartmentsObjectPage
        },
        async: true
    });

    return runner;
});

