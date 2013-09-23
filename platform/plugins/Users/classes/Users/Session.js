/**
 * Class representing session rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Session' rows in the 'Users' database
 * <br/>This table is used to replicate PHP sessions information for
 * @namespace Users
 * @class Session
 * @extends Base.Users.Session
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Session (fields) {

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

Q.mixin(Users_Session, Q.require('Base/Users/Session'));

module.exports = Users_Session;