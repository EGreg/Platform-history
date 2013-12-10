/**
 * Class representing message rows.
 *
 * This description should be revised and expanded.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Message' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's fm server
 * @namespace Streams
 * @class Message
 * @extends Base.Streams.Message
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Message (fields) {

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
	 * Assigns unique id to 'name' field if not set
	 * @method beforeSave
	 * @param {array} value
	 *	The row beind saved
	 * @param {function} callback
	 */
	this.beforeSave = function (value, callback)
	{
		value = this.__proto__.beforeSave.call(this, value);
		if (!this._retrieved) {
			var self = this;
			(new Streams.Stream({
				publisherId: value['publisherId'],
				name: value['streamName']
			})).retrieve('*', true, true).lock().resume(function(error, stream) {
				if (error) callback(error);
				else if (!stream || !stream.length) callback(null, null); // no stream - no message!!!
				else {
					stream = stream[0];
					self.fields.ordinal = ++stream.fields.messageCount;
					value['ordinal'] = self.fields.ordinal;
					self.afterSaveExecute = function(query, error, lastId) {
						this.afterSaveExecute = null;
						stream.save(false, true, function(error) {
							if (error) {
								stream.rollback(function() {
									query.resume(error);
								});
							} else query.resume(null, lastId);
						});
						return true;
					};
					callback(null, value);
				}
			});
		}
	};

	/**
	 * Delivers the message posted to stream according to particular
	 * delivery method (see: Streams_Rule.deliver). Message template is taken from views/{message.type} folder -
	 * 'email.mustache' or 'mobile.mustache' depending on delivery
	 * @method deliver
	 * @param {Streams.Stream} stream
	 * @param {object} delivery
	 * @param {function} callback
	 *	Callback reports errors and response from mail delivery system
	 */
	this.deliver = function(stream, delivery, callback) {
		var fields = {
			stream: stream.toArray(),
			message: this.toArray()
		};
		var subject = Q.Config.get(['Streams', 'types', stream.fields.type, 'invite', 'subject'], 'Message "{{& message.type}}" to "{{& stream.title}}"');
		var viewPath;

debugger;
		if (delivery.email) {
			viewPath = Q.Mustache.template(this.fields.type+'/email.mustache') ? this.fields.type : 'Streams/message';
			Q.Utils.sendMessage(delivery.email, subject, viewPath+'/email.mustache', fields, {html: true}, callback);
		} else {
			viewPath = Q.Mustache.template(this.fields.type+'/mobile.mustache') ? this.fields.type : 'Streams/message';
			Q.Utils.sendSMS(delivery.mobile, viewPath+'/mobile.mustache', fields, {}, callback);
		}
	};

	/* * * */
}

Q.mixin(Streams_Message, Q.require('Base/Streams/Message'));

module.exports = Streams_Message;