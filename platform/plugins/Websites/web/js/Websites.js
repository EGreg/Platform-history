/**
 * Websites plugin's front end code
 *
 * @module Websites
 * @class Websites
 */
Q.Websites = Q.plugins.Websites = {
	
};

(function($, Websites) {

Q.Tool.define("Websites/bio", function (fields) {

});

Q.Streams.define("Websites/bio", function (fields) {
	this.fields.bio = fields.bio;
});

Q.onInit.set(function () {
	Q.Streams.Stream.onFieldChanged(Q.plugins.Websites.userId, "Websites/title", "content").set(function (fields, k) {
		document.title = fields[k];
	}, "Websites");
}, "Websites");

Q.Tool.define({
	"Websites/seo": "plugins/Websites/js/tools/seo.js"
});

Q.page('', function () {
	Q.addScript("plugins/Q/js/sha1.js", function () {
		var streamName = "Websites/seo/"+CryptoJS.SHA1(Q.info.uriString);
		Q.Streams.Stream.onUpdated(Q.plugins.Websites.userId, streamName, "title").set(function (attributes, k) {
			document.title = attributes[k];
		}, "Websites");
	});
	return function () {
		if (!window.CryptoJS) return;
		var streamName = "Websites/seo/"+CryptoJS.SHA1(Q.info.uriString);
		Q.Streams.Stream.onUpdated(Q.plugins.Websites.userId, streamName, "title").remove("Websites");
	}
}, 'Websites');

})(window.jQuery, Q.plugins.Websites);