sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"reports/test/integration/pages/EmployeeOverviewList",
	"reports/test/integration/pages/EmployeeOverviewObjectPage"
], function (JourneyRunner, EmployeeOverviewList, EmployeeOverviewObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('reports') + '/test/flpSandbox.html#reports-tile',
        pages: {
			onTheEmployeeOverviewList: EmployeeOverviewList,
			onTheEmployeeOverviewObjectPage: EmployeeOverviewObjectPage
        },
        async: true
    });

    return runner;
});

