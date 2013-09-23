/**
 * Class representing external_to rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'ExternalTo' rows in the 'Users' database
 * <br/>stores external ids for users
 * @namespace Users
 * @class ExternalTo
 * @extends Base.Users.ExternalTo
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalTo (fields) {

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

Q.mixin(Users_ExternalTo, Q.require('Base/Users/ExternalTo'));

module.exports = Users_ExternalTo;