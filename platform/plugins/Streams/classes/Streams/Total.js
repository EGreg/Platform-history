/**
 * Class representing total rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Total' rows in the 'Streams' database
 * <br/>Used to count the number of messages of a certain type
 * @namespace Streams
 * @class Total
 * @extends Base.Streams.Total
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Total (fields) {

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

}

Q.mixin(Streams_Total, Q.require('Base/Streams/Total'));

module.exports = Streams_Total;