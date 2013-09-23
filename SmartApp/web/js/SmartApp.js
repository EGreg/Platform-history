var SmartApp = Q.plugins.SmartApp = (function ($) {

	var SmartApp = {
		// add module functions and events here
		userMenuHandler: new Q.Event()
	};
	
	// example stream
	Q.Streams.define("SmartApp/cool", "js/models/SmartApp/cool.js");
	
	// example tool
	Q.Tool.define("SmartApp/cool", "js/tools/SmartApp/cool.js");

	// tell Q.handle to load pages using AJAX
	Q.handle.options.loadUsingAjax = true;

	// call the Q function to handle pages loading/unloading:
	Q.page('', function () {
		// code to run after any page has activated
		$('.SmartApp-login').on(Q.Pointer.click, function () {
			Q.Users.login({
				onSuccess: {
					"Users.login": function () {
						Q.handle(location);
					}
				}
			});
		}).click(function () {
			return false;
		});
		
		// apply Q/clickable effect
		var o = null
		if (Q.info.isTouchscreen) {
			o = {
				press: { size: 1.2 },
				release: { size: 2 }
			};
			Q.Animation.fps = 20;
		}
		$('.clickable').plugin('Q/clickable', o);
		
		// load pages when clicking .SmartApp-page-link
		$('.SmartApp-page-link[data-page]').on(Q.Pointer.click, function () {
			Q.loadUrl($(this).attr('data-page'), {
				quiet: true,
				onActivate: function () {
					Q.Layout.flipColumns('column2');
				}
			});
		});
		$('.clickable').plugin('Q/clickable');
		
		return function () {
			// code to run before unloading any page
			$('.clickable').plugin('Q/clickable', 'destroy');
		}
	});
	
	// check out js/welcome.js for loading page-specific javascript
	
	// handle clicking on dashboard menu items
	function loadPage (li) {
		Q.handle($(li).attr('data-action'), {quiet: true});
	}
	Q.Layout.listingHandler.set(loadPage);
	SmartApp.userMenuHandler.set(loadPage);
	
	return SmartApp;
})(jQuery);