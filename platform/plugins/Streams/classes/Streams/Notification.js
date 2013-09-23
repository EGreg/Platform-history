/**
 * Class representing notification rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Notification' rows in the 'Streams' database
 * <br/>stored primarily on for_userId's fm server
 * @namespace Streams
 * @class Notification
 * @extends Base.Streams.Notification
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Notification (fields) {

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

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/**
	 * Method is called before setting the field
	 * @method beforeSet_insertedTime
	 * @param {string} value
	 * @return {Date|Db.Expression}
	 *	If 'value' is not Db.Expression the current date is returned
	 */
	this.beforeSet_insertedTime = function (value) {
		if (!value) return value;
			if (value instanceof Db.Expression) return value;
			value = new Date(value);
			return value;
	};

	/* * * */
}

Q.mixin(Streams_Notification, Q.require('Base/Streams/Notification'));

module.exports = Streams_Notification;