/**
 * Class representing zipcode rows.
 *
 * This description should be revised and expanded.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');
var Zipcode = Q.require('Base/Awards/Zipcode');

/**
 * Class representing 'Zipcode' rows in the 'Awards' database
 * @namespace Awards
 * @class Zipcode
 * @extends Base.Awards.Zipcode
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Zipcode (fields) {

	// Run mixed-in constructors
	Awards_Zipcode.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Zipcode.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Awards_Zipcode, Zipcode);

/*
 * Add any public methods here by assigning them to Awards_Zipcode.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Awards_Zipcode.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Awards_Zipcode;