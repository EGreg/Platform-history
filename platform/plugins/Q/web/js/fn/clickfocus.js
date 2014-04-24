(function (Q, $, window, document, undefined) {

Q.Tool.jQuery("Q/clickfocus",

function (o) {
	if (this.is('input')) {
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