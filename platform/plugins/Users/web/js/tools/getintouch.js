(function ($) {

/**
 * @param options Object
 *  The options to pass to the tool. They can include:
 *   "emailSubject" => The default subject of the email, if any
 *   "emailAddress" => The email address.
 *   "emailBody" => The default body of the email, if any
 *   "mobileNumber" => The mobile number.
 */
Q.Tool.define("Users/getintouch", function(options) {

	function deobfuscate(str) {
		var l = str.length, result = '';
		for (var i=0; i<l; ++i) {
			result += String.fromCharCode(str.charCodeAt(i)+1);
		}
		return result;
	}
	$('#'+this.prefix+'email').on(Q.Pointer.fastclick, this, function () {
		var url = '', qp = [];
		url = "mailto:"+deobfuscate(options.emailAddress);
		if (options.emailSubject) {
			qp.push('subject='+encodeURIComponent(deobfuscate(options.emailSubject)));
		}
		if (options.emailBody) {
			qp.push('body='+encodeURIComponent(deobfuscate(options.emailBody)));
		}
		if (qp.length) {
			url += '?'+qp.join('&');
		}
		window.location = url;
	});
	$('#'+this.prefix+'sms').on(Q.Pointer.fastclick, this, function () {
		window.location = "sms:"+deobfuscate(options.mobileNumber);
	});
	$('#'+this.prefix+'call').on(Q.Pointer.fastclick, this, function () {
		window.location = "tel:"+deobfuscate(options.mobileNumber);
	});
});

})(jQuery);