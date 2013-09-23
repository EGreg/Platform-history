/**
 * Class representing related_to rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'RelatedTo' rows in the 'Streams' database
 * <br/>This table is owned by publisher of the aggregator stream
 * @namespace Streams
 * @class RelatedTo
 * @extends Base.Streams.RelatedTo
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_RelatedTo (fields) {

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

Q.mixin(Streams_RelatedTo, Q.require('Base/Streams/RelatedTo'));

module.exports = Streams_RelatedTo;