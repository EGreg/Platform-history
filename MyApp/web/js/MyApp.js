if (!window.Q) { // You can remove this part after you've run install.php
	document.getElementsByTagName('body')[0].innerHTML = "<h1>Please run MyApp/scripts/Q/install.php --all</h1>";
	throw "Q is not defined";
}

var MyApp = (function (Q, $) {
	
	// Here is some example code to get you started
	
	var MyApp = {
		userContextual: function (item) {
			var action = $(item).attr('data-action');
			if (MyApp.actions[action]) {
				Q.handle(MyApp.actions[action], MyApp, [item]);
			}
		},
		actions: {
			logout: Q.Users.logout,
			setIdentifier: Q.Users.setIdentifier,
		}
	};
	
	Q.page('', function () {
		
		$('.MyApp_login').on(Q.Pointer.click, function () {
			Q.Users.login();
			return false;
		});
		
		Q.addScript("plugins/Q/js/QTools.js", function () {
			var avatar = $('#dashboard .Users_avatar_tool');
			if (avatar.length) {
				Q.Contextual.add(avatar, $('#dashboard_user_contextual'));	
			}
		});
		
	});
	
	Q.page("MyApp/welcome", function () {
		// when loading
		return function () {
			// unloading;
		};
	});
	
	// example stream
	Q.Streams.define("MyApp/cool", "js/models/MyApp/cool.js");
	
	// example tool
	Q.Tool.define("MyApp/cool", "js/tools/MyApp/cool.js");

	// tell Q.handle to load pages using AJAX
	Q.handle.options.loadUsingAjax = true;
	
	return MyApp;
	
})(Q, jQuery);