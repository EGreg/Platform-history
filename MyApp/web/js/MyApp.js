var MyApp = Q.plugins.MyApp = (function ($) {
	
	// Here is some example code to get you started
	
	var MyApp = {
		userContextual: function (item) {
			var action = $(item).attr('data-action');
			if (MyApp.actions[action]) {
				Q.handle(MyApp.actions[action], MyApp, [item]);
			}
		},
		actions: {
			logout: Q.Users.logout
		}
	};
	
	Q.onReady.set(function () {
		
		$('.MyApp_login').click(function () {
			Q.Users.login();
			return false;
		});
		
		var avatar = $('#dashboard .Users_avatar_tool');
		if (avatar.length) {
			Q.Contextual.add(avatar, $('#dashboard_user_contextual'));	
		}
		
	});
	
	Q.page("MyApp/welcome", function () {
		// when loading
		return function () {
			// unloading;
		};
	});
	
	return MyApp;
	
})(jQuery);