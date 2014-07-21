(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Renders a default interface for composing and publishing stream content
 * @class Streams publishing
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.label]
 *   @default ""
 *   @param {String} [options.placeholder]
 *   @default "Leave a message for {user}"
 *   @param {String} [options.field_type]
 *   @default "textarea"
 *   @param {Event} [options.submit]
 *   @default null
 *   @param {Object} [options.login_options]
 *    @param {String} [options.login_options.activate]
 *    @default  "activate"
 */
Q.Tool.define("Streams/publisher", function (options) {

	var input;
	switch (options.field_type) {
		case 'textarea':
			input = $('<textarea name="foo" />');
			break;
		case 'text':
			input = $('<input type="text"> ')
			break;
	}
	$("<textarea />")
	
},

{
	"label": "",
	"placeholder": "Leave a message for {user}",
	"field_type": "textarea",
	"submit": null,
	"login_options": {
		"activate": "activate"
	}
});

})(Q, jQuery);