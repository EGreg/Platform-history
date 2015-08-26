/**
 * Class representing share rows.
 *
 * This description should be revised and expanded.
 *
 * @module Places
 */
var Q = require('Q');
var Db = Q.require('Db');
var Share = Q.require('Base/Places/Share');

/**
 * Class representing 'Share' rows in the 'Places' database
 * @namespace Places
 * @class Share
 * @extends Base.Places.Share
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Places_Share (fields) {

	// Run mixed-in constructors
	Places_Share.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Share.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Places_Share, Share);

/*
 * Add any public methods here by assigning them to Places_Share.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Places_Share.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Places_Share;