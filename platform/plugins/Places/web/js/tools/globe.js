(function (Q, $, window, document, undefined) {

var Places = Q.Places;

/**
 * Places Tools
 * @module Places-tools
 */

/**
 * Displays a globe, using planetary.js
 * @class Places globe
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {String} [options.countryCode='US'] the initial country to rotate to and highlight
 * @param {Array} [options.highlight={US:true}] pairs of {countryCode: color},
 *   if color is true then state.colors.highlight is used.
 *   This is modified by the default handler for beforeRotateToCountry added by this tool.
 * @param {Number} [options.radius] The radius of the globe, defauls to fill the canvas.
 * @param {Object} [options.colors] colors for the planet
 * @param {String} [options.colors.oceans='#2a357d'] the color of the ocean
 * @param {String} [options.colors.land='#389631'] the color of the land
 * @param {String} [options.colors.borders='#008000'] the color of the borders
 * @param {Q.Event} [options.onSelect] this event occurs when the user has selected a country or a place on the globe. It is passed (latitude, longitude, countryCode)
 * @param {Q.Event} [options.beforeRotate] this event occurs right before the globe is about to rotate to some location
 * @param {Q.Event} [options.beforeRotateToCountry] this event occurs right before the globe is about to rotate to some country
 */
Q.Tool.define("Places/globe", function _Places_location(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	var p = Q.pipe(['scripts', 'countries'], function _proceed() {
		tool.$canvas = $('<canvas />').attr({
			width: $te.width(),
			height: $te.height()
		}).appendTo($te)
		.on(Q.Pointer.fastclick, tool, function(event) {
			var ll = tool.getCoordinates(event);
			tool.geocoder.geocode(
				{'location': { lat: ll.latitude, lng: ll.longitude }},
				function(results, status) {
					if (status === google.maps.GeocoderStatus.OK && results[0]) {
						var countryCode = _getComponent(results[0], 'country');
						tool.rotateToCountry(countryCode);
					} else {
						tool.rotateTo(ll.latitude, ll.longitude);
					}
					Q.handle(state.onSelect, [ll.latitude, ll.longitude, countryCode]);
				}
			);
		});
		
		if (!state.radius) {
			state.radius = Math.min(tool.$canvas.width(), tool.$canvas.height()) / 2;
		}
		
		var globe = tool.globe = planetaryjs.planet();
		
		// The `earth` plugin draws the oceans and the land; it's actually
		// a combination of several separate built-in plugins.
		//
		// Note that we're loading a special TopoJSON file
		// (world-110m-withlakes.json) so we can render lakes.
		globe.loadPlugin(planetaryjs.plugins.earth({
			topojson: { file:   Q.url('plugins/Places/data/world-110m-withlakes.json') },
			oceans:   { fill:   state.colors.oceans },
			land:	 { fill:   state.colors.land },
			borders:  { stroke: state.colors.borders }
		}));
		
		// Load our custom `lakes` plugin to draw lakes
		globe.loadPlugin(_lakes({
			fill: state.colors.oceans
		}));
		
		// Load our custom `lakes` plugin to highlight countries
		globe.loadPlugin(_highlight({
			tool: tool
		}));
		
		// The zoom and drag plugins enable
		// manipulating the globe with the mouse.
		globe.loadPlugin(planetaryjs.plugins.zoom({
			scaleExtent: [state.radius, 20 * state.radius]
		}));
		globe.loadPlugin(planetaryjs.plugins.drag({}));
		
		// Set up the globe's initial scale, offset, and rotation.
		globe.projection.scale(state.radius).translate(
			[state.radius, state.radius]
		).rotate([0, -10, 0]);
		
		// Every few hundred milliseconds, we'll draw another random ping.
		var colors = ['red', 'yellow', 'white', 'orange', 'green', 'cyan', 'pink'];

		// The `pings` plugin draws animated pings on the globe.
		globe.loadPlugin(planetaryjs.plugins.pings());
		setInterval(function() {
			var lat = Math.random() * 170 - 85;
			var lng = Math.random() * 360 - 180;
			var color = colors[Math.floor(Math.random() * colors.length)];
			globe.plugins.pings.add(lng, lat, { color: color, ttl: 2000, angle: Math.random() * 10 });
		}, 500);
		
		tool.refresh();
	});
	
	Q.addScript([
		'plugins/Places/js/lib/d3.js',
		'plugins/Places/js/lib/topojson.js',
		'plugins/Places/js/lib/planetaryjs.js'
	], p.fill('scripts'));
	
	Places.loadCountries(p.fill('countries'));
},

{ // default options here
	countryCode: 'US',
	colors: {
		oceans: '#2a357d',
		land: '#389631',
		borders: '#008000',
		highlight: '#ff0000'
	},
	highlight: {'US':true},
	radius: null,
	beforeRotate: new Q.Event(),
	beforeRotateToCountry: new Q.Event(function (countryCode) {
		var h = this.state.highlight = {};
		h[countryCode] = true;
	}, "Place/globe")
},

{ // methods go here
	
	refresh: function Places_globe_refresh () {
		var tool = this;
		var state = tool.state;
		var $te = $(tool.element);
		Places.loadGoogleMaps(function () {
			tool.geocoder = new google.maps.Geocoder;
			tool.globe.draw(tool.$canvas[0]);
			var waitForTopoJsonLoad = setInterval(function () {
				if (tool.globe.plugins.topojson) {
					tool.rotateToCountry(state.countryCode);
					clearInterval(waitForTopoJsonLoad);
				}
			}, 50);
		});
	},
	
	/**
	 * Rotate the globe to center around a location
	 * @param {Number} latitude
	 * @param {Number} longitude
	 * @param {Number} duration number of milliseconds for the animation to take
	 */
	rotateTo: function Places_globe_rotateTo (latitude, longitude, duration, callback) {
		var tool = this;
		duration = duration || 1000;
		Q.handle(tool.state.beforeRotate, tool, [latitude, longitude, duration]);
		d3.transition()
			.duration(duration)
			.tween('rotate', function() {
				var projection = tool.globe.projection;
				var r = d3.interpolate(projection.rotate(), [-longitude, -latitude]);
				return function(t) {
					projection.rotate(r(t));
					callback && callback.apply(this, arguments);
				};
			})
			.transition();
	},
		
	/**
	 * Rotate the globe to center around a country
	 * @param {String} countryCode which is described in ISO-3166-1 alpha-2 code
	 * @param {Number} duration number of milliseconds for the animation to take
	 */
	rotateToCountry: function Places_globe_rotateToCountry (countryCode, duration) {
		var tool = this;
		var feature = _getFeature(tool.globe, countryCode);
		if (!feature) {
			return;
		}
		var c = tool.$canvas[0].getContext("2d");
		var projection = tool.globe.projection;
		var path = d3.geo.path().projection(projection).context(c);
		// var tj = tool.globe.plugins.topojson;
		// var land = topojson.feature(tj.world, tj.world.objects.land);
		// var borders = topojson.mesh(
		// 	tj.world, tj.world.objects.countries,
		// 	function(a, b) { return a !== b; }
		// );
		var p = d3.geo.centroid(feature);
		Q.handle(tool.state.beforeRotateToCountry, tool, [countryCode, p[1], p[0], duration]);
		var transition = tool.rotateTo(p[1], p[0], duration, function () {
			c.fillStyle = tool.state.colors.highlight;
			c.beginPath();
			path(feature);
			c.fill();
		});
	},
	
	/**
	 * Obtain latitude and longitude from a pointer event
	 * @param {Event} event some pointer event
	 * @return {Object} object with properties "latitude", "longitude"
	 */
	getCoordinates: function Places_globe_getCoordinates(event) {
		var tool = this;
		var offset = $(event.target).offset();
		var x = Q.Pointer.getX(event) - offset.left;
		var y = Q.Pointer.getY(event) - offset.top;
		var coordinates = tool.globe.projection.invert([x, y]);
		return {
			latitude: coordinates[1],
			longitude: coordinates[0]
		}
	}
	
});

/**
 * Check argument for NULL value or change all the spaces to empty symbol
 * @param text
 * @returns {boolean}
 */
function _isNullOrWhitespace(text) {
	return text == null ? true : text.replace(/\s/gi, '').length < 1;
}
/**
 * Looking for a desired type in the results and getting component using typeName
 * @param {Object} results
 * @param {String} desiredType, for example 'country'
 * @param {?String} typeName, for example 'long_name'. If it doesn't set it is equal to 'short_name'
 * @returns {*}
 */
function _getComponent(result, desiredType, typeName) {
	typeName = typeName || 'short_name';
	var address_components = result.address_components;
	for (var i = 0; i < address_components.length; i++) {
		var shortname = address_components[i].short_name;
		var type = address_components[i].types;
		if (type.indexOf(desiredType) != -1) {
			var c = address_components[i][typeName];
			return (c == null || !c.trim().length) ? shortname : c;
		}
	}
}

// This plugin takes lake data from the special
// TopoJSON we're loading and draws them on the map.
function _lakes(options) {
	options = options || {};
	var lakes = null;
	return function(planet) {
		planet.onInit(function() {
			/**
			 * We can access the data loaded from the TopoJSON plugin on its namespace on `planet.plugins`.
			 * We're loading a custom TopoJSON file with an object called "ne_110m_lakes".
			 */
			var world = planet.plugins.topojson.world;
			lakes = topojson.feature(world, world.objects.ne_110m_lakes);
		});

		planet.onDraw(function() {
			planet.withSavedContext(function(context) {
				context.beginPath();
				planet.path.context(context)(lakes);
				context.fillStyle = options.fill || 'black';
				context.fill();
			});
		});
	};
};

// This plugin highlights countries
function _highlight(options) {
	options = options || {};
	var tool = options.tool;
	return function(planet) {
		planet.onDraw(function() {
			planet.withSavedContext(function(context) {
				Q.each(tool.state.highlight, function (countryCode) {
					var feature = _getFeature(tool.globe, countryCode);
					if (!feature) {
						return;
					}
					var c = tool.$canvas[0].getContext("2d");
					var projection = tool.globe.projection;
					var path = d3.geo.path().projection(projection).context(c);
					var color = tool.state.highlight[countryCode];
					color = typeof color === 'string' ? color : tool.state.colors.highlight;
					var c = tool.$canvas[0].getContext("2d");
					c.fillStyle = color;
					c.beginPath();
					path(feature);
					c.fill();
				});
			});
		});
	};
};

// Gets the country's feature, if any
function _getFeature(planet, countryCode) {
	var countryName, lookup, tj, countries, features, feature;
	var parts = Places.countriesByCode[countryCode];
	if (!parts) {
		return parts;
	}
	countryName = parts[0];
	lookup = Places.countryLookupByCode[countryCode];
	if (tj = planet.plugins.topojson) {
		countries = tj.world.objects.countries;
		features = topojson.feature(tj.world, countries).features;
		feature = null;
		Q.each(features, function () {
			if (this.id == lookup) {
				feature = this;
			}
		});
	}
	return feature;
}

})(Q, jQuery, window, document);