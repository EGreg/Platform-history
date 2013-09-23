/**
 * Class representing identify rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Identify' rows in the 'Users' database
 * <br/>Mapping table for finding users based on various info
 * @namespace Users
 * @class Identify
 * @extends Base.Users.Identify
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Identify (fields) {

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

Q.mixin(Users_Identify, Q.require('Base/Users/Identify'));

module.exports = Users_Identify;