/**
 * Class representing sent rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Sent' rows in the 'Streams' database
 * <br/>stored primarily on byUserId's fm server
 * @namespace Streams
 * @class Sent
 * @extends Base.Streams.Sent
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Sent (fields) {

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

Q.mixin(Streams_Sent, Q.require('Base/Streams/Sent'));

module.exports = Streams_Sent;