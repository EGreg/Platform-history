/**
 * Class representing bio rows.
 *
 * This description should be revised and expanded.
 *
 * @module Websites
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Bio' rows in the 'Websites' database
 * <br/>Websites/bio stream type extension
 * @namespace Websites
 * @class Bio
 * @extends Base.Websites.Bio
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Websites_Bio (fields) {

	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	this.setUp = function () {
		// put any code here
	};

	// Run constructors of mixed in objects
	this.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Bio.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Websites_Bio, Q.require('Base/Websites/Bio'));

/*
 * Add any public methods here by assigning them to Websites_Bio.prototype
 */

module.exports = Websites_Bio;