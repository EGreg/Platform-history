(function (Q) {

if (!window.Q) {
	document.getElementsByTagName('body')[0].innerHTML = "<h1>Please run SmartApp/scripts/Q/install.php --all</h1>";
	throw new Q.Error("Q is not defined -- try running SmartApp/scripts/Q/install.php --all");
}

var SmartApp = (function ($) {

	var SmartApp = {
		// add module functions and events here
		userMenuHandler: new Q.Event()
	};
	
	// example stream
	Q.Streams.define("SmartApp/cool", "js/models/SmartApp/cool.js");
	
	// example tool
	Q.Tool.define("SmartApp/cool", "js/tools/SmartApp/cool.js");
	
	// you can also define tools inline
	Q.Tool.define("SmartApp/listing", function () { });

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
		$('.SmartApp-page-link[data-page]').on(Q.Pointer.fastclick, true, function () {
			var $this = $(this);
			Q.loadUrl($this.attr('data-page'), {
				quiet: true,
				onActivate: function () {
					Q.Layout.flipColumns('column2');
				},
				slotNames: 'column2, title',
				loadExtras: true
			});
			$this.siblings().removeClass('selected');
			$this.addClass('selected');
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
		var url = $(li).attr('data-action');
		if (url.substr(0, Q.info.baseUrl.length) !== Q.info.baseUrl) {
			return window.open(url, "_blank");
		}
		Q.handle(url, {quiet: true});
	}
	Q.Layout.listingHandler.set(loadPage);
	SmartApp.userMenuHandler.set(loadPage);
	
	return SmartApp;
})(jQuery);

})(Q);