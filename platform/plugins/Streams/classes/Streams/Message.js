/**
 * Class representing message rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');
var Base_Streams_Message = Q.require('Base/Streams/Message');

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

	// Run constructors of mixed in objects
	this.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Streams_Message, Base_Streams_Message);

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Streams_Message.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

/**
 * Assigns unique id to 'name' field if not set
 * @method beforeSave
 * @param {array} value
 *	The row beind saved
 * @param {function} callback
 */
Streams_Message.prototype.beforeSave = function (value, callback)
{
	value = Base_Streams_Message.prototype.beforeSave.call(this, value);
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
 * 'email.handlebars' or 'mobile.handlebars' depending on delivery
 * @method deliver
 * @param {Streams.Stream} stream
 * @param {object} delivery
 * @param {function} callback
 *	Callback reports errors and response from mail delivery system
 */
Streams_Message.prototype.deliver = function(stream, delivery, callback) {
	var fields = {
		stream: stream.toArray(),
		message: this.toArray()
	};
	var subject = Q.Config.get(
		['Streams', 'types', stream.fields.type, 'messages', this.fields.type, 'subject'], 
		Q.Config.get(
			['Streams', 'defaults', 'messages', this.fields.type, 'subject'],
			Q.Config.get(
				['Streams', 'defaults', 'messages', '', 'subject'],
				'Please set config "Streams"/"defaults"/"messages"/""/"subject"'
			)
		)
	);
	var viewPath;

	if (delivery.email) {
		viewPath = Q.Handlebars.template(this.fields.type+'/email.handlebars') ? this.fields.type : 'Streams/message';
		Q.Utils.sendEmail(delivery.email, subject, viewPath+'/email.handlebars', fields, {html: true}, callback);
	} else {
		viewPath = Q.Handlebars.template(this.fields.type+'/mobile.handlebars') ? this.fields.type : 'Streams/message';
		Q.Utils.sendSMS(delivery.mobile, viewPath+'/mobile.handlebars', fields, {}, callback);
	}
};

module.exports = Streams_Message;