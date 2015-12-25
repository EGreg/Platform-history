/**
 * Class representing subscription rows.
 *
 * This description should be revised and expanded.
 *
 * @module Awards
 */
var Q = require('Q');
var Db = Q.require('Db');
var Subscription = Q.require('Base/Awards/Subscription');

/**
 * Class representing 'Subscription' rows in the 'Awards' database
 * @namespace Awards
 * @class Subscription
 * @extends Base.Awards.Subscription
 * @constructor
 * @param {Object} fields The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Awards_Subscription (fields) {

	// Run mixed-in constructors
	Awards_Subscription.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Subscription.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Awards_Subscription, Subscription);

/*
 * Add any public methods here by assigning them to Awards_Subscription.prototype
 */

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Awards_Subscription.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Awards_Subscription;