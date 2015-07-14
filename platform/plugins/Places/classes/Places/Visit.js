/**
 * Class representing visit rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var Visit = Q.require('Base/Places/Visit');

/**
 * Class representing 'Visit' rows in the 'Places' database
 * @namespace Places
 * @class Visit
 * @extends Base.Places.Visit
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Visit (fields) {

	// Run mixed-in constructors
	Places_Visit.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Visit.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Places_Visit, Visit);

/*
 * Add any public methods here by assigning them to Places_Visit.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_Visit.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_Visit;