/**
 * Class representing publisher rows.
 *
 * This description should be revised and expanded.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');
var Publisher = Q.require('Base/Awards/Publisher');

/**
 * Class representing 'Publisher' rows in the 'Awards' database
 * @namespace Awards
 * @class Publisher
 * @extends Base.Awards.Publisher
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Publisher (fields) {

	// Run mixed-in constructors
	Awards_Publisher.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Publisher.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Awards_Publisher, Publisher);

/*
 * Add any public methods here by assigning them to Awards_Publisher.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Awards_Publisher.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Awards_Publisher;