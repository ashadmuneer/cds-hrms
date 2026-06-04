sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"trainings/test/integration/pages/TrainingsList",
	"trainings/test/integration/pages/TrainingsObjectPage"
], function (JourneyRunner, TrainingsList, TrainingsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('trainings') + '/test/flpSandbox.html#trainings-tile',
        pages: {
			onTheTrainingsList: TrainingsList,
			onTheTrainingsObjectPage: TrainingsObjectPage
        },
        async: true
    });

    return runner;
});

