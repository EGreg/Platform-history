/**
 * Streams module
 *
 * @module Streams
 * @class Streams
 */
Q.Streams = Q.plugins.Streams = {

};

(function($, Streams) {

var priv = {};

Q.text.Streams = {

	access: {

	},

	basic: {
		prompt: null, //"Fill our your basic information to complete your signup.",
		title: "Basic Information"
	},

	login: {

		fullname: "Let friends recognize you:",
		picTooltip: "You can change this picture later"

	},

	chat: {
		noMessages: ""
	}

};

/**
 * Read levels
 * @property READ_LEVEL
 * @type object
 */
Streams.READ_LEVEL = {
	'none':			0,		// can't see the stream
	'see':			10,		// can see icon and title
	'content':		20,		// can preview stream and its content
	'participants':	30,		// can see participants in the stream
	'messages':		40		// can play stream in a player
};

/**
 * Write levels
 * @property WRITE_LEVEL
 * @type object
 */
Streams.WRITE_LEVEL = {
	'none':			0,		// cannot affect stream or participants list
	'join':			10,		// can become a participant, chat, and leave
	'vote':         13,		// can vote for a relation message posted to the stream
	'postPending':	15,		// can post messages, but manager must approve
	'post':			20,		// can post messages which appear immediately
	'relate':       23,		// can post messages relating other streams to this one
	'suggest':	25,		// can post messages requesting edits of stream
	'edit':			30,		// can post messages to edit stream content immediately
	'closePending':	35,		// can post a message requesting to close the stream
	'close':		40		// don't delete, just prevent any new changes to stream
							// however, joining and leaving is still ok
};

/**
 * Admin levels
 * @property ADMIN_LEVEL
 * @type object
 */
Streams.ADMIN_LEVEL = {
	'none':	 		0,		// cannot do anything related to admin / users
	'tell':	 		10,		// can post on your stream about participating
	'invite':		20,		// able to create invitations for others, granting access
	'manage':		30,		// can approve posts and give people any adminLevel < 30
	'own':	 		40		// can give people any adminLevel <= 40
};

Streams.constructors = {};

/**
 * Call this function to define a stream type
 * @param {String} type The type of the stream, e.g. "Streams/smalltext"
 * @param {String|Function} ctor Your tool's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Streams.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Q.Tool.define(t, type[t]);
		}
		return;
	}
	type = Q.normalize(type);
	if (typeof ctor === 'string') {
		if (typeof Q.Streams.constructors[type] !== 'function') {
			return Q.Streams.constructors[type] = ctor;
		}
		return ctor;
	}
	if (typeof ctor !== 'function') {
		throw "Q.Streams.define requires ctor to be a string or a function";
	}
	Q.extend(ctor.prototype, methods);	
	return Q.Streams.constructors[type] = ctor;
};

Streams.iconUrl = function(icon, size) {
	if (!icon) {
		console.warn("Streams.iconUrl: icon is empty");
		return '';
	}
	if (!size) {
		size = '40';
	}
	size = (String(size).indexOf('.') >= 0) ? size : size+'.png';
	return icon.isUrl()
		? icon + '/' + size
		: Q.url('plugins/Streams/img/icons/'+icon+'/'+size);
};

var _socket = null,
    _messageHandlers = {},
    _constructHandlers = {},
    _refreshHandlers = {},
    _streamMessageHandlers = {},
    _streamFieldChangedHandlers = {},
    _streamUpdatedHandlers = {},
    _streamRelatedFromHandlers = {},
    _streamRelatedToHandlers = {},
    _streamUnrelatedFromHandlers = {},
    _streamUnrelatedToHandlers = {},
    _streamUpdatedRelateFromHandlers = {},
    _streamUpdatedRelateToHandlers = {},
    _streamConstructHandlers = {},
    _streamRefreshHandlers = {},
    _retain = undefined,
	_retainedByKey = {},
	_retainedByStream = {},
	_retainedStreams = {};

Streams.key = function (publisherId, streamName) {
	return publisherId + "\t" + streamName;
};

/**
 * Returns Q.Event that occurs on message post event coming from socket.io
 * @method Streams.onMessage
 * @param type {String} type of the stream to which a message is posted
 * @param messageType {String} type of the message
 * @return {Q.Event}
 */
Streams.onMessage = Q.Event.factory(_messageHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs after a stream is constructed on the client side
 * @method Streams.onConstruct
 * @param type {String} type of the stream being constructed on the client side
 * @return {Q.Event}
 */
Streams.onConstruct = Q.Event.factory(_constructHandlers, [""]);

/**
 * Returns Q.Event that occurs after fresh stream info has arrived on the client side
 * @method Streams.onRefresh
 * @param type {String} type of the stream being constructed on the client side
 * @return {Q.Event}
 */
Streams.onRefresh = Q.Event.factory(_refreshHandlers, [""]);

/**
 * Returns Q.Event that occurs on some socket event coming from socket.io
 * @method onEvent
 */
Streams.onEvent = function (name) {
	return Q.Socket.onEvent('Streams', null, name);
};

/**
 * Event occurs if native app is activated from background by click on native notification
 * @property onActivate
 * @param data {mixed} any user data sent along with notification
 */
Streams.onActivate = new Q.Event();

/**
 * Connects or reconnects sockets for all participating streams
 */
function _connectSockets(refresh) {
	if (!Q.Users.loggedInUser) {
		return false;
	}
	Streams.getParticipating(function (err, participating) {
		Q.each(participating, function (i, p) {
			Q.Socket.connect('Streams', Q.nodeUrl({
				publisherId: p.publisherId,
				streamName: p.streamName
			}));
		});
	});
	if (refresh) {
		Streams.refresh();
	}
}

function _disconnectSockets() {
	// disconnects all Streams sockets which have been connected
	// note that this also affects other plugins that might be listening on the sockets
	// maybe we should have another thing, I don't know, but for now it's ok
	Q.Socket.disconnectAll();
}

Streams.socketSessionId = function (publisherId, streamName) {
	var s = Q.Socket.get('Streams', Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	return s ? s.namespace.socket.id : null;
};

/**
 * A convenience method to get the URL of the streams-related action
 * @method register
 * @static
 * @param {String} publisherId
 *	The name of the publisher
 * @param {String} streamName
 *	The name of the stream
 * @param {String} what
 *	Defaults to 'stream'. Can also be 'message', 'relation', etc.
 * @return {String} 
 *	The corresponding URL
 */
Streams.actionUrl = function(publisherId, streamName, what)
{
	if (!what) {
 		what = 'stream';
	}
	switch (what) {
		case 'stream':
		case 'message':
		case 'relation':
			return Q.action("Streams/"+what+"?publisherId="+encodeURIComponent(publisherId)+"&name="+encodeURIComponent(streamName));
	}
	return null;
};

Q.Tool.define({
	"Users/avatar": "plugins/Streams/js/tools/avatar.js", // override for Users/avatar tool
	"Streams/chat": "plugins/Streams/js/tools/chat.js",
	"Streams/comments": "plugins/Streams/js/tools/comments.js",
	"Streams/photoSelector": "plugins/Streams/js/tools/photoSelector.js",
	"Streams/userChooser": "plugins/Streams/js/tools/userChooser.js",
	"Streams/participant": "plugins/Streams/js/tools/participant.js",
	"Streams/publisher": "plugins/Streams/js/tools/publisher.js",
	"Streams/basic": "plugins/Streams/js/tools/basic.js",
	"Streams/access": "plugins/Streams/js/tools/access.js",
	"Streams/related": "plugins/Streams/js/tools/related.js",
	"Streams/inplace": "plugins/Streams/js/tools/inplace.js",
	"Streams/smalltext/preview": "plugins/Streams/js/tools/smalltext/preview.js",
	"Streams/image/preview": "plugins/Streams/js/tools/image/preview.js"
});

/**
 * Streams batch getter.
 * @method get
 * @param publisherId {string}
 *  Publisher's user id
 * @param name {string}
 *	Name of the stream published by this publisher
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param extra {object}
 *  Optional object which can include the following keys:
 *	"participants": limit1,
 *	"messages": limit2
 *	"messageType": optional String specifying the type of messages to fetch
 *	"$Module/$fieldname": any other fields you would like can be added, to be passed to your hooks on the back end
 */
Streams.get = Q.getter(function (publisherId, streamName, callback, extra) {
	var url = Q.action('Streams/stream?')+
		Q.serializeFields({"publisherId": publisherId, "name": streamName});
	var slotNames = ['stream'];
	if (extra) {
		if (extra.participants) {
			url += '&'+$.param({"participants": extra.participants});
			slotNames.push('participants');
		}
		if (extra.messages) {
			url += '&'+$.param({messages: extra.messages});
			slotNames.push('messages');
		}
	}
	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'stream', slotNames, publisherId, streamName, function Streams_get_response_handler (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			Stream.onError.handle(msg, err, data);
			return callback && callback.call(this, msg);
		}
		if (!data.stream) {
			var msg = "Streams.get: data.stream is missing";
			Stream.onError.handle(msg, err, data);
			return callback && callback.call(this, msg);
		}
		_constructStream(
			data.stream,
			{ 
				messages: data.messages, 
				participants: data.participants 
			}, 
			function Streams_get_construct_handler(err, stream) {
				if (Q.firstErrorMessage(err)) {
					Stream.onError.handle(msg, err, data);
				}
				return callback && callback.call(stream, err, stream);
			},
			true
		);
	}, extra);
	_retain = undefined;
}, {cache: Q.Cache.document("Streams.get", 100), throttle: 'Streams.get'});

Streams.batchFunction = function Streams_batchFunction(baseUrl) {
	return Q.batcher.factory(Streams.batchFunction.functions, baseUrl, "/action.php/Streams/batch", "batch", "batch");
};
Streams.batchFunction.functions = {};

/**
 * Create a new stream
 * @method create
 * @param fields {Object}
 *  Should contain at least the publisherId and type of the stream
 * @param callback {function}
 *	if there were errors, first parameter is the error message
 *  otherwise, first parameter is null and second parameter is a Streams.Stream object
 * @param related {Object}
 *	Optional information to add a relation from the newly created stream to another one. Can include:
 *  "publisherId": the id of whoever is publishing the related stream
 *  "streamName": the name of the related stream
 *  "type": the type of the relation
 */
Streams.create = function (fields, callback, related) {
	var slotNames = ['stream'];
	if (fields.icon) {
		slotNames.push('icon');
	}
	if (related) {
		fields['Q.Streams.related.publisherId'] = related.publisherId || related.publisherId;
		fields['Q.Streams.related.streamName'] = related.streamName || related.streamName || related.name;
		fields['Q.Streams.related.type'] = related.type;
	}
	var baseUrl = Q.baseUrl({
		publisherId: fields.publisherId,
		streamName: "" // NOTE: the request is routed to wherever the "" stream would have been hosted
	});
	var _r = _retain;
	Q.req('Streams/stream', slotNames, function Stream_create_response_handler(err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		_constructStream(data.slots.stream, {}, function Stream_create_construct_handler (err, stream) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return callback && callback.call(stream, msg, stream, data.slots.icon);
			}
			if (_r) {
				stream.retain(_r);
			}
			return callback && callback.call(stream, null, stream, data.slots.icon);
		});
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * This function is similar to _constructTool in Q.js
 * That one is to create "controllers" on the front end,
 * and this one is to create "models" on the front end.
 * They have very similar conventions.
 * @param fields {Object} Provide any stream fields here. Requires at least the "type" of the stream.
 * @param extra {Object} Can include "messages" and "participants"
 * @param callback {Function} The function to call when all constructors and event handlers have executed
 *  The first parameter is an error, in case something went wrong. The second one is the stream object.
 * @param handleRefreshEvents {Boolean} whether to handle the stream refresh events
 */
function _constructStream (fields, extra, callback, handleRefreshEvents) {

	var type = Q.normalize(fields.type);
	var streamFunc = Streams.constructors[type];
	if (!streamFunc) {
		streamFunc = Streams.constructors[type] = function () {};
	}
	if (typeof streamFunc === 'function') {
		return _doConstruct();
	} else if (typeof streamFunc === 'string') {
		Q.addScript(streamFunc, function () {
			streamFunc = Q.Tool.constructors[streamName] || Q.Tool.constructors[streamName2];
			if (typeof streamFunc !== 'function') {
				throw new Error("_constructStream: streamFunc cannot be " + typeof(streamFunc));
			}
			return _doConstruct();
		});
		return true;
	} else if (typeof streamFunc !== 'undefined') {
		throw new Error("_constructStream: streamFunc cannot be " + typeof(streamFunc));
	}
	function _doConstruct() {
		if (!streamFunc.streamConstructor) {
			streamFunc.streamConstructor = function Streams_Stream(fields) {
				// run any constructors
				this.constructors(fields);

				var f = this.fields;

				// update the Streams.get cache
				Streams.get.cache.each([f.publisherId, f.name], function (k, v) {
					Streams.get.cache.remove(k);
				});
				if (f.publisherId && f.name) {
					Streams.get.cache.set(
						[f.publisherId, f.name],
						0, this, [null, this]
					);
				}

				// call any onConstruct handlers
				Q.handle(_constructHandlers[f.type], this, []);
				Q.handle(_constructHandlers[''], this, []);
				if (f.publisherId && f.name) {
					Q.handle(Q.getObject([f.publisherId, f.name], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject([f.publisherId, ''], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject(['', f.name], _streamConstructHandlers), this, []);
					Q.handle(Q.getObject(['', ''], _streamConstructHandlers), this, []);
				}
			};
			Q.mixin(streamFunc.streamConstructor, Streams.Stream, streamFunc);
		}
		var stream = new streamFunc.streamConstructor(fields);
		
		if (extra.messages) {
			Q.each(extra.messages, function (ordinal, message) {
				if (Q.typeOf(message) !== 'Q.Streams.Message') {
					message = new Message(message);
				}
				Message.get.cache.set(
					[fields.publisherId, fields.name, message.ordinal],
					0, message, [null, message]
				);
			});
		}
		if (extra.participants) {
			Q.each(extra.participants, function (userId, participant) {
				if (Q.typeOf(participant) !== 'Q.Streams.Participant') {
					participant = new Participant(participant);
				}
				Participant.get.cache.set(
					[fields.publisherId, fields.name, participant.userId],
					0, participant, [null, participant]
				);
			});
		}
		
		if (handleRefreshEvents) {
			var f = stream.fields;
			Stream.onRefresh(f.type).handle(stream);
			Stream.onRefresh('').handle(stream);
			if (f.publisherId && f.name) {
				Stream.onRefresh(f.publisherId, f.name).handle(stream);
				Stream.onRefresh(f.publisherId, '').handle(stream);
				Stream.onRefresh('', f.name).handle(stream);
				Stream.onRefresh('', '').handle(stream);
			}
		}
		Q.handle(callback, stream, [null, stream]);
		return stream;
	}
}


/**
* Returns streams for current user
* @method getParticipating
*/
Streams.getParticipating = Q.getter(function(callback) {
	if(!callback) return;
	Q.req('Streams/participating', 'participating', function (err, data) {
		callback(err, data && data.slots && data.slots.participating);
	});
	_retain = undefined;
}, {cache: Q.Cache.document("Streams.getParticipating", 10)});

/**
 * Refreshes all the streams the logged-in user is participating in
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * @param {Function} callback optional callback
 * @param {Object} options A hash of options, including:
 *  "messages": If set to true, then besides just reloading the stream, attempt to catch up on the latest messages
 * @return {boolean} whether the refresh occurred
 */
Streams.refresh = function (callback, options) {
	if (!Q.Users.loggedInUser || !Q.isOnline()) {
		Q.handle(callback, this, [false]);
		return false;
	}
	var now = Date.now();
	if (now - Streams.refresh.lastTime < Streams.refresh.options.minSeconds * 1000) {
		return false;
	}
	Streams.refresh.lastTime = now;
	var p = new Q.Pipe(Object.keys(_retainedByStream), callback);
	Streams.refresh.beforeRequest.handle(callback, options);
	Q.each(_retainedByStream, function (ps) {
		var parts = ps.split("\t");
		Stream.refresh(parts[0], parts[1], p.fill(ps), options);
	});
	_retain = undefined;
	return true;
};

Streams.refresh.options = {
	duringEvents: ['focus', 'pageshow'],
	minSeconds: 3
};
Streams.refresh.lastTime = 0;
Streams.refresh.beforeRequest = new Q.Event();

/**
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * Streams.refresh() are called. You can release it with stream.release().
 * Call this function in a chain before calling Streams.get, Streams.related, etc.
 * in order to set the key for retaining the streams those functions obtain.
 * @param {String} key
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Streams.retainWith = function (key) {
	_retain = Q.Event.calculateKey(key, _retainedByKey);
	return this;
};

/**
 * Releases all retained streams under a given key. See Streams.retain()
 * @param {String} key
 */
Streams.release = function (key) {
	key = Q.Event.calculateKey(key);
	Q.each(_retainedByKey[key], function (ps, v) {
		if (_retainedByStream[ps]) {
			delete _retainedByStream[ps][key];
			if (Q.isEmpty(_retainedByStream[ps])) {
				delete(_retainedByStream[ps]);
				delete(_retainedStreams[ps]);
			}
		}
	});
	delete _retainedByKey[key];
};

/**
 * Invite other users to a stream. Must be logged in first.
 * @static
 * @param {String} publisherId The user id of the publisher of the stream 
 * @param {String} streamName The name of the stream you are inviting to
 * @param {String} fields More fields that are passed to the API, which can include:
 *  "identifier": Required for now. An email address or mobile number to invite. Might not belong to an existing user yet.
 *  "appUrl": Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 * @param {Callable} callback Called with (err, result)
 */
Streams.invite = function (publisherId, streamName, fields, callback) {
	// TODO: expand this implementation to be complete
	if (!Q.Users.loggedInUser) {
		Q.handle(callback, null, ["Streams.invite: not logged in"]);
		return false; // not logged in
	}
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	fields = Q.copy(fields);
	fields.publisherId = publisherId,
	fields.streamName = streamName;
	fields.displayName = fields.displayName || Q.Users.loggedInUser.displayName;
	Q.req('Streams/invite', ['data'], function (err, data) {
		Q.handle(callback, null, [err, data]);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};

/**
 * Constructs a stream from fields, which are typically returned from the server.
 * @param {String} fields
 */
var Stream = Streams.Stream = function (fields) {
	if (this.constructed) {
		return;
	}
	this.constructed = true;
	this.fields = Q.copy(fields, [
		'publisherId',
		'name',
		'type',
		'title',
		'content',
		'attributes',
		'icon',
		'messageCount',
		'participantCount',
		'insertedTime',
		'updatedTime',
		'readLevel',
		'writeLevel',
		'adminLevel',
		'inheritAccess'
	]);
	if (this.fields.messageCount) {
		this.fields.messageCount = parseInt(this.fields.messageCount);
	}
	if (this.fields.participantCount) {
		this.fields.participantCount = parseInt(this.fields.participantCount);
	}
	try {
		this.pendingAttributes = this.attributes = fields.attributes
			? JSON.parse(fields.attributes)
			: {};
	} catch (e) {
		this.pendingAttributes = this.attributes = {};
	}
	this.pendingFields = {};
	this.access = Q.copy(fields.access) ;
	this.typename = 'Q.Streams.Stream';
};

Stream.get = Streams.get;
Stream.create = Streams.create;
Stream.define = Streams.define;

Stream.onError = new Q.Event(function (err) {
	console.warn(Q.firstErrorMessage(err));
}, 'Streams.onError');

/**
 * Call this function to retain a particular stream.
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * Streams.refresh() are called. You can release it with stream.release().
 * @param {String} publisherId
 * @param {String} streamName
 * @param {String} key
 * @param {Function} callback optional callback for when stream is retained
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Stream.retain = function _Stream_retain (publisherId, streamName, key, callback) {
	var ps = Streams.key(publisherId, streamName);
	key = Q.Event.calculateKey(key);
	Streams.get(publisherId, streamName, function (err) {
		_retainedStreams[ps] = this;
		Q.setObject([ps, key], true, _retainedByStream);
		Q.setObject([key, ps], true, _retainedByKey);
		Q.handle(callback, this, [err, this]);
	});
};

/**
 * Releases a stream from being retained. See Streams.retain()
 * @param {String} publisherId
 * @param {String} streamName
 */
Stream.release = function _Stream_release (publisherId, streamName) {
	var ps = Streams.key(publisherId, streamName);
	Q.each(_retainedByStream[ps], function (key, v) {
		if (_retainedByKey[key]) {
			delete _retainedByKey[key][ps];
		}
		if (Q.isEmpty(_retainedByKey[key])) {
			delete _retainedByKey[key];
		}
	});
	delete _retainedByStream[ps];
	delete _retainedStreams[ps];
};

/**
 * Waits for the latest messages to be posted to a given stream.
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * @param {Function} callback This is called when the stream has been updated with the latest messages.
 * @param {Object} options A hash of options, including:
 *  "messages": If set to true, then besides just reloading the stream, attempt to catch up on the latest messages
 * @return {boolean} whether the refresh occurred
 */
Stream.refresh = function _Stream_refresh (publisherId, streamName, callback, options) {
	if (!Q.Users.loggedInUser || !Q.isOnline()) {
		callback && callback(false);
		return false;
	}
	// If the stream was retained, fetch latest messages,
	// and replay their being "posted" to trigger the right events
	var ps = Streams.key(publisherId, streamName);
	if (!_retainedByStream[ps]) {
		return false;
	}
	if (options && options.messages) {
		Message.wait(publisherId, streamName, -1, callback);
	} else {
		Streams.get.cache.each([publisherId, streamName], function (k, v) {
			Streams.get.cache.remove(k);
		});
		Streams.get(publisherId, streamName, function (err, stream) {
			// just get the stream, and any listeners will be triggered
			var ps = Streams.key(publisherId, streamName);
			updateStream(_retainedStreams[ps], this.fields, true);
			_retainedStreams[ps] = this;
			callback(err, stream);
		});
	}
	_retain = undefined;
	return true;
};

/**
 * When a stream is retained, it is refreshed when Streams.refresh() or
 * Streams.refresh() are called. You can release it with stream.release().
 * Call this function in a chain before calling Streams.get, Streams.related, etc.
 * in order to set the key for retaining the streams those functions obtain.
 * @param {String} key
 * @return {Object} returns Streams for chaining with .get(), .related() or .getParticipating()
 */
Stream.prototype.retainWith = Streams.retainWith;

Stream.prototype.getAll = function _Stream_prototype_getAll (usePending) {
	return usePending ? this.pendingAttributes : this.attributes;
};

Stream.prototype.get = function _Stream_prototype_get (attributeName, usePending) {
	var attr = this.getAll(usePending);
	return attr[attributeName];
};

Stream.prototype.set = function _Stream_prototype_set (attributeName, value) {
	if (this.pendingAttributes === this.attributes) {
		this.pendingAttributes = Q.copy(this.attributes); // copy on write
	}
	if (typeof attributeName === 'string') {
		this.pendingAttributes[attributeName] = value;
	} else {
		for (var k in attributeName) {
			this.pendingAttributes[k] = attributeName[k];
		}
	}
	this.pendingFields.attributes = JSON.stringify(this.pendingAttributes);
};

Stream.prototype.clear = function _Stream_prototype_clear (attributeName) {
	if (this.pendingAttributes === this.attributes) {
		this.pendingAttributes = Q.copy(this.attributes); // copy on write
	}
	if (typeof attributeName === 'string') {
		delete this.pendingAttributes[attributeName];
	} else {
		for (var i=0; i<attributeName.length; ++i) {
			delete this.pendingAttributes[ attributeName[i] ];
		}
	}
	this.pendingFields.attributes = JSON.stringify(this.pendingAttributes);
};

Stream.prototype.save = function _Stream_prototype_save (callback) {
	var that = this;
	var slotName = "stream";
	this.pendingFields.publisherId = this.fields.publisherId;
	this.pendingFields.streamName = this.fields.name;
	var socketSessionId = Streams.socketSessionId(this.fields.publisherId, this.fields.name);
	if (socketSessionId) {
		this.pendingFields.socketSessionId = socketSessionId;
	}
	var baseUrl = Q.baseUrl({
		publisherId: this.pendingFields.publisherId,
		streamName: this.pendingFields.name
	});
	Q.req('Streams/stream', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		// the rest will occur in the handler for the stream.onUpdated event coming from the socket
		callback && callback.call(that, null, data.slots.stream || null);
	}, { method: 'put', fields: this.pendingFields, baseUrl: baseUrl });
};

Stream.prototype.remove = function _Stream_prototype_remove (callback) {
	return Stream.remove(this.fields.publisherId, this.fields.name, callback);
};

Stream.prototype.retain = function _Stream_prototype_retain (key, callback) {
	var ps = Streams.key(this.fields.publisherId, this.fields.name);
	key = Q.Event.calculateKey(key);
	_retainedStreams[ps] = this;
	Q.setObject([ps, key], true, _retainedByStream);
	Q.setObject([key, ps], true, _retainedByKey);
	Q.handle(callback, this, [null, this]);
	return this;
};

Stream.prototype.release = function _Stream_prototype_release () {
	Stream.release(this.fields.publisherId, this.fields.name); return this;
};

Stream.prototype.getMessage = function _Stream_prototype_getMessage (ordinal, callback) {
	return Message.get(this.fields.publisherId, this.fields.name, ordinal, callback);
};

Stream.prototype.getParticipant = function _Stream_prototype_getParticipant (userId, callback) {
	return Participant.get(this.fields.publisherId, this.fields.name, userId, callback);
};

Stream.prototype.onMessage = function _Stream_prototype_onMessage (messageType) {
	return Stream.onMessage(this.fields.publisherId, this.fields.name, messageType);
};

Stream.prototype.onUpdated = function _Stream_prototype_onUpdated (attribute) {
	return Stream.onUpdated(this.fields.publisherId, this.fields.name, attribute);
};

Stream.prototype.onFieldChanged = function _Stream_prototype_onFieldChanged (field) {
	return Stream.onFieldChanged(this.fields.publisherId, this.fields.name, field);
};

Stream.prototype.onRelatedFrom = function _Stream_prototype_onRelatedFrom () {
	return Stream.onRelatedFrom(this.fields.publisherId, this.fields.name);
};

Stream.prototype.onRelatedTo = function _Stream_prototype_onRelatedTo () {
	return Stream.onRelatedTo(this.fields.publisherId, this.fields.name);
};

Stream.prototype.onUnrelatedFrom = function _Stream_prototype_onUnrelatedFrom () {
	return Stream.onUnrelatedFrom(this.fields.publisherId, this.fields.name);
};

Stream.prototype.onUnrelatedTo = function  _Stream_prototype_onUnrelatedTo () {
	return Stream.onUnrelatedTo(this.fields.publisherId, this.fields.name);
};

Stream.prototype.onUpdatedRelateFrom = function  _Stream_prototype_onUpdatedRelateFrom () {
	return Stream.onUpdatedRelateFrom(this.fields.publisherId, this.fields.name);
};

Stream.prototype.onUpdatedRelateTo = function _Stream_prototype_onUpdatedRelateTo () {
	return Stream.onUpdatedRelateTo(this.fields.publisherId, this.fields.name);
};

/**
 * Post a message to this stream.
 * @param {Object} msg A Streams.Message object or a hash of fields to post. This stream's publisherId and streamName are added to it.
 * @param {Function} callback Receives (err, message) as parameters
 */
Stream.prototype.post = function  _Stream_prototype_post (data, callback) {
	var message = Q.extend({
		publisherId: this.fields.publisherId,
		streamName: this.fields.name
	}, data);
	return Message.post(message, callback);
};

/**
 * Join a stream as a participant
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream to join
 * @param {Function} callback receives (err, participant) as parameters
 */
Stream.prototype.join = function _Stream_prototype_join (callback) {
	return Stream.join(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Leave a stream that you previously joined, so that you don't get realtime messages anymore.
 * @param {Function} callback Receives (err, participant) as parameters
 */
Stream.prototype.leave = function _Stream_prototype_leave (callback) {
	return Stream.leave(this.fields.publisherId, this.fields.name, callback);
};

/**
 * Test whether the user has enough access rights when it comes to reading from the stream
 * @param {String} level One of the values in Streams.READ_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Stream.prototype.testReadLevel = function _Stream_prototype_testReadLevel (level) {
	if (typeof level === 'string') {
		level = Streams.READ_LEVEL[level];
	}
	if (level === undefined) {
		throw "Streams.Stream.prototype.testReadLevel: level is undefined";
	}
	return this.access.readLevel >= level;
};

/**
 * Test whether the user has enough access rights when it comes to writing to the stream
 * @param {String} level One of the values in Streams.WRITE_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Stream.prototype.testWriteLevel = function _Stream_prototype_testWriteLevel (level) {
	if (typeof level === 'string') {
		level = Streams.WRITE_LEVEL[level];
	}
	if (level === undefined) {
		throw "Streams.Stream.prototype.testWriteLevel: level is undefined";
	}
	return this.access.writeLevel >= level;
};

/**
 * Test whether the user has enough access rights when it comes to administering the stream
 * @param {String} level One of the values in Streams.ADMIN_LEVEL
 * @return {Boolean} Returns true if the user has at least this level of access
 */
Stream.prototype.testAdminLevel = function _Stream_prototype_testAdminLevel (level) {
	if (typeof level === 'string') {
		level = Streams.ADMIN_LEVEL[level];
	}
	if (level === undefined) {
		throw "Streams.Stream.prototype.testAdminLevel: level is undefined";
	}
	return this.access.adminLevel >= level;
};

/**
 * A convenience method to get the URL of the streams-related action
 * @method register
 * @param {String} what
 *	Defaults to 'stream'. Can also be 'message', 'relation', etc.
 * @return {String} 
 *	The corresponding URL
 */
Stream.prototype.actionUrl = function _Stream_prototype_actionUrl (what) {
	return Streams.actionUrl(this.fields.publisherId, this.fields.name, what);
};

/**
 * Invite other users to this stream. Must be logged in first.
 * @param {String} fields More fields that are passed to the API, which can include:
 *  "identifier": Required for now. An email address or mobile number to invite. Might not belong to an existing user yet.
 *  "appUrl": Can be used to override the URL to which the invited user will be redirected and receive "Q.Streams.token" in the querystring.
 * @param {Callable} callback Called with (err, result)
 */
Stream.prototype.invite = function (fields, callback) {
	Streams.invite(this.fields.publisherId, this.fields.name, fields, callback);
};

/**
 * Waits for the latest messages to be posted to a given stream.
 * If your app is using socket.io, then calling this manually is largely unnecessary.
 * @param {Function} callback This is called when the stream has been updated with the latest messages.
 * @param {Object} options A hash of options, including:
 *  "messages": If set to true, then besides just reloading the stream, attempt to catch up on the latest messages
 * @return {boolean} whether the refresh occurred
 */
Stream.prototype.refresh = function _Stream_prototype_refresh (callback, options) {
	return Streams.Stream.refresh(this.fields.publisherId, this.fields.name, callback, options);
};

/**
 * Get streams related to a particular stream.
 * @method related
 * @param publisherId {string}
 *  Publisher's user id
 * @param name {string}
 *	Name of the stream to/from which the others are related
 * @param relationType {String} the type of the relation
 * @param isCategory {boolean} defaults to false. If true, then gets streams related TO this stream.
 * @param options {Object} optional object that can include:
 *  "limit": the maximum number of results to return
 *  "offset": the page offset that goes with the limit
 *  "ascending": whether to sort by ascending weight. Defaults to false.
 *  'min' => the minimum weight (inclusive) to filter by, if any
 *  'max' => the maximum weight (inclusive) to filter by, if any
 *  "prefix": optional prefix to filter the streams by
 *  "stream": pass true here to fetch the latest version of the stream (ignores cache)
 *  "participants": optional. Pass a limit here to fetch that many participants (ignores cache)
 *  "messages": optional. Pass a limit here to fetch that many messages (ignores cache)
 *  "messageType": optional String specifying the type of messages to fetch
 *  "$Module/$fieldname": any other fields you would like can be added, to be passed to your hooks on the back end
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and the "this" object is the data containing "stream", "relations" and "streams"
 */
Streams.related = Q.getter(function _Streams_related(publisherId, streamName, relationType, isCategory, options, callback) {
	if (typeof publisherId !== 'string'
	|| typeof streamName !== 'string'
	|| typeof relationType !== 'string') {
		throw "Streams.related is expecting publisherId, streamName, relationType as strings";
	}
	if (typeof isCategory !== 'boolean') {
		callback = options;
		options = isCategory;
		isCategory = undefined;
	}
	if (Q.typeOf(options) === 'function') {
		callback = options;
		options = {};
	}
	options = options || {};
	var near = isCategory ? 'to' : 'from',
		far = isCategory ? 'from' : 'to',
		farPublisherId = far+'PublisherId',
		farStreamName = far+'StreamName',
		slotNames = ['relations', 'streams'],
		fields = {"publisherId": publisherId, "streamName": streamName};
	if (options.stream) {
		slotNames.push('stream');
	}		
	if (options.messages) {
		slotNames.push('messages');
	}
	if (options.participants) {
		slotNames.push('participants');
	}
	if (relationType) {
		fields.type = relationType;
	}
	Q.extend(fields, options);
	fields.omitRedundantInfo = true;
	if (isCategory !== undefined) {
		fields.isCategory = isCategory;
	}

	var cached = Streams.get.cache.get([publisherId, streamName]);
	if (!cached || !options.stream) {
		// even if a pending request has already been sent out, we'll request it again
		slotNames.push('stream');
	}

	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', slotNames, function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		if (cached && cached.subject) {
			_processResults(null, cached.subject);
		} else {
			var extra = {};
			if (options.messages) {
				extra.messages = data.slots.messages;
			}
			if (options.participants) {
				extra.participants = data.slots.participants;
			}
			_constructStream(data.slots.stream, extra, _processResults, true);
		}

		function _processResults(err, stream) {
			var msg = Q.firstErrorMessage(err);
			if (msg) {
				return callback && callback.call(this, msg);
			}
			
			// Construct related streams from data that has been returned
			var p = new Q.Pipe(), keys = [], keys2 = {}, streams = {};
			Q.each(data.slots.streams, function (k, fields) {
				if (!fields) return;
				var key = Streams.key(fields.publisherId, fields.name);
				keys.push(key);
				keys2[key] = true;
				_constructStream(fields, {}, function () {
					streams[key] = this;
					p.fill(key)();
				}, true);
			});
			
			// Now process all the relations
			Q.each(data.slots.relations, function (j, relation) {
				relation[near] = stream;
				var key = Streams.key(relation[farPublisherId], relation[farStreamName]);
				if (!keys2[key] && relation[farPublisherId] != publisherId) {
					// Fetch all the related streams from other publishers
					keys.push(key);
					Streams.get(relation[farPublisherId], relation[farStreamName], function (err, data) {
						var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
						if (msg) {
							p.fill(key)(msg);
							return;
						}
						relation[far] = this;
						streams[key] = this;
						p.fill(key)();
						return;
					});
				} else {
					relation[far] = streams[key];
				}
			});
			
			// Finish setting up the pipe
			if (keys.length) {
				p.add(keys, _callback);
				p.run();
			} else {
				_callback();
			}
			function _callback(params) {
				// all the streams have been constructed
				for (var k in params) {
					if (params[k]) {
						if (params[k][0] === undefined) {
							delete params[k];
						} else {
							params[k] = params[k][0];
						}
					}
				}
				callback && callback.call({
					streams: streams, 
					relations: data.slots.relations, 
					stream: stream, 
					errors: params
				}, null);
			}
		}
	}, { fields: fields, baseUrl: baseUrl });
	_retain = undefined;
}, {cache: Q.Cache.document("Streams.related", 100), throttle: 'Streams.related'});

/**
 * Returns all the streams this stream is related to
 * @param relationType {String} the type of the relation
 * @param options {Object} optional object that can include:
 *  "limit": the maximum number of results to return
 *  "offset": the page offset that goes with the limit
 *  "ascending": whether to sort by ascending weight. Defaults to false.
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedFrom objects you can iterate over with Q.each
 */
Stream.prototype.relatedFrom = function _Stream_prototype_relatedFrom (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, true, options, callback);
};

/**
 * Returns all the streams related to this stream
 * @param relationType {String} the type of the relation
 * @param options {Object} optional object that can include:
 *  "limit": the maximum number of results to return
 *  "offset": the page offset that goes with the limit
 *  "ascending": whether to sort by ascending weight. Defaults to false.
 *  "prefix": optional prefix to filter the streams by
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Stream.prototype.relatedTo = function _Stream_prototype_relatedTo (relationType, options, callback) {
	return Streams.related(this.fields.publisherId, this.fields.name, relationType, false, options, callback);
};

Streams.relate = function _Streams_relate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"socketSessionId": Streams.socketSessionId(publisherId, streamName)
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var messageFrom = Q.getObject('slots.result.messageFrom', data);
		var messageTo = Q.getObject('slots.result.messageTo', data);
		// wait for messages from cached streams -- from, to or both!
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

Streams.unrelate = function _Stream_prototype_unrelate (publisherId, streamName, relationType, fromPublisherId, fromStreamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.unrelate: Not logged in.");
	}
	var slotName = "result";
	var fields = {
		"toPublisherId": publisherId,
		"toStreamName": streamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"socketSessionId": Streams.socketSessionId(publisherId, streamName)
	};
	// TODO: When we refactor Streams to support multiple hosts,
	// the client will have to post this request to both hosts if they are different
	// or servers will have tell each other on their own
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Relates this stream to another stream
 * @param relationType {String} the type of the relation
 * @param toPublisherId {String} id of publisher of the stream
 * @param toStreamName {String} name of stream to which this stream is being related
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Stream.prototype.relateTo = function _Stream_prototype_relateTo (type, toPublisherId, toStreamName, callback) {
	return Streams.relate(toPublisherId, toStreamName, type, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Relates another stream to this stream
 * @param relationType {String} the type of the relation
 * @param toPublisherId {String} id of publisher of the stream
 * @param toStreamName {String} name of stream which is being related to this stream
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Stream.prototype.relate = function _Stream_prototype_relate (type, fromPublisherId, fromStreamName, callback) {
	return Streams.relate(this.fields.publisherId, this.fields.name, type, fromPublisherId, fromStreamName, callback);
};

/**
 * Removes a relation from this stream to another stream
 * @param toPublisherId {String} id of publisher which is publishing the stream
 * @param toStreamName {String} name of stream which the being unrelated
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Stream.prototype.unrelateTo = function _Stream_prototype_unrelateTo (toPublisherId, toStreamName, callback) {
	return Streams.unrelate(this.fields.publisherId, this.fields.name, toPublisherId, toStreamName, callback);
};

/**
 * Removes a relation from another stream to this stream
 * @param fromPublisherId {String} id of publisher which is publishing the stream
 * @param fromStreamName {String} name of stream which is being unrelated
 * @param callback {Function} callback to call with the results
 *  First parameter is the error, the second one is an object of Streams.RelatedTo objects you can iterate over with Q.each
 */
Stream.prototype.unrelateFrom = function _Stream_prototype_unrelateFrom (fromPublisherId, fromStreamName, callback) {
	return Streams.unrelate(fromPublisherId, fromStreamName, type, this.fields.publisherId, this.fields.name, callback);
};

/**
 * Later we will probably make Streams.Relation objects which will provide easier access to this functionality.
 * For now, use this to update weights of relations, etc.
 */
Streams.updateRelation = function(
	toPublisherId,
	toStreamName,
	relationType,
	fromPublisherId,
	fromStreamName,
	weight,
	adjustWeights,
	callback
) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.relate: Not logged in.");
	}
	// We will send a request to wherever (toPublisherId, toStreamName) is hosted
	var slotName = "result";
	var fields = {
		"toPublisherId": toPublisherId,
		"toStreamName": toStreamName,
		"type": relationType,
		"fromPublisherId": fromPublisherId,
		"fromStreamName": fromStreamName,
		"weight": weight,
		"adjustWeights": adjustWeights,
		"socketSessionId": Streams.socketSessionId(toPublisherId, toStreamName)
	};
	var baseUrl = Q.baseUrl({
		publisherId: toPublisherId,
		streamName: toStreamName
	});
	Q.req('Streams/related', [slotName], function (err, data) {
		var message = Q.getObject('slots.result.message', data);
		callback && callback.call(this, err, Q.getObject('slots.result', data) || null);
	}, { method: 'put', fields: fields, baseUrl: baseUrl });
	_retain = undefined;
};

/**
 * Returns Q.Event which occurs on a message post event coming from socket.io
 * Generic callbacks can be assigend by setting messageType to ""
 * @method Streams.Stream.onMessage
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} name of stream which the message is posted to
 * @param messageType {String} type of the message
 * @return {Q.Event}
 */
Stream.onMessage = Q.Event.factory(_streamMessageHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when fields of the stream officially changed
 * @method Streams.Stream.onFieldChanged
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} optional name of stream which the message is posted to
 * @param fieldName {String} optional name of the field to listen for
 * @return {Q.Event}
 */
Stream.onFieldChanged = Q.Event.factory(_streamFieldChangedHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when attributes of the stream officially updated
 * @method Streams.Stream.onUpdated
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param streamName {String} optional name of stream which the message is posted to
 * @param attributeName {String} optional name of the attribute to listen for
 * @return {Q.Event}
 */
Stream.onUpdated = Q.Event.factory(_streamUpdatedHandlers, ["", "", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream
 * @method Streams.Stream.onRelatedTo
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onRelatedTo = Q.Event.factory(_streamRelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream
 * @method Streams.Stream.onRelatedFrom
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onRelatedFrom = Q.Event.factory(_streamRelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been unrelated to this stream
 * @method Streams.Stream.onUnrelatedTo
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onUnrelatedTo = Q.Event.factory(_streamUnrelatedToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was unrelated to a category stream
 * @method Streams.Stream.onUnrelatedFrom
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onUnrelatedFrom = Q.Event.factory(_streamUnrelatedFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when another stream has been related to this stream
 * @method Streams.Stream.onUpdatedRelateTo
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onUpdatedRelateTo = Q.Event.factory(_streamUpdatedRelateToHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs when this stream was related to a category stream
 * @method Streams.Stream.onUpdatedRelateFrom
 * @param publisherId {String} id of publisher which is publishing this stream
 * @param streamName {String} optional name of this stream
 * @return {Q.Event}
 */
Stream.onUpdatedRelateFrom = Q.Event.factory(_streamUpdatedRelateFromHandlers, ["", ""]);

/**
 * Returns Q.Event which occurs after a stream is constructed on the client side
 * Generic callbacks can be assigend by setting type or mtype or both to ""
 * @method Streams.Stream.onConstruct
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream which is being constructed on the client side
 * @return {Q.Event}
 */
Stream.onConstruct = Q.Event.factory(_streamConstructHandlers, ["", ""]);

/**
 * Returns Q.Event that occurs after fresh stream info has arrived on the client side
 * @method Streams.Stream.onRefresh
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream which is being constructed on the client side
 * @return {Q.Event}
 */
Stream.onRefresh = Q.Event.factory(_streamRefreshHandlers, ["", ""]);

/**
 * Join a stream as a participant
 * @param publisherId {String} id of publisher which is publishing the stream
 * @param name {String} name of stream to join
 * @param {Function} callback receives (err, participant) as parameters
 */
Stream.join = function _Stream_join (publisherId, streamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.join: Not logged in.");
	}
	var slotName = "participant";
	var fields = {"publisherId": publisherId, "name": streamName};
	var baseUrl = Q.baseUrl({
		"publisherId": publisherId,
		"streamName": streamName,
		"socketSessionId": Streams.socketSessionId(publisherId, streamName)
	});
	Q.req('Streams/join', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.set(
			[participant.publisherId, participant.name, participant.userId],
			0, participant, [err, participant]
		);
		callback && callback.call(participant, err, participant || null);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};

/**
 * Leave a stream that you previously joined, so that you don't get realtime messages anymore.
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Function} callback Receives (err, participant) as parameters
 */
Stream.leave = function _Stream_leave (publisherId, streamName, callback) {
	if (!Q.plugins.Users.loggedInUser) {
		throw new Error("Streams.Stream.join: Not logged in.");
	}
	var slotName = "participant";
	var fields = {
		"publisherId": publisherId, 
		"name": streamName,
		"socketSessionId": Streams.socketSessionId(publisherId, streamName)
	};
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/leave', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var participant = new Participant(data.slots.participant);
		Participant.get.cache.remove(
			[data.slots.participant.publisherId, data.slots.participant.name, data.slots.participant.userId]
		);
		callback && callback.call(this, err, participant || null);
	}, { method: 'post', fields: fields, baseUrl: baseUrl });
};

/**
 * Remove a stream from the database.
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Function} callback Receives (err, result) as parameters
 */
Stream.remove = function _Stream_remove (publisherId, streamName, callback) {
	var slotName = "result";
	var fields = {"publisherId": publisherId, "name": streamName};
	var baseUrl = Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	Q.req('Streams/stream', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		callback && callback.call(this, err, data.slots.result || null);
	}, { method: 'delete', fields: fields, baseUrl: baseUrl });
};

var Message = Streams.Message = function Streams_Message(obj) {
	Q.extend(this, obj);
	this.typename = 'Q.Streams.Message';
	this.getAll = function () {
		try {
			return JSON.parse(this.instructions);
		} catch (e) {
			return undefined;
		}
	};
	this.get = function (instructionName) {
		var instr = this.getAll();
		return instr[instructionName];
	};
};

/**
 * Get one or more messages
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Number|Object} ordinal Can be the ordinal, or an object containing one or more of:
 *   "min": The minimum ordinal in the range.
 *   "max": The maximum ordinal in the range. If omitted, gets the latest messages.
 *   "limit": Change the max number of messages to retrieve. If only max and limit are specified, messages are sorted by decreasing ordinal.
 * @param {Function} callback This receives two parameters. The first is the error.
 *   If ordinal was a Number, then the second parameter is the Streams.Message, as well as the "this" object.
 *   If ordinal was an Object, then the second parameter is a hash of { ordinal: Streams.Message } pairs
 */
Message.get = Q.getter(function _Message_get (publisherId, streamName, ordinal, callback) {
	var slotName, criteria = {};
	if (Q.typeOf(ordinal) === 'object') {
		slotName = 'messages';
		criteria.min = ordinal.min;
		criteria.max = ordinal.max;
		criteria.limit = ordinal.limit;
		if ('type' in ordinal) criteria.type = ordinal.type;
		if ('ascending' in ordinal) criteria.ascending = ordinal.ascending;
	} else {
		slotName = 'message';
		criteria = ordinal;
	}

	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'message', slotName, publisherId, streamName, criteria, function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var messages = {};
		if ('messages' in data) {
			messages = data.messages;
		} else if ('message' in data) {
			messages[ordinal] = data.message;
		}
		Q.each(messages, function (ordinal, message) {
			if (Q.typeOf(message) !== 'Q.Streams.Message') {
				message = new Message(message);
			}
			messages[ordinal] = message;
			Message.get.cache.set(
				[publisherId, streamName, parseInt(ordinal)],
				0, message, [err, message]
			);
		});
		if (Q.isPlainObject(ordinal)) {
			callback && callback.call(this, err, messages || null);
		} else {
			var message = messages[Q.first(messages)];
			callback && callback.call(message, err, message || null);
		}
	});
}, {cache: Q.Cache.document("Streams.Message.get", 1000), throttle: 'Streams.Message.get'});

/**
 * Post a message to a stream.
 * @param {Object} msg A Streams.Message object or a hash of fields to post. Must include publisherId and streamName.
 * @param {Function} callback Receives (err, message) as parameters
 */
Message.post = function _Message_post (msg, callback) {
	var slotName = "message";
	var baseUrl = Q.baseUrl({
		publisherId: msg.publisherId,
		streamName: msg.streamName
	});
	msg.socketSessionId = Streams.socketSessionId(msg.publisherId, msg.streamName);
	Q.req('Streams/message', [slotName], function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var message = data.slots.message && new Message(data.slots.message);
		Message.get.cache.set(
			[msg.publisherId, msg.streamName, msg.ordinal],
			0, message, [err, message]
		);
		callback && callback.call(message, err, message || null);
	}, { method: 'post', fields: msg, baseUrl: baseUrl });
};

/**
 * Gets the latest ordinal as long as there is a cache for that stream or that stream's messages.
 * Otherwise it returns 0.
 * @param {String} publisherId
 * @param {String} streamName
 * @return {Number}
 */
Message.latestOrdinal = function _Message_latestOrdinal (publisherId, streamName) {
	var latest = 0;
	Streams.get.cache.each([publisherId, streamName], function (k, v) {
		if (!v.params[0] && v.subject.fields.messageCount > 0) {
			latest = v.subject.fields.messageCount;
			return false;
		}
	});
	if (!latest) {
		Message.get.cache.each([publisherId, streamName], function (k, v) {
			if (!v.params[0] && v.subject.ordinal > 0) {
				latest = Math.max(latest, v.subject.ordinal);
			}
		});
	}
	return parseInt(latest);
};

/**
 * Wait until a particular message is posted.
 * Used by Streams plugin to make sure messages arrive in order.
 * @param {String} publisherId
 * @param {String} streamName
 * @param {Number} ordinal The ordinal of the message to wait for, or -1 to load latest messages
 * @param {Function} callback Receives ([arrayOfOrdinals]) as parameters
 * @param {Object} options A hash of options which can include:
 *   "max": The maximum number of messages to wait and hope they will arrive via sockets. Any more and we just request them again.
 *   "timeout": The maximum amount of time to wait and hope the messages will arrive via sockets. After this we just request them again.
 */
Message.wait = function _Message_wait (publisherId, streamName, ordinal, callback, options) {
	var alreadyCalled = false, handlerKey;
	var latest = Message.latestOrdinal(publisherId, streamName);
	if (!latest) {
		Q.handle(callback, this, [null]); // There is no cache for this stream, so we won't wait for previous messages.
		return false;
	}
	if (ordinal >= 0 && ordinal <= latest) {
		Q.handle(callback, this, [null]); // The cached stream already got this message
		return true;
	}
	var o = Q.extend({}, Message.wait.options, options);
	var waiting = {};
	var node = Q.nodeUrl({
		publisherId: publisherId,
		streamName: streamName
	});
	var socket = Q.Socket.get('Streams', node);
	if (socket && ordinal >= 0 && ordinal - o.max <= latest) {
		// ok, wait a little while
		var t = setTimeout(_tryLoading, o.timeout);
		var ordinals = [];
		Q.each(latest+1, ordinal, 1, function (ord) {
			ordinals.push(ord);
			var event = Streams.Stream.onMessage(publisherId, streamName, ord);
			handlerKey = event.set(function () {
				p.fill(ord)();
				event.remove(handlerKey);
				handlerKey = null;
			});
			waiting[ord] = [event, handlerKey];
		});
		var p = new Q.Pipe(ordinals, function () {
			// they all arrived
			if (!alreadyCalled) {
				Q.handle(callback, this, [ordinals]);
			}
			alreadyCalled = true;
			return true;
		});
	} else {
		_tryLoading();
	}	
	function _tryLoading() {
		// forget waiting, we'll request them again
		
		// We could have requested just the remaining ones, like this:
		// var filled = Q.Object(pipe.subjects),
		//	 remaining = Q.diff(ordinals, filled);
		// but we are going to request the entire range.
		
		if (ordinal < 0) {
			Message.get.forget(publisherId, streamName, {min: latest+1, max: ordinal});
		}
		Message.get(publisherId, streamName, {min: latest+1, max: ordinal}, function (err, messages) {
			// Go through the messages and simulate the posting
			// NOTE: the messages will arrive a lot quicker than they were posted,
			// and moreover without browser refresh cycles in between,
			// which may cause confusion in some visual representations
			// until things settle down on the screen
			Q.each(messages, function (ordinal, message) {
				Q.Streams.onEvent('post').handle(message);
			}, {ascending: true, numeric: true});
			
			// if any new messages were encountered, updateMessageCache removed all the cached
			// results where max < 0, so future calls to Streams.Message.get with max < 0 will
			// make a request to the server

			// Do we have this message now?
			if (ordinal < 0 || Message.get.cache.get([publisherId, streamName, ordinal])) {
				// remove any event handlers still waiting for the event to be posted
				Q.each(waiting, function (i, w) {
					w[0].remove(w[1]);
				});
				if (!alreadyCalled) {
					Q.handle(callback);
				}
				alreadyCalled = true;
			}
		});
	}
};
Message.wait.options = {
	max: 5, // maximum number of messages we'll actually wait for, if there's a socket
	timeout: 1000 // maximum number of milliseconds we'll actually wait for, if there's a socket
};

var Participant = Participant = function Streams_Participant(obj) {
	Q.extend(this, obj);
	this.typename = 'Q.Streams.Participant';
};

/**
 * Get one or more participants, sorted by insertedTime
 * @param {String} publisherId
 * @param {String} streamName
 * @param {String|Object} userId Can be the id of the participant user, or an object containing one or more of:
 *   "limit": The maximum number of participants to retrieve.
 *   "offset": The offset of the participants to retrieve. If it is -1 or lower, then participants are sorted by descending insertedTime.
 *   "state": The state of the participants to filter by, if any. Can be one of ('invited', 'participating', 'left')
 * @param {Function} callback This receives two parameters. The first is the error.
 *   If userId was a String, then the second parameter is the Streams.Participant, as well as the "this" object.
 *   If userId was an Object, then the second parameter is a hash of { userId: Streams.Participant } pairs
 */
Participant.get = Q.getter(function _Participant_get(publisherId, streamName, userId, callback) {
	var slotName, criteria = {"publisherId": publisherId, "name": streamName};
	if (Q.typeOf(userId) === 'object') {
		slotName = 'participants';
		criteria.limit = userId.limit;
		criteria.offset = userId.offset;
		if ('state' in userId) criteria.state = userId.state;
		if ('userId' in userId) criteria.userId = userId.userId;
	} else {
		slotName = 'participant';
		criteria.userId = userId;
	}
	var func = Streams.batchFunction(Q.baseUrl({
		publisherId: publisherId,
		streamName: streamName
	}));
	func.call(this, 'participant', slotName, publisherId, streamName, criteria, function (err, data) {
		var participants = {};
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		if ('participants' in data) {
			participants = data.participants;
		} else if ('participant' in data) {
			participants[userId] = data.participant;
		}
		Q.each(participants, function (userId, p) {
			var participant = participants[userId] = p && new Participant(p);
			Participant.get.cache.set(
				[publisherId, streamName, userId],
				0, participant, [err, participant]
			);
		});
		if (Q.isPlainObject(userId)) {
			callback && callback.call(this, err, participants || null);
		} else {
			var participant = participants[Q.first(participants)];
			callback && callback.call(participant, err, participant || null);
		}
	});
}, {cache: Q.Cache.document("Streams.Participant.get", 1000), throttle: 'Streams.Participant.get'});

/**
 * Constructs an avatar from fields, which are typically returned from the server.
 * @param {String} fields
 */
var Avatar = Streams.Avatar = function Streams_Avatar (fields) {
	Q.extend(this, fields);
	this.typename = 'Q.Streams.Avatar';
};

/**
 * Avatar batch getter.
 * @method get
 * @param userId {String} The id of the user whose avatar we are requesting
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a Streams.Avatar object
 */
Avatar.get = Q.getter(function _Avatar_get (userId, callback) {
	var func = Streams.batchFunction(Q.baseUrl({userId: userId}));
	func.call(this, 'avatar', 'avatars', userId, function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var avatar = data.avatars[userId]
			? new Avatar(data.avatars[userId])
			: null;
		Avatar.get.cache.set(
			[userId],
			0, avatar, [err, avatar]
		);
		callback && callback.call(avatar, null, avatar);
	});
}, {cache: Q.Cache.document("Streams.Avatar.get", 1000), throttle: 'Streams.Avatar.get'});

/**
 * Get avatars by prefix
 * @method get
 * @param prefix {string}
 *  For example something the user started typing in an autocomplete field
 * @param callback {function}
 *	if there were errors, first parameter is an array of errors
 *  otherwise, first parameter is null and second parameter is a hash of {userId: Streams.Avatar} pairs
 */
Avatar.byPrefix = Q.getter(function _Avatar_byPrefix (prefix, callback) {
	var userId = Q.plugins.Users.loggedInUser ? Q.Users.loggedInUser.id : "";
   	var func = Streams.batchFunction(Q.baseUrl({
		userId: userId // if userId is empty, then we query avatars on one of the public servers
	}));
	func.call(this, 'avatar', 'avatars', {prefix: prefix}, function (err, data) {
		var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
		if (msg) {
			return callback && callback.call(this, msg);
		}
		var avatars = {};
		Q.each(data.avatars, function (userId, avatar) {
			avatars[userId] = avatar = new Avatar(avatar);
			Avatar.get.cache.set([userId], 0, avatar, [null, avatar]);
		});
		Avatar.byPrefix.cache.set([prefix], 0, this, [null, avatars]);
		callback && callback.call(this, null, avatars);
	});
}, {cache: Q.Cache.document("Streams.Avatar.byPrefix", 100), throttle: 'Streams.Avatar.byPrefix'});

/**
 * Get the display name from a Streams.Avatar
 * @param {Object} options
 *  A bunch of options which can include:
 *  "short": "Try to show the first name only"
 * @return {String}
 */
Avatar.prototype.displayName = function _Avatar_prototype_displayName (options) {
	var fn = this.firstName, 
		ln = this.lastName,
		u = this.username;
	if (options['short']) {
		return fn || u;
	}
	if (fn && ln) {
		return fn + ' ' + ln;
	} else if (fn && !ln) {
		return u ? fn + ' ' + u : fn;
	} else if (!fn && !ln) {
		return u + ' ' + ln;
	} else {
		return u ? u : null;
	}
};

/**
 * Extract a displayable title from a stream's type
 * @param {String} type
 * @return {String}
 */
Streams.displayType = function _Streams_displayType(type) {
	return type.split('/').slice(1).join('/');
};

Streams.setupRegisterForm = function _Streams_setupRegisterForm(identifier, json, priv, overlay) {
	var src = json.entry.thumbnailUrl;
	var src40 = src, src50 = src, src80w = src;
	var firstName = '', lastName = '';
	if (priv.registerInfo) {
		if (priv.registerInfo.firstName){
			firstName = priv.registerInfo.firstName;
		}
		if (priv.registerInfo.lastName){
			lastName = priv.registerInfo.lastName;
		}
		if (priv.registerInfo.pic_square) {
			src40 = src50 = src = priv.registerInfo.pic_square;
		}
		if (priv.registerInfo.pic) {
			src80w = priv.registerInfo.pic;
		}
	}
	var img = $('<img />').attr('src', src).attr('title', Q.text.Streams.login.picTooltip);
	if (img.tooltip) {
		img.tooltip();
	}
	var td, table = $('<table />').append(
		$('<tr />').append(
			$('<td class="Streams_login_picture" />').append(img)
		).append(
			td = $('<td class="Streams_login_username_block" />').append(
				$('<label for="Streams_login_username" />').html(Q.text.Streams.login.fullname)
			).append(
				'<br>'
			).append(
				$('<input id="Streams_login_username" name="fullname" type="text" class="text" />')
				.attr('maxlength', Q.text.Users.login.maxlengths.fullname)
				.attr('placeholder', Q.text.Users.login.placeholders.fullname)
				.val(firstName+(lastName ? ' ' : '')+lastName)
			)
		)
	);
	var register_form = $('<form method="post" class=class="Streams_register_form" />')
	.attr('action', Q.action("Streams/register"))
	.data('form-type', 'register')
	.append($('<div class="Streams_login_appear" />'));

	register_form.append(table)
	.append($('<input type="hidden" name="identifier" />').val(identifier))
	.append($('<input type="hidden" name="icon" />'))
	.append($('<input type="hidden" name="Q.method" />').val('post'))
	.append($('<div class="Streams_login_get_started">&nbsp;</div>').append(
		$('<button type="submit" class="Q_button Q_main_button Streams_login_start " />')
		.html(Q.text.Users.login.registerButton)
	)).submit(function () {
		$(this).removeData('cancelSubmit');
		if (!$('#Users_agree').attr('checked')) {
			if (!confirm(Q.text.Users.login.confirmTerms)) {
				$(this).data('cancelSubmit', true);
			} else {
				$('#Users_agree').attr('checked', 'checked');
			}
		}
	});
	if (priv.activation) {
		register_form.append($('<input type="hidden" name="activation" />').val(priv.activation));
	}

	if (json.termsLabel) {
		td.append(
			$('<div />').attr("id", "Users_register_terms")
				.append($('<input type="checkbox" name="agree" id="Users_agree" value="yes">'))
				.append($('<label for="Users_agree" />').html(json.termsLabel))
		);
	}

	var authResponse, fields = {};
	if (Q.plugins.Users.facebookApps && Q.plugins.Users.facebookApps[Q.info.app]) {
		Q.plugins.Users.initFacebook(function() {
			if ((authResponse = FB.getAuthResponse())) {
				fields['Users'] = {
					'facebook_authResponse': authResponse
				};
				for (var k in authResponse) {
					register_form.append(
						$('<input type="hidden" />')
						.attr('name', 'Users[facebook_authResponse][' + k + ']')
						.attr('value', authResponse[k])
					);
				}
			}
		});
	}

	if ($('#Streams_login_step1_form').data('used') === 'facebook') {
		register_form.append($('<input type="hidden" name="provider" value="facebook" />'));
	}
	if (json.emailExists || json.mobileExists) {
		var p = $('<p id="Streams_login_identifierExists" />')
			.html(json.emailExists ? Q.text.Users.login.emailExists : Q.text.Users.login.mobileExists);
		$('a', p).click(function() {
			$.post(Q.ajaxExtend(Q.action("Users/resend"), 'data'), 'identifier='+encodeURIComponent(identifier), function () {
				overlay.close();
			});
			return false;
		});
		register_form.append(p);
	}
	return register_form;
};

function updateStream(stream, fields, onlyChangedFields) {
	if (!stream || !fields) {
		return false;
	}
	var publisherId = stream.fields.publisherId,
		streamName = stream.fields.name;
	// events about updated fields
	for (k in fields) {
		if (onlyChangedFields && fields[k] === stream.fields[k]) continue;
		Q.handle(
			Q.getObject([publisherId, streamName, k], _streamFieldChangedHandlers),
			stream,
			[fields, k]
		);
	}
	Q.handle(
		Q.getObject([publisherId, streamName, ''], _streamFieldChangedHandlers),
		stream,
		[fields, k]
	);
	Q.handle(
		Q.getObject([publisherId, '', ''], _streamFieldChangedHandlers),
		stream,
		[fields, k]
	);
	if ('attributes' in fields) {
		var attributes = JSON.parse(fields.attributes);
		var updated = {}, cleared = [];
		var publisherId = fields.publisherId, streamName = fields.name, k;
		// events about cleared attributes
		for (k in stream.attributes) {
			if (k in attributes) {
				continue;
			}
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamUpdatedHandlers),
				stream,
				[fields, {k: undefined}, [k]]
			);
			updated[k] = undefined;
			cleared.push(k);
		}
		// events about updated attributes
		for (k in attributes) {
			if (JSON.stringify(attributes[k]) == JSON.stringify(stream.attributes[k])) {
				continue;
			}
			Q.handle(
				Q.getObject([publisherId, streamName, k], _streamUpdatedHandlers),
				stream,
				[fields, {k: attributes[k]}]
			);
			updated[k] = attributes[k];
		}
		Q.handle(
			Q.getObject([publisherId, streamName, ''], _streamUpdatedHandlers),
			stream,
			[fields, updated, cleared]
		);
		Q.handle(
			Q.getObject([publisherId, '', ''], _streamUpdatedHandlers),
			stream,
			[fields, updated, cleared]
		);
	}
	// var f = Q.extend({}, stream.fields, fields);
	// f.access = stream.access;
	// _constructStream(f, {}, null, true);
}

function _onCalledHandler(args, shared) {
	shared.retainUnderKey = _retain;
	_retain = undefined;
}

function _onResultHandler(subject, params, args, ret, original) {
	var key = ret.retainUnderKey;
	if (key == undefined || params[0] || !subject) {
		return; // either retainWith was not called or an error occurred during the request
	}
	if (subject.stream) {
		subject.stream.retain(key);
		Q.each(subject.streams, 'retain', [key]);
	}
	if (Q.typeOf(subject) === 'Q.Streams.Stream') {
		subject.retain(key);
	}
}

Q.each([Streams.get, Streams.getParticipating, Streams.related], function () {
	this.onCalled.set(_onCalledHandler, 'Streams');
	this.onResult.set(_onResultHandler, 'Streams');
});

function submitClosestForm () {
	$(this).closest('form').submit();
	return false;
}

Q.Tool.define("Streams/preview", function (options) {
	console.warn('TODO: Generic preview should be implemented');
});

Q.Tool.onMissingConstructor.set(function (constructors, normalized) {
	if (normalized.substr(-"_preview".length) === "_preview") {
		constructors[normalized] = Q.Tool.constructors["streams_preview"];
	}
}, 'Streams');

Q.onInit.add(function _Streams_onInit() {
	var Users = Q.plugins.Users;
	Users.login.options.setupRegisterForm = Streams.setupRegisterForm;
	Q.text.Users.login.placeholders.fullname = 'Enter your full name';
	Q.text.Users.login.maxlengths.fullname = 50;

	Users.login.options.onSuccess.set(_connectSockets, "Streams");
	Users.logout.options.onSuccess.set(Q.Socket.destroyAll, "Streams");
	if (Users.loggedInUser) {
		_connectSockets();
	}

	var pushNotification = window.plugins && window.plugins.pushNotification;
	function _registerPushNotifications () {
		pushNotification.registerDevice({alert:true, badge:true, sound:true}, function(status) {
			// if successful status is an object that looks like this:
			// {"type":"7","pushBadge":"1","pushSound":"1","enabled":"1","deviceToken":"blablahblah","pushAlert":"1"}
			Q.req('Users/device', 'data', function (res) {
				if (res.errors) return console.log(res.errors[0].message);
				Streams.pushNotification = {
					engine: pushNotification,
					status: status
				};
				document.addEventListener('push-notification', function(e) {
					if (e.notification && e.notification.aps && e.notification.aps.badge !== undefined) {
						pushNotification.setApplicationIconBadgeNumber(e.notification.aps.badge);
					}
				});
				function _onActivate() {
					pushNotification.getPendingNotifications(function(e) {
						if (e.notifications.length) {
							var n = e.notifications[0];
							// trigger activation event only if application was inactive
							if (n.applicationStateActive === "0") Q.handle(Streams.onActivate, Streams, [n.data]);
						}
					});
				}
				document.addEventListener('active', _onActivate);
				_onActivate();
			}, {
				method: "post",
				fields: {token: status.deviceToken},
				quiet: true
			});
		});
	}
	if (Q.info.isCordova && pushNotification && !Streams.pushNotification) {
		Q.Users.login.options.onSuccess.set(_registerPushNotifications, 'Streams.PushNotifications');
		Q.Users.logout.options.onSuccess.set(function() { pushNotification.setApplicationIconBadgeNumber(0); }, 'Streams.PushNotifications');
		if (Q.Users.loggedInUser) _registerPushNotifications();
	}
	// handle socket connect/disconnect on resign/resume application
	if (Q.info.isCordova) {
		Q.addEventListener(document, ['resign', 'pause'], _disconnectSockets);
		Q.addEventListener(document, 'resume', function () {
			if (Q.Users.loggedInUser) {
				Q.Cache.document("Streams.getParticipating").clear();
				_connectSockets();
				if (Q.isOnline()) {
					Q.handle(location); // reload the entire page
				}
			}
		});
	}
	Q.onOnline.set(function () {
		_connectSockets(true);
	}, 'Streams'); // perhaps something happened offline

	// set up full name request dialog
	Q.onPageLoad('').add(function _Streams_onPageLoad() {
		if (Q.getObject("Q.plugins.Users.loggedInUser.displayName")) {
			return;
		}
		var params = Q.getObject("Q.plugins.Streams.invite.dialog");
		if (!params) {
			return;
		}
		Q.Template.render('Streams/invite/redeem', params, function(html) {
			var dialog = $(html);
			Q.Dialogs.push({
				dialog: dialog,
				mask: true,
				closeOnEsc: false,
				onActivate: {'Streams.redeemInvited': function() {
					dialog.find('#Streams_login_username')
						  .attr('maxlength', Q.text.Users.login.maxlengths.fullname)
						  .attr('placeholder', Q.text.Users.login.placeholders.fullname)
						  .plugin('Q/placeholders');
					var redeem_form = dialog.find('form').validator().submit(function(e) {
						e.preventDefault();
						var baseUrl = Q.baseUrl({
							publisherId: Q.plugins.Users.loggedInUser.id,
							streamName: ""  // NOTE: the request is routed to wherever the "" stream would have been hosted
						});
						Q.req('Streams/basic?' + $(this).serialize(), ['data'], function (response) {
							if (response.errors) {
								redeem_form.data('validator').invalidate(Q.ajaxErrors(response.errors, ['fullname']));
								$('input', redeem_form).plugin('Q/clickfocus');
								return;
							}
							redeem_form.data('validator').reset();
							dialog.data('Q/dialog').close();
						}, {method: "post", quietly: true, baseUrl: baseUrl});
					});
				}}
			});
		});
	}, "Streams");

	Streams.onEvent('debug').set(function _Streams_debug_handler (msg) {
		console.log('DEBUG:', msg);
	}, 'Streams');

	// if stream was edited or removed - invalidate cache
	Streams.onEvent('remove').set(function _Streams_remove_handler (stream) {
		Streams.get.forget(stream.publisherId, stream.name);
	}, 'Streams');

	Streams.onEvent('join').set(function _Streams_join_handler (p) {
		// 'join' event contains new participant.
		console.log('Streams.onEvent("join")', p);
		var _cache = Participant.get.cache;
		if (_cache) {
			var key = JSON.stringify([p.publisherId, p.streamName, p.userId]);
			_cache.set(key, p);
		}
	}, 'Streams');

	Streams.onEvent('leave').set(function (p) {
		// 'leave' event contains removed participant.
		console.log('Streams.onEvent("leave")', p);
		Participant.get.cache.set(
			[p.publisherId, p.streamName, p.userId],
			0, p, [null, p]
		);
	});

	Streams.onEvent('post').set(function _Streams_post_handler (msg) {
		// Wait until the previous message has been posted, then process this one.
		// Will return immediately if previous message is already cached
		// (e.g. from a post or retrieving a stream, or because there was no cache yet)
		Message.wait(msg.publisherId, msg.streamName, msg.ordinal-1, function () {
			// New message posted - update cache
			console.log('Streams.onEvent("post")', msg);
			var message = (Q.typeOf(msg) === 'Q.Streams.Message')
				? msg
				: new Message(msg);
			Message.get.cache.set(
				[msg.publisherId, msg.streamName, msg.ordinal],
				0, message, [null, message]
			);
			var cached = Streams.get.cache.get([msg.publisherId, msg.streamName]);
			Streams.get(msg.publisherId, msg.streamName, function (err) {

				if (err) {
					console.warn(Q.firstErrorMessage(err));
					console.log(err);
					return;
				}

				var stream = this;
				var params = [this, message];
				
				if (cached && ('messageCount' in stream.fields)) {
					++stream.fields.messageCount; // increment message count
				}

				_messageHandlers[msg.streamType] &&
				_messageHandlers[msg.streamType][msg.type] &&
				Q.handle(_messageHandlers[msg.streamType][msg.type], Q.plugins.Streams, params);

				_messageHandlers[''] &&
				_messageHandlers[''][msg.type] &&
				Q.handle(_messageHandlers[''][msg.type], Q.plugins.Streams, params);

				_messageHandlers[msg.streamType] &&
				_messageHandlers[msg.streamType][''] &&
				Q.handle(_messageHandlers[msg.streamType][''], Q.plugins.Streams, params);

				_messageHandlers[''] &&
				_messageHandlers[''][''] &&
				Q.handle(_messageHandlers[''][''], Q.plugins.Streams, params);

				Q.each([msg.publisherId, ''], function (ordinal, publisherId) {
					Q.each([msg.streamName, ''], function (ordinal, streamName) {
						Q.each([msg.type, ''], function (ordinal, type) {
							Q.handle(
								Q.getObject([publisherId, streamName, type], _streamMessageHandlers),
								Q.plugins.Streams,
								[stream, msg]
							);
						});
					});
				});

				updateMessageCache();

				var fields = msg.instructions && JSON.parse(msg.instructions);
				var node;
				var updatedParticipants = true;
				switch (msg.type) {
				case 'Streams/joined':
					updateParticipantCache(1);
					if (stream.fields.name==="Streams/participating") {
						node = Q.nodeUrl({
							publisherId: fields.publisherId,
							streamName: fields.streamName
						});
						Q.Socket.onConnect(node).add(function (socket) {
							console.log('Listening to stream '+p.publisherId+", "+p.streamName);
						}, 'Streams');
						Q.Socket.connect(node, 'Streams');
					}
					break;
				case 'Streams/left':
					updateParticipantCache(-1);
					if (stream.fields.name==="Streams/participating") {
						node = Q.nodeUrl({
							publisherId: fields.publisherId,
							streamName: fields.streamName
						});
						var socket = Q.Socket.get('Streams', node);
						if (socket) {
							// only disconnect when you've left all the streams on this node
							// socket.disconnect();
						}
					}
					break;
				case 'Streams/edited':
					updateStream(stream, fields, false);
					break;
				case 'Streams/relatedFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamRelatedFromHandlers, msg, stream, fields);
					break;
				case 'Streams/relatedTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamRelatedToHandlers, msg, stream, fields);
					break;
				case 'Streams/unrelatedFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamUnrelatedFromHandlers, msg, stream, fields);
					break;
				case 'Streams/unrelatedTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamUnrelatedToHandlers, msg, stream, fields);
					break;
				case 'Streams/updatedRelateFrom':
					updateRelatedCache(fields);
					_relationHandlers(_streamUpdatedRelateFromHandlers, msg, stream, fields);
					break;
				case 'Streams/updatedRelateTo':
					updateRelatedCache(fields);
					_relationHandlers(_streamUpdatedRelateToHandlers, msg, stream, fields);
					break;
				default:
					break;
				}

				function _relationHandlers(handlers, msg, stream, fields) {
					Q.each([msg.publisherId, ''], function (ordinal, publisherId) {
						Q.each([msg.streamName, ''], function (ordinal, streamName) {
							if (handlers[publisherId] && handlers[publisherId][streamName]) {
								Q.handle(
									handlers[publisherId][streamName],
									stream,
									[msg, fields]
								);
							}
						});
					});
				}

				function updateMessageCache() {
					Streams.get.cache.each([msg.publisherId, msg.streamName], function (k, v) {
						var stream = (v && !v.params[0]) ? v.subject : null;
						if (!stream) {
							return;
						}
						var args = JSON.parse(k), extra = args[2];
						if (extra && extra.messages) {
							Streams.get.cache.remove(k);
						}
					});
					Message.get.cache.each([msg.publisherId, msg.streamName], function (k, v) {
						var args = JSON.parse(k), ordinal = args[2];
						if (ordinal && ordinal.max && ordinal.max < 0) {
							Message.get.cache.remove(k); 
						}
					});
				}

				function updateParticipantCache(incrementCount) {
					Streams.get.cache.each([msg.publisherId, msg.streamName], function (k, v) {
						var stream = (v && !v.params[0]) ? v.subject : null;
						if (!stream) {
							return;
						}
						if ('participantCount' in stream.fields) {
							stream.fields.participantCount += incrementCount; // increment participant count
						}
						var args = JSON.parse(k), extra = args[2];
						if (extra && extra.participants) {
							Streams.get.cache.remove(k);
						}
					});
					Participant.get.cache.each([msg.publisherId, msg.streamName], function (k, v) {
						if (extra && extra.offset < 0) {
							Participant.get.cache.remove(k); // later, we can refactor this to insert the correct data into the cache
						}
					});
				}

				function updateRelatedCache(fields) {
					Streams.related.cache.each([msg.publisherId, msg.streamName, fields.type], function (k, v) {
						Streams.related.cache.remove(k);
					});
				}
			});
		});
	}, 'Streams');
	
	Q.beforeActivate.set(function (elem) {
		// Every time before anything is activated,
		// process any preloaded streams data we find
		Q.each(Stream.preloaded, function (i, fields) {
			_constructStream(fields, {}, null, true);
		});
		Stream.preloaded = null;
	}, 'Streams');
	
	Q.Users.onLogin.set(_clearCaches, 'Streams');
	Q.Users.onLogout.set(_clearCaches, 'Streams');
	Q.addEventListener(window, Streams.refresh.options.duringEvents, Streams.refresh);
	_scheduleUpdate();

}, 'Streams');

Q.Tool.beforeRemove.set(function (tool) {
	Streams.release(tool);
}, 'Streams');

function _clearCaches() {
	// Clear caches so permissions can be recalculated as various objects are fetched
	Streams.get.cache.clear();
	Streams.related.cache.clear();
	Streams.getParticipating.cache.clear();
	Message.get.cache.clear();
	Participant.get.cache.clear();
	Avatar.get.cache.clear();
}

function _scheduleUpdate() {
	var ms = 1000;
	if (_scheduleUpdate.timeout) {
		clearTimeout(_scheduleUpdate.timeout);
	}
	return null;
	_scheduleUpdate.timeout = setTimeout(function () {
		var now = Date.now();
		if (_scheduleUpdate.lastTime !== undefined
		&& now - _scheduleUpdate.lastTime - ms > _scheduleUpdate.delay) {
			// The timer was delayed for a whole second. Something might have changed.
			// Streams.refresh.minSeconds should prevent the update happening too frequently
			Streams.refresh();
		}
		_scheduleUpdate.lastTime = now;
		setTimeout(_scheduleUpdate, ms);
	}, ms);
}

_scheduleUpdate.delay = 10000;

})(jQuery, Q.plugins.Streams);
