(function (Q, $, window, document, undefined) {

/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Inplace text editor tool to edit the content or attribute of a stream
 * @class Streams location
 * @constructor
 * @param {Object} [options] used to pass options
 */

Q.Tool.define("Places/location", function (options) {
	var tool = this;
	var state = tool.state;
	if (!Q.Users.loggedInUser) {
		console.warn("Don't render Places/location when user is not logged in");
		return;
	}
	var publisherId = Q.Users.loggedInUser.id;
	var streamName = "Places/user/location";
	
	$(tool.element).addClass('Places_location_checking');
	
	var pipe = Q.pipe(['info', 'show'], function (params) {
		_showMap.apply(this, params.info);
	});
	
	Q.Streams.Stream
	.onRefresh(publisherId, streamName)
	.set(function () {
		var miles = this.get('miles');
		var latitude = this.get('latitude');
		var longitude = this.get('longitude');
		if (miles) {
			tool.$('.Places_location_miles').val(miles);
		};
		pipe.fill('info')(latitude, longitude, miles);
		state.stream = this; // in case it was missing before
	});
	
	Q.Streams.retainWith(this)
	.get(publisherId, streamName, function (err) {
		if (!err) {
			var stream = state.stream = this;
			var miles = stream.get('miles');
			var latitude = stream.get('latitude');
			var longitude = stream.get('longitude');
			if (miles) {
				tool.$('.Places_location_miles').val(miles);
			}
		}
		if (!latitude || !longitude || !miles) {
			$(tool.element)
				.removeClass('Places_location_obtained')
				.removeClass('Places_location_checking')
				.addClass('Places_location_obtaining');
		}
		setTimeout(function () {
			pipe.fill('show')();
		}, state.map.delay);
		
		if (stream && Q.getter.usingCached) {
			stream.refresh();
		}
	});
	
	tool.$('.Places_location_miles').on('change', function () {
		_submit();
	});
	
	tool.$('.Places_location_set, .Places_location_update_button')
	.on(Q.Pointer.click, function () {
		var $this = $(this);
		$this.addClass('Places_obtaining');
		navigator.geolocation.getCurrentPosition(
		function (geo) {
			var fields = Q.extend({
				unsubscribe: true,
				subscribe: true,
				miles: $('select[name=miles]').val(),
				timezone: (new Date()).getTimezoneOffset() / 60
			}, geo.coords);
			Q.req("Places/geolocation", [], 
			function (err, data) {
				Q.Streams.Stream.refresh(
					publisherId, streamName, null,
					{ messages: 1, evenIfNotRetained: true}
				);
				$this.removeClass('Places_obtaining').hide(500);
			}, {method: 'post', fields: fields});
		}, function () {
			var zipcode = window.prompt("Please enter your zipcode:", "");
			if (zipcode) {
				_submit(zipcode);
			}
			$this.removeClass('Places_obtaining');
		}, {
			maximumAge: 300000
		});
	});
	
	function _submit(zipcode) {
		Q.req('Places/geolocation', ['attributes'], function (err, data) {
			var msg = Q.firstErrorMessage(err, data && data.errors);
			if (msg) {
				return alert(msg);
			}
			Q.Streams.Stream.refresh(
				publisherId, streamName, null,
				{ messages: 1, evenIfNotRetained: true }
			);
		}, {
			method: 'post',
			fields: {
				zipcode: zipcode || '',
				miles: tool.$('.Places_location_miles').val(),
				timezone: (new Date()).getTimezoneOffset() / 60
			}
		});
	}
	
	var previous = {};
	function _showMap(latitude, longitude, miles, callback) {

		if (latitude == undefined
		|| longitude == undefined
		|| !miles) {
			return;
		}
		if (latitude == previous.latitude
		&& longitude == previous.longitude
		&& miles == previous.miles) {
			return;
		}
		previous = {
			latitude: latitude,
			longitude: longitude,
			miles: miles
		};

		Q.Places.loadGoogleMaps(function () {
			$(tool.element)
				.removeClass('Places_location_obtaining')
				.removeClass('Places_location_checking')
				.addClass('Places_location_obtained');
			setTimeout(function () {
				tool.$('.Places_location_map_container, .Places_location_update')
				.slideDown(300, _showLocationAndCircle);
			}, 0);
		});

		function _showLocationAndCircle() {
			var element = tool.$('.Places_location_map')[0];
	        var map = new google.maps.Map(element, {
				center: new google.maps.LatLng(latitude, longitude),
				zoom: 12 - Math.floor(Math.log(miles) / Math.log(2)),
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				draggable: false,
				panControl: false,
				disableDoubleClickZoom: true,
				zoomControl: false,
				scaleControl: false,
				disableDefaultUI: true,
				scrollwheel: false,
				navigationControl: false
	        });
			
			// Create marker 
			var marker = new google.maps.Marker({
			  map: map,
			  position: new google.maps.LatLng(latitude, longitude),
			  title: 'My location'
			});

			// Add circle overlay and bind to marker
			var circle = new google.maps.Circle({
			  map: map,
			  radius: miles*1609.34,
			  fillColor: '#0000AA'
			});
			circle.bindTo('center', marker, 'position');
			
			callback && callback();
		}
	}
},

{ // default options here
	map: {
		delay: 300
	}
},

{ // methods go here
	
});

})(Q, jQuery, window, document);