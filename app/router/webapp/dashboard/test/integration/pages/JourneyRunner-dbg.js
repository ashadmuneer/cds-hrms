sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"dashboard/test/integration/pages/EmployeeOverviewList",
	"dashboard/test/integration/pages/EmployeeOverviewObjectPage"
], function (JourneyRunner, EmployeeOverviewList, EmployeeOverviewObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('dashboard') + '/test/flpSandbox.html#dashboard-tile',
        pages: {
			onTheEmployeeOverviewList: EmployeeOverviewList,
			onTheEmployeeOverviewObjectPage: EmployeeOverviewObjectPage
        },
        async: true
    });

    return runner;
});

