/**
 * Class representing oAuth rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'OAuth' rows in the 'Users' database
 * <br/>for implementing oauth provider
 * @namespace Users
 * @class OAuth
 * @extends Base.Users.OAuth
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_OAuth (fields) {

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

Q.mixin(Users_OAuth, Q.require('Base/Users/OAuth'));

module.exports = Users_OAuth;