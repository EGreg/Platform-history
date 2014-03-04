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

})(window.jQuery, Q.plugins.Websites);