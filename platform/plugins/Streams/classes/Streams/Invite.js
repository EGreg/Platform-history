/**
 * Class representing invite rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Invite' rows in the 'Streams' database
 * <br/>stores invites to the stream on user id server
 * @namespace Streams
 * @class Invite
 * @extends Base.Streams.Invite
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Invite (fields) {

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

Q.mixin(Streams_Invite, Q.require('Base/Streams/Invite'));

module.exports = Streams_Invite;