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
 * @param {String} [options.countryCode='US'] the initial country to select in the list
 * @param {Array} [options.firstCountryCodes='US','GB'] array of country codes to place first in the list
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
		$select.val(state.countryCode);
		tool.$select = $select;
	});
},

{ // default options here
	countryCode: 'US',
	firstCountryCodes: ['US','GB']
},

{ // methods go here
	

	
});

})(Q, jQuery, window, document);