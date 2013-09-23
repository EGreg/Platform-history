/**
 * Class representing rule rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Rule' rows in the 'Streams' database
 * <br/>rules applied on the user's side for notifications coming in
 * @namespace Streams
 * @class Rule
 * @extends Base.Streams.Rule
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Rule (fields) {

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

	var Streams = Q.require('Streams');
	/**
	 * Calculate ordinal for the rule
	 * @method beforeSave
	 * @param {mixed} value
	 * @param {function} callback
	 */
	this.beforeSave = function (value, callback) {
		if (!this._retrieved) {
			var self = this;
			var q = Streams.Rule.SELECT("MAX(ordinal) max").where({
				ofUserId: this.fields.ofUserId,
				publisherId: this.fields.publisherId,
				streamName: this.fields.streamName
			});
			delete q.className;
			q.execute(function(err, rows) {
				if (err) return callback.call(self, err);
				value['ordinal'] = self.fields.ordinal = rows[0] && rows[0].fields && rows[0].fields.max !== null ? rows[0].fields.max + 1 : 0;
				callback.call(self, null, self.__proto__.beforeSave.call(self, value));
			});
		}
	};

	/* * * */
}

Q.mixin(Streams_Rule, Q.require('Base/Streams/Rule'));

module.exports = Streams_Rule;