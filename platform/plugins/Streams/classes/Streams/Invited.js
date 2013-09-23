/**
 * Class representing invited rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Invited' rows in the 'Streams' database
 * <br/>stores tokens where user is invited on user id server
 * @namespace Streams
 * @class Invited
 * @extends Base.Streams.Invited
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Invited (fields) {

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

Q.mixin(Streams_Invited, Q.require('Base/Streams/Invited'));

module.exports = Streams_Invited;