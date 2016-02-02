Q.Awards = Q.plugins.Awards = {

	paymentDialog: function (callback, options) {
		var html = '<iframe ' +
			'name="Awards_authnet" ' +
			'src="" ' +
			'width="480" ' +
			'height="640" ' +
			'frameborder="0" ' +
			'scrolling="no" ' +
			'class="authnet" ' +
		'></iframe>';
		Q.Dialogs.push(Q.extend({
			title: 'Set Payment Information',
			content: html
		}, options));

		function subscribe() {
			var fields = '';
			Q.req(
				'Awards/subscription', // uri - string of the form
				'payment', // slotNames
				// callback
				function () {
				},
				// A hash of options, to be passed to Q.request
				{
					method: 'post',
					fields: fields
				});
			Q.Dialogs.pop();
		};

		$('.Awards_confirm').on(Q.Pointer.click, function () {
			Q.Dialogs.push({
				title: 'Subscription confirmation',
				content:
				'<div class="Awards_pay_confirm">' +
				'<button class="Q_button Awards_pay">Confirm subscription</button></br></br>' +
				'<input type="checkbox" name="agree" id="Subscription_agree" value="yes">' +
				'<label for="Subscription_agree">Confirm subscription terms</label></br>' +
				'</div>'
			});
			$('.Awards_pay').on(Q.Pointer.click, function () {

				if ($('#Subscription_agree:checkbox').is(':checked')) {
					subscribe();
				} else {
					var r = confirm('Confirm subscription terms');
					if (r == true) {
						subscribe();
					}
				};
			});
		});
	}
};

(function(Q, Awards, Streams, $) {

	Awards.onCredits = new Q.Event();
	
	Streams.onMessage('Awards/credits', "").set(function (data) {
		
		var amount = 199;

		Awards.amount = amount;
		Awards.onCredits.handle(amount);

	});

	Q.Tool.define({
		"Awards/subscription"           : "plugins/Awards/js/tools/subscription.js"
	});

//	Streams.onMessage('Awards/credits', "").set(function (data) {
//		Awards.amount = amount;
//		Awards.onCredits.handle(amount);
//	});

	Q.onReady.set(function () {
		Awards.onCredits.handle(Q.plugins.Awards.credits.amount);
	}, 'Awards');

})(Q, Q.plugins.Awards, Q.plugins.Streams, jQuery);