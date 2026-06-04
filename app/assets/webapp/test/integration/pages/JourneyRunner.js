sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"assets/test/integration/pages/AssetsList",
	"assets/test/integration/pages/AssetsObjectPage"
], function (JourneyRunner, AssetsList, AssetsObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('assets') + '/test/flpSandbox.html#assets-tile',
        pages: {
			onTheAssetsList: AssetsList,
			onTheAssetsObjectPage: AssetsObjectPage
        },
        async: true
    });

    return runner;
});

