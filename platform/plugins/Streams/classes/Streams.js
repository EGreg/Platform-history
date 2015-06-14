/*jshint node:true */
/**
 * Streams model
 * @module Streams
 * @main Streams
 */
var Q = require('Q');

/**
 * Static methods for the Streams model
 * @class Streams
 * @extends Base.Streams
 * @static
 */
function Streams() { }
module.exports = Streams;

var Base_Streams = require('Base/Streams');
Q.mixin(Streams, Base_Streams);


/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Streams object.
 
 * * * */

if (!Q.plugins.Users) {
	throw new Q.Exception("Streams: Users plugin is required");
}

Q.makeEventEmitter(Streams);

var util = require('util');
var path = require('path');
var apnagent = require('apnagent');
var Db = Q.require('Db');
var Users = Q.require('Users');

var socketServer = null;

/**
 * Read levels
 * @property READ_LEVEL
 * @type object
 */
/**
 * Can't see the stream
 * @config READ_LEVEL['none']
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can see icon and title
 * @config READ_LEVEL['see']
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can preview stream and its content
 * @config READ_LEVEL['content']
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can see participants in the stream
 * @config READ_LEVEL['participants']
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can play stream in a player
 * @config READ_LEVEL['messages']
 * @type integer
 * @default 40
 * @final
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
/**
 * Cannot affect stream or participants list
 * @config WRITE_LEVEL['none']
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can become a participant, chat, and leave
 * @config WRITE_LEVEL['join']
 * @type integer
 * @default 10
 * @final
 */
/**
 * Can vote for a relation message posted to the stream
 * @config WRITE_LEVEL['vote']
 * @type integer
 * @default 13
 * @final
 */
/**
 * Can post messages, but manager must approve
 * @config WRITE_LEVEL['postPending']
 * @type integer
 * @default 15
 * @final
 */
/**
 * Can post messages which appear immediately
 * @config WRITE_LEVEL['post']
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can post messages relating other streams to this one
 * @config WRITE_LEVEL['relate']
 * @type integer
 * @default 23
 * @final
 */
/**
 * Can post messages requesting edits of stream
 * @config WRITE_LEVEL['suggest']
 * @type integer
 * @default 25
 * @final
 */
/**
 * Can post messages to edit stream content immediately
 * @config WRITE_LEVEL['edit']
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can post a message requesting to close the stream
 * @config WRITE_LEVEL['closePending']
 * @type integer
 * @default 35
 * @final
 */
/**
 * Don't delete, just prevent any new changes to stream
 * however, joining and leaving is still ok
 * @config WRITE_LEVEL['close']
 * @type integer
 * @default 40
 * @final
 */
Streams.WRITE_LEVEL = {
	'none':			0,		// cannot affect stream or participants list
	'join':			10,		// can become a participant, chat, and leave
	'vote':         13,		// can vote for a relation message posted to the stream
	'postPending':	18,		// can post messages which require manager's approval
	'post':			20,		// can post messages which take effect immediately
	'relate':       23,		// can relate other streams to this one
	'relations':    25,		// can update properties of relations directly
	'suggest':      28,		// can suggest edits of stream
	'edit':			30,		// can edit stream content immediately
	'closePending':	35,		// can post a message requesting to close the stream
	'close':		40		// don't delete, just prevent any new changes to stream
							// however, joining and leaving is still ok
};
/**
 * Admin levels
 * @property ADMIN_LEVEL
 * @type object
 */
/**
 * Cannot do anything related to admin / users
 * @config ADMIN_LEVEL['none']
 * @type integer
 * @default 0
 * @final
 */
/**
 * Can post on your stream about participating
 * @config ADMIN_LEVEL['tell']
 * @type integer
 * @default 10
 * @final
 */
/**
 * Able to create invitations for others, granting access
 * @config ADMIN_LEVEL['invite']
 * @type integer
 * @default 20
 * @final
 */
/**
 * Can approve posts and give people any adminLevel < 'manage'
 * @config ADMIN_LEVEL['manage']
 * @type integer
 * @default 30
 * @final
 */
/**
 * Can give people any adminLevel <= 'own'
 * @config ADMIN_LEVEL['own']
 * @type integer
 * @default 40
 * @final
 */
Streams.ADMIN_LEVEL = {
	'none':			0,		// cannot do anything related to admin / users
	'tell':		10,		// can post on your stream about participating
	'invite':		20,		// able to create invitations for others, granting access
	'manage':		30,		// can approve posts and give people any adminLevel < 30
	'own':			40		// can give people any adminLevel <= 40
};
/**
 * Access sources
 * @property ACCESS_SOURCES
 * @type object
 */
/**
 * Public access
 * @config ACCESS_SOURCES['public']
 * @type integer
 * @default 0
 * @final
 */
/**
 * From contact
 * @config ACCESS_SOURCES['contact']
 * @type integer
 * @default 1
 * @final
 */
/**
 * Direct access
 * @config ACCESS_SOURCES['direct']
 * @type integer
 * @default 2
 * @final
 */
/**
 * Inherited public access
 * @config ACCESS_SOURCES['inherited_public']
 * @type integer
 * @default 3
 * @final
 */
/**
 * Inherited from contact
 * @config ACCESS_SOURCES['inherited_contact']
 * @type integer
 * @default 4
 * @final
 */
/**
 * Inherited direct access
 * @config ACCESS_SOURCES['inherited_direct']
 * @type integer
 * @default 5
 * @final
 */
Streams.ACCESS_SOURCES = {
	'public':				0,
	'contact':				1,
	'direct':				2,
	'inherited_public':		3,
	'inherited_contact':	4,
	'inherited_direct':		5
};

Streams.defined = {};

/**
 * Call this function to set a constructor for a stream type
 * @static
 * @method define
 * @param {String} type The type of the message, e.g. "Streams/chat/message"
 * @param {String|Function} ctor Your message's constructor, or path to a javascript file which will define it
 * @param {Object} methods An optional hash of methods
 */
Streams.define = function (type, ctor, methods) {
	if (typeof type === 'object') {
		for (var t in type) {
			Streams.define(t, type[t]);
		}
		return;
	};
	type = Q.normalize(type);
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Streams.Stream.define requires ctor to be a function");
	}
	function CustomStreamConstructor() {
		CustomStreamConstructor.constructors.apply(this, arguments);
		ctor.apply(this, arguments);
	}
	Q.mixin(CustomStreamConstructor, Streams.Stream);
	Q.extend(CustomStreamConstructor.prototype, methods);	
	return Streams.defined[type] = CustomStreamConstructor;
};

/**
 * Start internal listener for Streams plugin. Accepts messages such as<br/>
 * "Streams/Stream/join",
 * "Streams/Stream/leave",
 * "Streams/Stream/create",
 * "Streams/Stream/remove",
 * "Streams/Message/post",
 * "Streams/Message/postMessages",
 * "Streams/Stream/invite"
 * @method listen
 * @static
 * @param {object} options={}
 *  So far no options are implemented.
 */
var _closedSessions = {};
Streams.listen = function (options) {

	// Start internal server
	var server = Q.listen();

	var base_url = Q.Config.get(['Q', 'web', 'appRootUrl'], false);
	if (!base_url) throw new Error("Config path 'Q/web/appRootUrl' requires a value");
	base_url = base_url + Q.Config.get(['Q', 'web', 'controllerSuffix'], '');

	// set up ios push notification agent
	var appName = Q.Config.get(["Q", "app"], "Q");
	if (Q.Config.get([appName, "cordova", "platform"], []).indexOf("ios") >= 0) {
		var agent = new apnagent.Agent(), feedback = new apnagent.Feedback();
		var mode = Q.Config.get([appName, "cordova", "ios", "mode"], "development");
		agent.set('pfx file', path.join(Q.app.CONFIG_DIR, "ios", mode, 'apn-cert.p12'));
		feedback.set('pfx file', path.join(Q.app.CONFIG_DIR, "ios", mode, 'apn-cert.p12'));
		if (mode === "development") { agent.enable('sandbox'); feedback.enable('sandbox'); }
		agent.connect(function (err) {
			if (err) throw new Q.Exception("Streams.listen: APN error '"+err.message+"'");
			Q.log('APN agent is running in %s mode', mode);
			server.attached.apn = agent;
		});
		agent.on('message:error', function(err) {
			Q.log('APN message error: '+err.message);
		});
		agent.on('gateway:error', function(err) {
			Q.log('APN gateway error: '+err.message);
		});
		feedback.connect(function (err) {
			if (err) throw new Q.Exception("Streams.listen: APN Feedback error '"+err.message+"'");
			Q.log('APN feedback is running in %s mode', mode);
			server.attached.feedback = feedback;
		});
		feedback.use(function (device, ts, next) {
			if (!device || !ts) return setTimeout(next, 300);
			new Users.Device({ platform: 'ios', deviceId: device.toString() }).retrieve(function (err, dev) {
				setTimeout(next, 300);
				if (err) return Q.log("Error retrieving device '"+device+"'");
				if (!dev.length) return;
				var i, t, d;
				for (i=0; i<dev.length; i++) {
					d = dev[i];
					t = new Date(d.fields.updatedTime);
					if (ts.getTime() < t.getTime()) return; // both should be Date objects
					this.remove(function(err) {
						Streams.Participant.subscribe(d.fields.userId, d.fields.userId, 'Streams/invited');
						if (err) return Q.log("Error removing device '"+device+"'");
						Q.log('APN feedback: device %s has been removed', device.toString());
					});
				}
			});
		});
	}

	function _updateBadge (badge, token) {
		var server = Q.listen(), apn = server.attached.apn;
		if (!apn) return;
		apn.createMessage().device(token).badge(badge).send(function (err) {
			if (err) {
			    Q.log("Error sending push notification: "+err.message);
		    }
		});
		// TODO: process android!!!
	}

	// Handle internal requests if Q.listen() was ever called
	server.attached.express.post('/Q/node', function Streams_request_handler (req, res, next) {
		var parsed = req.body;
		if (!parsed || !parsed['Q/method']) {
			return next();
		}
		var participant, stream, msg, posted, token, k;
		var ssid = parsed["Q.clientId"];
		var stream = parsed.stream
			&& Streams.Stream.construct(JSON.parse(parsed.stream));
		switch (parsed['Q/method']) {
			case 'Users/device':
				if (!(token = parsed.deviceId)) break;
				Streams.Participant.unsubscribe(parsed.userId, parsed.userId, 'Streams/invited');
				var badge = Streams.pushNotification.badge ? Streams.pushNotification.badge(parsed.userId, 'login', null, function(b) { _updateBadge(b, token); }) : 0;
				if (badge !== undefined) _updateBadge(badge, token);
				break;
			case 'Users/logout':
				var uid = parsed.userId, sid = parsed.sessionId;
				if (uid && sid) {
					if (!_closedSessions[uid]) {
						_closedSessions[uid] = [];
					}
					_closedSessions[uid].push(sid);
				}
				token = parsed.deviceId;
				if (token) {
					_updateBadge(0, token);
					Streams.Participant.subscribe(uid, uid, 'Streams/invited');
				}
				break;
			case 'Streams/Stream/join':
				participant = new Streams.Participant(JSON.parse(parsed.participant));
				participant.fillMagicFields();
				uid = participant.userId;
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/join {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '"}'
					);
				}
				// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.fields.publisherId, stream.fields.name);
				// inform user's clients about change
				Streams.emitToUser(uid, 'join', participant);
				stream.incParticipants(function () {
					Streams.Stream.emit('join', stream, uid, ssid);
				});
				break;
			case 'Streams/Stream/visit':
				participant = JSON.parse(parsed.participant);
				uid = participant.userId;
				Streams.Stream.emit('visit', stream, uid, ssid);
				break;
			case 'Streams/Stream/leave':
				participant = new Streams.Participant(JSON.parse(parsed.participant));
				participant.fillMagicFields();
				uid = participant.userId;
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/leave {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '"}'
					);
				}
				// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.fields.publisherId, stream.fields.name);
				// inform user's clients about change
				Streams.emitToUser(uid, 'leave', participant);
				stream.decParticipants(function () {
					Streams.Stream.emit('leave', stream, uid, ssid);
				});
				break;
			case 'Streams/Stream/remove':
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/remove {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '"}'
					);
				}
				// invalidate cache
				stream.messageParticipants('remove', null, {
					publisherId: stream.fields.publisherId, 
					name: stream.fields.name
				});
				Streams.Stream.emit('remove', stream, ssid);
				break;
			case 'Streams/Stream/create':
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/create {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '"}'
					);
				}
				Streams.Stream.emit('create', stream, ssid);
				// no need to notify anyone
				break;
			case 'Streams/Message/post':
				msg = Streams.Message.construct(JSON.parse(parsed.message));
				msg.fillMagicFields();
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Message/post {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '", "msg.type": "' + msg.fields.type
						+ '"}'
					);
				}
				Streams.Stream.emit('post', stream, msg.fields.byUserId, msg, ssid);
				break;
			case 'Streams/Message/postMessages':
				posted = JSON.parse(parsed.posted);
				for (k in posted) {
					msg = Streams.Message.construct(posted[k]);
					msg.fillMagicFields();
					if (Q.Config.get(['Streams', 'logging'], false)) {
						Q.log('Streams.listen: Streams/Message/post {'
							+ '"publisherId": "' + stream.fields.publisherId
							+ '", "name": "' + stream.fields.name
							+ '", "msg.type": "' + msg.fields.type
							+ '"}'
						);
					}
					Streams.Stream.emit('post', stream, msg.fields.byUserId, msg, ssid);
				}
				break;
			case 'Streams/Stream/invite':
				var userIds, invitingUserId, username, appUrl, label,
				    readLevel, writeLevel, adminLevel, displayName, expiry, logKey;
				try {
					userIds = JSON.parse(parsed.userIds);
					invitingUserId = parsed.invitingUserId;
					username = parsed.username;
					appUrl = parsed.appUrl;
					label = parsed.label ? Q.normalize(parsed.label, '_', /[^A-Za-z0-9\/]+/) : null;
					title = parsed.label ? parsed.label: null;
					readLevel = parsed.readLevel && JSON.parse(parsed.readLevel) || null;
					writeLevel = parsed.writeLevel && JSON.parse(parsed.writeLevel) || null;
					adminLevel = parsed.adminLevel && JSON.parse(parsed.adminLevel) || null;
					displayName = parsed.displayName || '';
					expiry = parsed.expiry ? new Date(parsed.expiry*1000) : null;
				} catch (e) {
					return res.send({data: false});
				}
				res.send({data: true});
				if (logKey = Q.Config.get(['Streams', 'logging'], false)) {
					Q.log(
					    'Streams.listen: Streams/Stream/invite {'
						+ '"publisherId": "' + stream.fields.publisherId
						+ '", "name": "' + stream.fields.name
						+ '", "userIds": ' + parsed.userIds
						+ '}',
						logKey
					);
				}

				if (expiry && expiry <= new Date()) {
				    break;
				}
				
				// Create a new label, if necessary
				if (label) {
				    new Users.Label({
				        userId: userId,
				        label: label,
				        title: title
				    }).retrieve(function (err, labels) {
				        if (!labels.length) {
				            this.fields.title = label[0].toUpperCase() + label.substr(1);
				            this.save(persist);
				        } else {
				            persist();
				        }
				    });
				} else {
					persist();
				}
				
				return;
				
				function persist () {
				
					Q.each(userIds, function (i, userId) {
						var token = null;

    				    // TODO: Change this to a getter, so that we can do throttling in case there are too many userIds
						(new Streams.Participant({
							"publisherId": stream.fields.publisherId,
							"streamName": stream.fields.name,
							"userId": userId,
							"state": "participating"
						})).retrieve(_participant);
						
						function _participant(err, rows) {
							if (rows && rows.length) {
								// User is already a participant in the stream.
								return;
							}
							Streams.db().uniqueId(
								Streams.Invite.table(), 'token', _uniqueId, null, 
								{
									length: Q.Config.get(['Streams', 'invites', 'tokens', 'length'], 16),
									characters: Q.Config.get(
									    ['Streams', 'invites', 'tokens', 'characters'],
									    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
									)
								}
							);
						}
						
						function _uniqueId(t) {
							token = t;
							(new Streams.Invited({
								"userId": userId,
								"token": token,
								"state": 'pending'
							})).save(_invited);
						}

						function _invited(err) {
							if (err) {
								Q.log("ERROR: Failed to save Streams.Invited for user '"+userId+"' during invite");
								Q.log(err);
								return;
							}
							// now ready to save invite
							(new Streams.Invite({
								"token": token,
								"userId": userId,
								"publisherId": stream.fields.publisherId,
								"streamName": stream.fields.name,
								"invitingUserId": invitingUserId,
								"displayName": displayName,
								"appUrl": appUrl,
								"readLevel": readLevel,
								"writeLevel": writeLevel,
								"adminLevel": adminLevel,
								"state": 'pending',
								"expireTime": expiry
							})).save(_inviteSaved);
						}

						function _inviteSaved(err) {
							if (err) {
								Q.log("ERROR: Failed to save Streams.Invite for user '"+userId+"' during invite");
								Q.log(err);
								return;
							}
							(new Streams.Participant({
								"publisherId": stream.fields.publisherId,
								"streamName": stream.fields.name,
								"streamType": stream.fields.type,
								"userId": userId,
								"state": "invited",
								"reason": ""
							})).save(true, _participantSaved);
						}

						function _participantSaved(err) {
							if (err) {
								Q.log("ERROR: Failed to save Streams.Participant for user '"+userId+"' during invite");
								Q.log(err);
								return;
							}

						    // Add the users to a label, if any
            				if (label) {
            				    new Users.Contact({
            				        userId: invitingUserId,
                                    label: label,
                                    contactUserId: userId
            				    }).save(true);
            				}
							
        				    // Add contacts.
							// TODO: Implement hooks similar to PHP to update
							// users_avatar table when contacts change.
        				    // NOTE: In the future, we will have to send a distributed message to the new user's node.
							
            				(new Users.Contact({
        				        userId: invitingUserId,
                                label: "Streams/invited/"+stream.fields.type,
                                contactUserId: userId
        				    })).save(true);
							
            				(new Users.Contact({
        				        userId: invitingUserId,
                                label: "Streams/invited",
                                contactUserId: userId
        				    })).save(true);
							     				
            				(new Users.Contact({
        				        userId: userId,
                                label: "Streams/invitedMe/"+stream.fields.type,
                                contactUserId: invitingUserId
        				    })).save(true);
							
            				(new Users.Contact({
        				        userId: userId,
                                label: "Streams/invitedMe",
                                contactUserId: invitingUserId
        				    })).save(true);

							// Everything is saved, now post message and process it
							// Need user's Streams/invited stream to post message
							getInvitedStream(invitingUserId, userId, _stream);
						}

						function _stream(err, invited) {
							if (err) {
								Q.log("ERROR: Failed to get invited stream for user '"+userId+"' during invite");
								Q.log(err);
								return;
							}
							Streams.Stream.emit('invite', invited.getFields(), userId, stream);
							if (!invited.testWriteLevel('post')) {
								Q.log("ERROR: Not authorized to post to invited stream for user '"+userId+"' during invite");
								Q.log(err);
								return;
							}
							var baseUrl = Q.url(Q.Config.get(['Streams', 'invites', 'baseUrl'], "i"));
							var msg = {
								publisherId: invited.fields.publisherId,
								streamName: invited.fields.name,
								byUserId: invitingUserId,
								type: 'Streams/invite',
								sentTime: new Db.Expression("CURRENT_TIMESTAMP"),
								state: 'posted',
								content: (displayName || "Someone") + " invited you to "+baseUrl+"/"+token,
								instructions: JSON.stringify({
									token: token,
									displayName: displayName,
									appUrl: appUrl,
									type: stream.fields.type,
									title: stream.fields.title,
									content: stream.fields.content
								})
							};
							invited.post(msg, function (err) {
								if (err) {
									Q.log("ERROR: Failed to save message for user '"+userId+"' during invite");
									Q.log(err);
								}
							});
						}
					});

			    }
			default:
				break;
		}
		return next();
	});

	Streams.Stream.on('post', function (stream, uid, msg, ssid) {
		if (_messageHandlers[msg.fields.type]) {
			_messageHandlers[msg.fields.type].call(this, msg);
		}
		Streams.Stream.emit('post/'+msg.fields.type, stream, uid, msg);
		stream.messageParticipants('post', msg.fields.byUserId, msg);
//		if (stream && !msg.type.match(/^Streams\//)) {// internal messages of Streams plugin
//			(new Streams.Stream(stream)).incMessages(/* empty callback*/);
//		}
	});

	// Start external socket server
	var pubHost = Q.Config.get(['Streams', 'node', 'host'], Q.Config.get(['Q', 'node', 'host'], null));
	var pubPort = Q.Config.get(['Streams', 'node', 'port'], Q.Config.get(['Q', 'node', 'port'], null));

	if (pubHost === null)
		throw new Q.Exception("Streams: Missing config field: Streams/node/host");
	if (pubPort === null)
		throw new Q.Exception("Streams: Missing config field: Streams/node/port");

	/**
	 * @property socketServer
	 * @type {SocketNamespace}
	 * @private
	 */
	socketServer = Q.Socket.listen({host: pubHost, port: pubPort}).of('/Streams');

	socketServer.on('connection', function(client) {
		console.log("Socket.IO client connected " + client.id);
		/**
		 * Socket connection
		 * @event connection
		 * @param client {Socket}
		 *	The connecting client
		 */
		Streams.emit('connection', client);
	});

};

var timeout = {};
// Connection from socket.io
Streams.on('connection', function(client) {
	if (client.alreadyListening) {
		return;
	}
	client.alreadyListening = true;
	client.on('session', function (sid) {
		Users.userFromSession(sid, function(u) {
			if (!u) {
				// force disconnect
				client.disconnect();
				return;
			}
			
			var userId = u.id;

			if (!Streams.clients[userId]) {
				Streams.clients[userId] = {};
			}

			var connected = Object.keys(Streams.clients[userId]).length;

			client.sessionId = sid;
			client.userId = userId;
			Streams.clients[userId][client.id] = client;
			if (!connected) {
				if (timeout[userId]) {
					clearTimeout(timeout[userId]);
				} else {
					// post "connected" message to Streams/participating stream
					new Streams.Stream({
						publisherId: userId,
						name: 'Streams/participating'
					}).post({
						byUserId: userId,
						type: 'Streams/connected'
					}, function(err) {
						if (err) util.error(err);
						Q.log('User connected: ' + userId);
					});
				}
				delete timeout[userId];
			} else {
			    Q.log('New client connected: ' + userId);
			}
		});
	});
	client.on('disconnect', function(){
		var userId = client.userId, sid = client.sessionId, i;
		if(!userId || !Streams.clients[userId]) return;
		var clients = Streams.clients[userId];
		delete clients[client.id];

		if (!Object.keys(clients).length) {
			timeout[userId] = setTimeout(function () {
				delete timeout[userId];
				// post "disconnected" message to Streams/participating stream
				new Streams.Stream({
					publisherId: userId,
					name: 'Streams/participating'
				}).post({
					byUserId: userId,
					type: 'Streams/disconnected'
				}, function(err) {
					if (err) util.error(err);
					Q.log('User disconnected: ' + userId);
				});
			}, Q.Config.get(["Streams", "socket", "disconnectTimeout"], 1000));
		} else {
			Q.log('Client disconnected: ' + userId);

			// now check if user is still logged in
			if (_closedSessions[userId] && (i = _closedSessions[userId].indexOf(sid) >= 0)) {
				_closedSessions[userId].splice(i, 1);
				for (var cid in clients) {
					if (clients[cid].sessionId === sid) {
						clients[cid].disconnect();
						delete clients[cid];
					}
				}
			}
		}
	});
});

Streams.clients = {};

/**
 * Check if device is online
 * @method isDeviceOnline
 * @static
 * @param userId {string}
 *	The id of the user
 * @param sessionId {?string}
 *	The id of the session associated to some device. Should be taken from Users.Device table
 * @return {boolean}
 */
Streams.isDeviceOnline = function(userId, sessionId) {
	var clients = Streams.clients[userId];
	if (!sessionId) {
	    return !Q.isEmpty(clients);
	}
	return !!(clients && clients[sessionId]);
};

/**
 * Emits an event to user's socket.io clients that are currently connected
 * @method emitToUser
 * @static
 * @param userId {string}
 *	The id of the user
 * @param event {string}
 *	The event name
 * @param data {object}
 *  The data accompanying the event
 * @param {object} excludeSessionIds={}
 *	Optional object whose keys are session ids of clients to skip when emitting event
 */
Streams.emitToUser = function(userId, event, data, excludeSessionIds) {
	var clients = Streams.clients[userId];
	// check if user has at least one client or device active
	if (!clients || !Object.keys(clients).length) return false;
	var k;
	for (k in clients) {
		if (excludeSessionIds && excludeSessionIds[k]) {
			continue;
		}
		clients[k].emit(event, data);
	}
	return true;
};

/**
 * Emits push notification to native client
 * @method pushNotification
 * @static
 * @param userId {string}
 *	The id of the user
 * @param tokens {object}
 *	Arrays of device tokens per platform
 * @param event {string}
 *	The event name
 * @param data {object}
 *  The data accompanying the event
 */
Streams.pushNotification = function (userId, tokens, event, data) {
	var server = Q.listen(), apn = server.attached.apn;
	var ios = tokens.ios, i;
	if (!apn || !ios) return; // nothing works!!!
	function _onError (err) {
		if (!err) return;
		Q.log("Error sending push notification: "+err.message);
	}
	for (i=0; i<ios.length; i++) {
		(function (token) {
			var p = new Q.Pipe(['badge', 'alert', 'sound', 'data'], function (params) {
				if (!params.badge.length && !params.alert.length && !params.sound.length && !params.data.length) return;
				var message = apn.createMessage().device(token);
				if (params.badge[0] !== undefined) message.badge(params.badge[0]);
				if (params.alert[0]) message.alert('body', params.alert[0]);
				if (params.sound[0]) message.sound(params.sound[0]);
				if (params.data[0]) message.set({ data: params.data[0] });
				message.send(_onError);
				return true;
			});
			var badge = Streams.pushNotification.badge ? Streams.pushNotification.badge(userId, event, data, p.fill('badge')) : 0;
			var alert = Streams.pushNotification.alert ? Streams.pushNotification.alert(userId, event, data, p.fill('alert')) : undefined;
			var sound = Streams.pushNotification.sound ? Streams.pushNotification.sound(userId, event, data, p.fill('sound')) : undefined;
			var edata = Streams.pushNotification.data ? Streams.pushNotification.data(userId, event, data, p.fill('data')) : undefined;

			if (badge !== undefined) p.fill('badge')(badge);
			if (alert !== undefined) p.fill('alert')(alert);
			if (sound !== undefined) p.fill('sound')(sound);
			if (edata !== undefined) p.fill('data')(edata);
		})(ios[i]);
	}
	// TODO: process android!!!
};

/**
 * Default badge handler which counts fresh events in all streams where user participates
 * Method may return some value or, if return `undefined` callback must be called
 * To change functionality override it in application script
 * @method pushNotification.badge
 * @static
 * @param userId {string}
 * @param event {string}
 * @param data {object}
 * @param callback {?function}
 */
Streams.pushNotification.badge = function (userId, event, data, callback) {
	var q = Streams.Participating.SELECT('SUM(fresh) fresh').where({userId: userId});
	if (typeof Streams.pushNotification.badge.criteria === "function") q = Streams.pushNotification.badge.criteria(q);
	q.execute(function (err, res) {
		if (err || !res.length) Q.log("Error counting fresh fields");
		var fresh = parseInt(res[0].fresh, 10);
		callback(isNaN(fresh) ? 0 : fresh);
	}, {plain: true});
};

/**
 * Sound handler must define some sound to play with native notification.
 * By default not defined so no sound will be played.
 * Define this method in application script
 * Method may return some value or, if return `undefined` callback must be called.
 * Use "default" to play default system sound
 * @method pushNotification.sound
 * @static
 * @param userId {string}
 * @param event {string}
 * @param data {object}
 * @param callback {?function}
 */

/**
 * Alert handler must define some alert text to show in native notification.
 * By default not defined so no alert will be issued.
 * Define this method in application script
 * Method may return some value or, if return `undefined` callback must be called
 * @method pushNotification.alert
 * @static
 * @param userId {string}
 * @param event {string}
 * @param data {object}
 * @param callback {?function}
 */

/**
 * Data handler must define some data to send with native notification.
 * By default not defined so no data will be sent.
 * Define this method in application script
 * Method may return some value or, if return `undefined` callback must be called
 * @method pushNotification.data
 * @static
 * @param userId {string}
 * @param event {string}
 * @param data {object}
 * @param callback {?function}
 */

/**
 * Retrieve stream participants
 * @method getParticipants
 * @static
 * @param publisherId {string}
 *	The publisher Id
 * @param streamName {string}
 *	The name of the stream
 * @param callback=null {function}
 *	Callback receives a map of {userId: participant} pairs
 */
Streams.getParticipants = function(publisherId, streamName, callback) {
	var args = arguments;
	if (!callback) return;
	Streams.Participant.SELECT('*').where({
		publisherId: publisherId,
		streamName: streamName
	}).execute(function (err, rows) {
		if (err) {
			Q.log(err);
//			Streams.getParticipants.forget(publisherId, streamName);
			callback({});
		} else {
			var result = {};
			for (var i=0; i<rows.length; ++i) {
				result [ rows[i].fields.userId ] = rows[i];
			}
			callback(result);
		}
	});
};

/**
 * Retrieve stream with calculated access rights
 * @method fetch
 * @static
 * @param asUserId {String}
 *	The user id to calculate access rights
 * @param publisherId {String}
 *	The publisher Id
 * @param streamName {String|Array|Db.Range}
 *	The name of the stream, or an array of names, or a Db.Range
 * @param callback=null {function}
 *	Callback receives the error (if any) and stream as parameters
 */
Streams.fetch = function (asUserId, publisherId, streamName, callback) {
	if (!callback) return;
	if (!publisherId || !streamName) callback(new Error("Wrong arguments"));
	if (streamName.charAt(streamName.length-1) === '/') {
		streamName = new Db.Range(streamName, true, false, streamName.slice(0, -1)+'0');
	}
	Streams.Stream.SELECT('*')
	.where({publisherId: publisherId, name: streamName})
	.execute(function(err, res) {
		if (err) {
		    return callback(err);
		}
		if (!res.length) {
		    return callback(null, []);
		}
		var p = new Q.Pipe(res.map(function(a) { return a.fields.name; }), function(params, subjects) {
			for (var name in params) {
				if (params[name][0]) {
					callback(params[name][0]); // there was an error
					return;
				}
			}
			callback(null, subjects); // success
		});
		for (var i=0; i<res.length; i++) {
			res[i].calculateAccess(asUserId, p.fill(res[i].fields.name));
		}
	});
};

/**
 * Retrieve stream with calculated access rights
 * @method fetchOne
 * @static
 * @param asUserId {String}
 *	The user id to calculate access rights
 * @param publisherId {String}
 *	The publisher Id
 * @param streamName {String}
 *	The name of the stream
 * @param callback=null {function}
 *	Callback receives the error (if any) and stream as parameters
 */
Streams.fetchOne = function (asUserId, publisherId, streamName, callback) {
	if (!callback) return;
	if (!publisherId || !streamName) callback(new Error("Wrong arguments"));
	if (streamName.charAt(streamName.length-1) === '/') {
		streamName = new Db.Range(streamName, true, false, streamName.slice(0, -1)+'0');
	}
	Streams.Stream.SELECT('*')
	.where({publisherId: publisherId, name: streamName})
	.limit(1).execute(function(err, res) {
		if (err) {
		    return callback(err);
		}
		if (!res.length) {
		    callback(null, null);
		}
		res[0].calculateAccess(asUserId, function () {
		    callback(null, res[0])
		});
	});
};

/**
 * Retrieve the user's stream needed to post invite messages
 * If stream does not exist - create it
 * @method getInvitedStream
 * @static
 * @param asUserId {string}
 *	The user id of inviting user
 * @param forUserId {string}
 *	User id for which stream is created
 * @param callback=null {function}
 *	Callback receives the error (if any) and stream as parameters
 */
function getInvitedStream (asUserId, forUserId, callback) {
	if (!callback) return;
	Streams.fetch(asUserId, forUserId, 'Streams/invited', function (err, streams) {
		if (err) return callback(err);
		if (!streams['Streams/invited']) {
			// stream does not exist yet
			(new Streams.Stream({
				publisherId: forUserId,
				name: 'Streams/invited',
				type: 'Streams/invited',
				title: 'Streams/invited',
				content: 'Post message here when user is invited to some stream',
				readLevel: Streams.READ_LEVEL['none'],
				writeLevel: Streams.WRITE_LEVEL['post'], // anyone can post messages
				adminLevel: Streams.ADMIN_LEVEL['none']
			})).save(function (err) {
				var stream = this;
				if (err) return callback(err);
				this.calculateAccess(asUserId, function(err) {
					if (err) return callback(err);
					this.subscribe({userId: forUserId}, function (err) {
						if (err) return callback(err);
						callback(null, stream);
					});
				});
			});
		} else {
			callback(null, streams['Streams/invited']);
		}
	});
}

/**
 * Register a message handler
 * @method messageHandler
 * @static
 * @param msgType {string}
 *	Type of stream
 * @param callback {function}
 *	The handler for stream messages
 */
Streams.messageHandler = function(msgType, callback) {
	if (callback === undefined) {
		return _messageHandlers[msgType];
	}
	if (typeof callback !== 'function') {
		throw new Q.Exception("Streams: callback passed to messageHandler is not a function");
	}
	_messageHandlers[msgType] = callback;
};

/**
 * @property _messageHandlers
 * @type object
 * @private
 */
var _messageHandlers = {};
/**
 * @property _streams
 * @type object
 * @private
 */
var _streams = {};

/* * * */