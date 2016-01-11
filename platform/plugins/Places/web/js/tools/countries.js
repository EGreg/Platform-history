(function (Q, $, window, document, undefined) {

var Places = Q.Places;

/**
 * Places Tools
 * @module Places-tools
 */

/**
 * Displays a way to select one or more countries
 * @class Places countries
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {String} [options.flags="plugins/Places/img/squareflags"] the path for the flags, or set to false to omit the flag
 * @param {String} [options.countryCode='US'] the initial country to select in the list
 * @param {Array} [options.firstCountryCodes='US','GB'] array of country codes to place first in the list
 * @param {Q.Tool} [options.globe] a reference to a "Places/globe" tool to synchronize
 * @param {Q.Event} [options.onReady] this event occurs when the countries selector is ready
 * @param {Q.Event} [options.onChange=new Q.Event()] Occurs when the value has changed
 */
Q.Tool.define("Places/countries", function _Places_countries(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	state.countryCode = state.countryCode.toUpperCase();
	
	var position = $te.css('position');
	$te.css('position', position === 'static' ? 'relative' : position);
	
	Places.loadCountries(function () {
		if (state.flags) {
			tool.$flag = $('<img class="Places_countries_flag" />').attr({
				src: Q.url(state.flags+'/'+state.countryCode+'.png')
			}).appendTo(tool.element);
			$te.addClass('Places_countries_flags');
		}
		var $select = $('<select class="Places_countries_select" />');
		var codes = {};
		Q.each(state.firstCountryCodes, function (i, countryCode) {
			$select.append(
				$('<option />')
				.attr('value', countryCode)
				.text(Places.countriesByCode[countryCode][0])
			);
			codes[countryCode] = true;
		});
		Q.each(Places.countries, function (i, item) {
			if (codes[item[1]]) return;
			var option = $('<option />')
				.attr('value', item[1])
				.text(item[0])[0];
			tool.options[ item[1] ]
			$select.append(option);
		});
		$select.appendTo(tool.element);
		tool.$select = $select;
		$select.on('change', tool, function () {
			var countryCode = $select.val();
			if (state.globe) {
				state.globe.rotateToCountry(countryCode);
			}
			Q.handle(state.onChange, tool, [countryCode]);
			if (tool.$flag) {
				tool.$flag.attr({
					src: Q.url(state.flags+'/'+countryCode+'.png')
				});
			}
		});
		$select.val(state.countryCode);
		$select.trigger('change');
		Q.handle(state.onReady, tool);
	});
	
	tool.Q.onStateChanged('countryCode').set(function () {
		var globe = this.state.globe;
		var countryCode = this.state.countryCode;
		this.$select.val(countryCode);
		this.$select.trigger('change');
		if (globe) {
			globe.rotateToCountry(countryCode);
		}
	}, "Places/countries");
	
	if (state.globe) {
		this.globe(state.globe);
	}
},

{ // default options here
	flags: "plugins/Places/img/squareflags",
	countryCode: 'US',
	firstCountryCodes: ['US','GB'],
	globe: null,
	onChange: new Q.Event(),
	onReady: new Q.Event()
},

{ // methods go here
	
	/**
	 * @setCountry
	 * @param {String} countryCode
	 */
	setCountry: Q.preventRecursion('Places/countries', function (countryCode) {
		this.state.countryCode = countryCode;
		this.stateChanged('countryCode');
	}),
	
	/**
	 * @method globe
	 * @param {Q.Tool|false} globeTool A reference to a "Places/globe" tool, or false to unlink
	 */
	globe: function (globeTool) {
		if (!globeTool) {
			this.state.globe = null;
			return;
		}
		this.state.globe = globeTool;
		var tool = this;
		globeTool.state.beforeRotateToCountry.set(function (countryCode) {
			tool.setCountry(countryCode);
		}, true);
	},
	
	/**
	 * @method filter which countries are shown
	 * @param {Array} countries An array of country codes to show from the whole set
	 */
	filter: function (countries) {
		var tool = this;
		this.state.onReady.add(function () {
			tool.$select.find('option').hide();
			Q.each(countries, function (i, countryCode) {
				tool.$select.find('option[value='+countryCode+']').show();
			});
		}, tool);
	}
	
});

})(Q, jQuery, window, document);