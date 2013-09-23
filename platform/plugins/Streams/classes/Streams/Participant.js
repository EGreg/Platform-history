/**
 * Class representing participant rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Participant' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's fm server
 * @namespace Streams
 * @class Participant
 * @extends Base.Streams.Participant
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Participant (fields) {

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

	this.subscribe = function(callback) {
		_subscribe(true, this.fields.userId, this.fields.publisherId, this.fields.streamName, callback);
	};

	this.unsubscribe = function(callback) {
		_subscribe(false, this.fields.userId, this.fields.publisherId, this.fields.streamName, callback);
	};
}

var Streams = Q.require('Streams');

function _subscribe(what, userId, publisherId, streamName, callback) {
	Streams.Participant.UPDATE().where({
		userId: userId,
		publisherId: publisherId,
		streamName: streamName
	}).set({
		subscribed: what ? 'yes' : 'no'
	}).execute(callback);
}

Streams_Participant.subscribe = function (userId, publisherId, streamName, callback) {
	_subscribe(true, userId, publisherId, streamName, callback);
};
Streams_Participant.unsubscribe = function (userId, publisherId, streamName, callback) {
	_subscribe(false, userId, publisherId, streamName, callback);
	/* * * */
}

Q.mixin(Streams_Participant, Q.require('Base/Streams/Participant'));

module.exports = Streams_Participant;
