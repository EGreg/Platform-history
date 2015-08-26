/**
 * Class representing session rows.
 *
 * This description should be revised and expanded.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');
var Session = Q.require('Base/Awards/Session');

/**
 * Class representing 'Session' rows in the 'Awards' database
 * @namespace Awards
 * @class Session
 * @extends Base.Awards.Session
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Session (fields) {

	// Run mixed-in constructors
	Awards_Session.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Session.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Awards_Session, Session);

/*
 * Add any public methods here by assigning them to Awards_Session.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Awards_Session.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Awards_Session;