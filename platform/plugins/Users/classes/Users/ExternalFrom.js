/**
 * Class representing external_from rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'ExternalFrom' rows in the 'Users' database
 * <br/>stores external ids for users
 * @namespace Users
 * @class ExternalFrom
 * @extends Base.Users.ExternalFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_ExternalFrom (fields) {

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

Q.mixin(Users_ExternalFrom, Q.require('Base/Users/ExternalFrom'));

module.exports = Users_ExternalFrom;