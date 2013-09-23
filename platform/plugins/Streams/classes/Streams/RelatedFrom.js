/**
 * Class representing related_from rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'RelatedFrom' rows in the 'Streams' database
 * <br/>This table is owned by publisher of the member stream
 * @namespace Streams
 * @class RelatedFrom
 * @extends Base.Streams.RelatedFrom
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_RelatedFrom (fields) {

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

Q.mixin(Streams_RelatedFrom, Q.require('Base/Streams/RelatedFrom'));

module.exports = Streams_RelatedFrom;