Q.Awards = Q.plugins.Awards = {};

(function($, Awards, Streams) {

	Awards.onCredits = new Q.Event();
	
	Streams.onMessage('Awards/credits', "").set(function (data) {
		
		Awards.amount = amount;
		Awards.onCredits.handle(amount);
		
	});
	
	Q.onReady.set(function () {
		Awards.onCredits.handle(Q.plugins.Awards.credits.amount);
	}, 'Awards');

})(jQuery, Q.plugins.Awards, Q.plugins.Streams);