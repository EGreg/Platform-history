/**
 * Class representing nearby rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Nearby' rows in the 'Places' database
 * @namespace Places
 * @class Nearby
 * @extends Base.Places.Nearby
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Nearby (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	this.constructors.call(this, arguments);

}

Q.mixin(Places_Nearby, Q.require('Base/Places/Nearby'));

module.exports = Places_Nearby;