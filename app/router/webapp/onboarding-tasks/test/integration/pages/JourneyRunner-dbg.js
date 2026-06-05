sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"onboardingtasks/test/integration/pages/OnboardingTasksList",
	"onboardingtasks/test/integration/pages/OnboardingTasksObjectPage"
], function (JourneyRunner, OnboardingTasksList, OnboardingTasksObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('onboardingtasks') + '/test/flpSandbox.html#onboardingtasks-tile',
        pages: {
			onTheOnboardingTasksList: OnboardingTasksList,
			onTheOnboardingTasksObjectPage: OnboardingTasksObjectPage
        },
        async: true
    });

    return runner;
});

