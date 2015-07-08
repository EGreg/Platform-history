/**
 * Class representing badge rows.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Badge' rows in the 'Awards' database
 * @namespace Awards
 * @class Badge
 * @extends Base.Awards.Badge
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Badge (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	Awards_Badge.constructors.apply(this, arguments);

}

Q.mixin(Awards_Badge, Q.require('Base/Awards/Badge'));

module.exports = Awards_Badge;