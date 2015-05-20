/**
 * Websites plugin's front end code
 *
 * @module Websites
 * @class Websites
 */

(function(Q, $) {
	
var Websites = Q.Websites = Q.plugins.Websites = {

};

/**
 * Websites Tools
 * @module Websites-tools
 * @main
 */

/**
 * Display a user's bio on the website, which the user can edit
 * @class Websites bio
 * @constructor
 */

Q.Tool.define("Websites/bio", function (fields) {
	var gittool = this.$('.Users_getintouch_tool');
	var form = this.$('form.Websites_getintouch');
	function _refresh() {
		var checkbox = $('input[type=checkbox]', form);
		var opacity = (!checkbox.length || checkbox.attr('checked')) ? 1 : 0.5;
		gittool.css('opacity', opacity);
	}
	this.state['.Q_form_tool'] = {
		onSuccess: _refresh
	};
	_refresh();
	$('button', form).hide();
	$('input[type=checkbox]', form).click(function () { $(this).submit() });
});

Q.Streams.define("Websites/bio", function (fields) {
	this.fields.bio = fields.bio;
});

Q.onInit.set(function () {
	Q.Streams.Stream.onFieldChanged(Q.plugins.Websites.userId, "Websites/title", "content").set(function (fields, k) {
		document.title = fields[k];
	}, "Websites");
}, "Websites");

/**
 * Interface for editing some common meta fields for search engine optimization
 * @class Websites seo
 * @constructor
 */
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
		Q.Streams.Stream.onUpdated(
			Q.plugins.Websites.userId, streamName, "title"
		).remove("Websites");
	}
}, 'Websites');

})(Q, jQuery);