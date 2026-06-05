sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"documents/test/integration/pages/DocumentsList",
	"documents/test/integration/pages/DocumentsObjectPage"
], function (JourneyRunner, DocumentsList, DocumentsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('documents') + '/test/flpSandbox.html#documents-tile',
        pages: {
			onTheDocumentsList: DocumentsList,
			onTheDocumentsObjectPage: DocumentsObjectPage
        },
        async: true
    });

    return runner;
});

