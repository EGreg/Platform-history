/**
 * Class representing message rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');
var Base_Streams_Message = Q.require('Base/Streams/Message');

Q.makeEventEmitter(Streams_Message);

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
	Streams_Message.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Streams_Message, Base_Streams_Message);

Streams_Message.defined = {};

Streams_Message.construct = function Streams_Message_construct(fields) {
	if (Q.isEmpty(fields)) {
		Q.handle(callback, this, ["Streams.Message constructor: fields are missing"]);
		return false;
	}
	if (fields.fields) {
		fields = fields.fields;
	}
	var type = Q.normalize(fields.type);
	var MC = Streams_Message.defined[type];
	if (!MC) {
		MC = Streams_Message.defined[type] = function MessageConstructor(fields) {
			MessageConstructor.constructors.apply(this, arguments);
			// Default constructor. Copy any additional fields.
			if (!fields) return;
			for (var k in fields) {
				this.fields[k] = Q.copy(fields[k]);
			}
		};
		Q.mixin(MC, Streams_Message);
	}
	return new MC(fields);
};

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
 * Call this function to set a constructor for a message type
 * @static
 * @method define
 * @param {String} type The type of the message, e.g. "Streams/chat/message"
 * @param {String|Function} ctor Your message's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Streams_Message.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Streams_Message.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Streams.Message.define requires ctor to be a function");
	}
	function CustomMessageConstructor() {
		CustomMessageConstructor.constructors.apply(this, arguments);
		ctor.apply(this, arguments);
	}
	Q.mixin(CustomMessageConstructor, Streams_Message);
	Q.extend(CustomMessageConstructor.prototype, methods);	
	return Streams_Message.defined[type] = CustomMessageConstructor;
};

var Mp = Streams_Message.prototype;

/**
 * Get all the instructions from a message.
 * 
 * @method getAll
 */
Mp.getAll = function _Message_prototype_getAll () {
	try {
		return JSON.parse(this.fields.instructions);
	} catch (e) {
		return undefined;
	}
};

/**
 * Get the value of an instruction in the message
 * 
 * @method get
 * @param {String} instructionName
 */
Mp.get = function _Message_prototype_get (instructionName) {
	var instr = this.getAll();
	return instr[instructionName];
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
		})).retrieve('*', true, true)
		.lock()
		.resume(function(error, stream) {
			if (error) callback(error);
			else if (!stream || !stream.length) {
				callback(null, null); // no stream - no message!!!
			} else {
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
 * @param {object} delivery can contain "email" or "mobile" for now
 * @param {function} callback
 *	Callback reports errors and response from mail delivery system
 */
Streams_Message.prototype.deliver = function(stream, delivery, avatar, callback) {
	var fields = {
		app: Q.app,
		stream: stream,
		message: this,
		instructions: this.getAll(),
		avatar: avatar,
		config: Q.Config.getAll()
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
	var t = delivery.email ? 'email' : (delivery.mobile ? 'mobile' : '');
	if (!t) {
		return callback("Streams.Message: delivery has to be email or mobile for now");
	}
	var viewPath = Q.Handlebars.template(this.fields.type+'/'+t+'.handlebars')
		? this.fields.type
		: 'Streams/message';
	
	// Give the app an opportunity to modify the fields or anything else
	var o = {
		fields: fields,
		subject: subject,
		delivery: delivery,
		stream: stream,
		avatar: avatar,
		callback: callback,
		viewPath: viewPath+'/'+t+'.handlebars'
	};
	Streams_Message.emit('deliver/before', o);
	
	var viewPath;
	if (o.delivery.email) {
		Q.Utils.sendEmail(o.delivery.email, o.subject, o.viewPath, o.fields, {html: true}, callback);
	} else if (o.delivery.mobile) {
		Q.Utils.sendSMS(o.delivery.mobile, o.viewPath, o.fields, {}, callback);
	}
};

module.exports = Streams_Message;