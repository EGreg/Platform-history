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
	}

};

Places.loadGoogleMaps.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp&'
	+ 'callback=Q.Places.loaded';
Places.loadGoogleMaps.waitingCallbacks = [];
Places.loaded = function () {
	Q.handle(Places.loadGoogleMaps.waitingCallbacks);
};

Q.text.Places = {


};

Q.Tool.define({
	"Places/location": "plugins/Places/js/tools/location.js"
});

})(Q, jQuery, window);