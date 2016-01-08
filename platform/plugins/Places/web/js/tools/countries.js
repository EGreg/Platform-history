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
 * @param {String} [options.flag=true] whether to show a flag next to the select element
 * @param {String} [options.countryCode='US'] the initial country to select in the list
 * @param {Array} [options.firstCountryCodes='US','GB'] array of country codes to place first in the list
 * @param {Q.Tool} [options.globe] a reference to a "Places/globe" tool to synchronize
 * @param {Q.Event} [options.onChange=new Q.Event()] Occurs when the value has changed
 */
Q.Tool.define("Places/countries", function _Places_countries(options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	
	Places.loadCountries(function () {
		var $select = $('<select />');
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
			$select.append(
				$('<option />').attr('value', item[1]).text(item[0])
			);
		});
		$select.appendTo(tool.element);
		tool.$select = $select;
		$select.on('change', tool, function () {
			if (state.globe) {
				state.globe.rotateToCountry($select.val());
			}
			Q.handle(state.onChange, tool, [$select.val()]);
		});
		$select.val(state.countryCode);
		$select.trigger('change');
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
	flag: true,
	countryCode: 'US',
	firstCountryCodes: ['US','GB'],
	globe: null,
	onChange: new Q.Event()
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
	}
	
});

})(Q, jQuery, window, document);