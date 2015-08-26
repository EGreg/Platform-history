/**
 * Class representing hostname_session rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var HostnameSession = Q.require('Base/Places/HostnameSession');

/**
 * Class representing 'HostnameSession' rows in the 'Places' database
 * <br/>records whether a session has visited a domain
 * @namespace Places
 * @class HostnameSession
 * @extends Base.Places.HostnameSession
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_HostnameSession (fields) {

	// Run mixed-in constructors
	Places_HostnameSession.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'HostnameSession.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Places_HostnameSession, HostnameSession);

/*
 * Add any public methods here by assigning them to Places_HostnameSession.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_HostnameSession.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_HostnameSession;