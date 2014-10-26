/**
 * Places plugin's front end code
 *
 * @module Places
 * @class Places
 */

(function(Q, $, w) {

var Places = Q.Places = Q.plugins.Places = {

	loadGoogleMaps: function (callback) {
		if (w.google && w.google.maps) {
			callback();
		} else {
			Places.loadGoogleMaps.waitingCallbacks.push(callback);
			Q.addScript(Places.loadGoogleMaps.src);
		}
	},
	
	getUserLocationStream: function (callback) {
		var userId = Q.getObject('Users.loggedInUser.id', Q);
		if (!userId) {
			var err = new Q.Error("Places.userLocationStream: not logged in");
			return callback(err);
		}
		Q.Streams.get(userId, "Places/user/location", function (err) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return callback(err);
			}
			callback.call(this, err, this);
		});
	}

};

Places.loadGoogleMaps.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&'
	+ 'callback=Q.Places.loaded';
Places.loadGoogleMaps.waitingCallbacks = [];
Places.loaded = function () {
	Q.handle(Places.loadGoogleMaps.waitingCallbacks);
};

Q.Streams.Message.shouldRefreshStream("Places/location/updated", true);

Q.text.Places = {


};

Q.Tool.define({
	"Places/location": "plugins/Places/js/tools/location.js"
});

})(Q, jQuery, window);