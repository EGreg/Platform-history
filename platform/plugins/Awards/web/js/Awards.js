Q.Awards = Q.plugins.Awards = {};

(function(Q, Awards, Streams, $) {

	Awards.onCredits = new Q.Event();
	
	Streams.onMessage('Awards/credits', "").set(function (data) {
		
		var amount = 199;

		Awards.amount = amount;
		Awards.onCredits.handle(amount);
		
	});

	Q.page('', function () {

		$('.Awards_auth').on(Q.Pointer.click, function () {
			Q.Dialogs.push({
				title: '',
				content:
				'<iframe ' +
				'name="authnet" ' +
				'src="" ' +
				'width="480" ' +
				'height="640" ' +
				'frameborder="0" ' +
				'scrolling="no" ' +
				'id="authnet" ' +
				'class="authnet" ' +
				'></iframe>'
			});
		});

		$('.Awards_confirm').on(Q.Pointer.click, function () {
			Q.Dialogs.push({
				title: 'Subscription confirmation',
				content:
				'<input type="checkbox" name="agree" id="Subscription_agree" value="yes">' +
				'<label for="Subscription_agree">Confirm subscription terms</label>' +
 				'<button class="Q_button Awards_pay">Confirm subscription</button>'
			});
		});

	});

	Q.Tool.define({
		"Awards/pay"           : "plugins/Awards/js/tools/pay.js"
	});

//	Streams.onMessage('Awards/credits', "").set(function (data) {
//		Awards.amount = amount;
//		Awards.onCredits.handle(amount);
//	});

	Q.onReady.set(function () {
		Awards.onCredits.handle(Q.plugins.Awards.credits.amount);
	}, 'Awards');

})(Q, Q.plugins.Awards, Q.plugins.Streams, jQuery);