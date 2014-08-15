(function (Q, $, window, document, undefined) {

/**
 * Plugin clickfocus
 * @method clickfocus
 * @param {Object} [options] options for clickfocus plugin
 * @param {Number} [options.timeout] timeout , timeout (milliseconds) parameter for focusing iteration
 * @default 100
*/

Q.Tool.jQuery("Q/clickfocus",

function (o) {
	if (this.is('input, textarea, select')) {
		this.click();
	}
	this.focus();
	setTimeout(function () {
		this.focus();
	}, o.timeout);
	return this;
},

{
	timeout: 100
}

);

})(Q, jQuery, window, document);