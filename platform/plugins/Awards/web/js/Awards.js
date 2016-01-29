Q.Awards = Q.plugins.Awards = {};

(function(Q, Awards, Streams, $) {

	Awards.onCredits = new Q.Event();
	
	Streams.onMessage('Awards/credits', "").set(function (data) {
		
		var amount = 199;

		Awards.amount = amount;
		Awards.onCredits.handle(amount);
		
	});

	Q.page('', function () {

		$('.Awards_pay').on(Q.Pointer.click, function () {

			var fields = '';
			Q.req(
				'Awards/pay', // uri - string of the form
				'results', // slotNames
				// callback
				function () {
				},
				// A hash of options, to be passed to Q.request
				{
					method: 'post',
					fields: fields
				}
			);

			console.log('button clicked');
			return false;
		});

	});

//	Streams.onMessage('Awards/credits', "").set(function (data) {
//		Awards.amount = amount;
//		Awards.onCredits.handle(amount);
//	});

	Q.onReady.set(function () {
		Awards.onCredits.handle(Q.plugins.Awards.credits.amount);
	}, 'Awards');

})(Q, Q.plugins.Awards, Q.plugins.Streams, jQuery);