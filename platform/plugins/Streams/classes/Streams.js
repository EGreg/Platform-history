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
var Streams = module.exports;
Q.require('Base/Streams').apply(Streams);

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

/**
 * Start internal listener for Streams plugin. Accepts messages such as<br/>
 * "Streams/Stream/join",
 * "Streams/Stream/leave",
 * "Streams/Stream/create",
 * "Streams/Stream/remove",
 * "Streams/Message/post",
 * "Streams/Stream/invite"
 * @method listen
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
		var participant, stream, msg, token;
		var ssid = parsed["Q.clientId"];
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
				participant = JSON.parse(parsed.participant);
				stream = JSON.parse(parsed.stream);
				uid = participant.userId;
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/join {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
						+ '"}'
					);
				}
				// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.publisherId, stream.name);
				// inform user's clients about change
				Streams.emitToUser(uid, 'join', Streams.fillMagicFields(participant));
				(new Streams.Stream(stream)).incParticipants(/* empty callback*/);
				Streams.Stream.emit('join', stream, uid, ssid);
				break;
			case 'Streams/Stream/visit':
				participant = JSON.parse(parsed.participant);
				stream = JSON.parse(parsed.stream);
				uid = participant.userId;
				Streams.Stream.emit('visit', stream, uid, ssid);
				break;
			case 'Streams/Stream/leave':
				participant = JSON.parse(parsed.participant);
				stream = JSON.parse(parsed.stream);
				uid = participant.userId;
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/leave {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
						+ '"}'
					);
				}
				// invalidate cache for this stream
//				Streams.getParticipants.forget(stream.publisherId, stream.name);
				// inform user's clients about change
				Streams.emitToUser(uid, 'leave', Streams.fillMagicFields(participant));
				(new Streams.Stream(stream)).decParticipants(/* empty callback*/);
				Streams.Stream.emit('leave', stream, uid, ssid);
				break;
			case 'Streams/Stream/remove':
				stream = JSON.parse(parsed.stream);
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/remove {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
						+ '"}'
					);
				}
				// invalidate cache
				(new Streams.Stream(stream)).messageParticipants('remove', null, {publisherId: stream.publisherId, name: stream.name});
				Streams.Stream.emit('remove', stream, ssid);
				break;
			case 'Streams/Stream/create':
				stream = JSON.parse(parsed.stream);
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Stream/create {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
						+ '"}'
					);
				}
				Streams.Stream.emit('create', stream, ssid);
				// no need to notify anyone
				break;
			case 'Streams/Message/post':
				msg = JSON.parse(parsed.message);
				stream = JSON.parse(parsed.stream);
				if (Q.Config.get(['Streams', 'logging'], false)) {
					Q.log('Streams.listen: Streams/Message/post {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
						+ '", "msg.type": "' + msg.type
						+ '"}'
					);
				}
				Streams.Stream.emit('post', stream, msg.byUserId, msg, ssid);
				break;
			case 'Streams/Stream/invite':
				var userIds, invitingUserId, username, appUrl, label,
				    readLevel, writeLevel, adminLevel, displayName, expiry, logKey;
				try {
					userIds = JSON.parse(parsed.userIds);
					invitingUserId = parsed.invitingUserId;
					username = parsed.username;
					appUrl = parsed.appUrl;
					label = parsed.label ? Q.normalize(parsed.label, '_', new RegExp("[^A-Za-z0-9\/]+")) : null;
					title = parsed.label ? parsed.label: null;
					readLevel = parsed.readLevel && JSON.parse(parsed.readLevel) || null;
					writeLevel = parsed.writeLevel && JSON.parse(parsed.writeLevel) || null;
					adminLevel = parsed.adminLevel && JSON.parse(parsed.adminLevel) || null;
					displayName = parsed.displayName || '';
					expiry = parsed.expiry ? new Date(parsed.expiry*1000) : null;
					stream = JSON.parse(parsed.stream);
				} catch (e) {
					return res.send({data: false});
				}
				res.send({data: true});
				if (logKey = Q.Config.get(['Streams', 'logging'], false)) {
					Q.log(
					    'Streams.listen: Streams/Stream/invite {'
						+ '"publisherId": "' + stream.publisherId
						+ '", "name": "' + stream.name
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
    				    // TODO: Change this to a getter, so that we can do throttling in case there are too many userIds
						(new Streams.Participant({
							"publisherId": stream.publisherId,
							"streamName": stream.name,
							"userId": userId,
							"state": "participating"
						})).retrieve(function (err, rows) {
							if (rows && rows.length) {
								// User is already a participant in the stream.
								return;
							}
							Streams.db().uniqueId(Streams.Invite.table(), 'token', function(token) {
								(new Streams.Invited({
									"userId": userId,
									"token": token,
									"state": 'pending'
								})).save(function(err) {
									if (err) {
										Q.log("ERROR: Failed to save Streams.Invited for user '"+userId+"' during invite");
										Q.log(err);
										return;
									}
									// now ready to save invite
									(new Streams.Invite({
										"token": token,
										"userId": userId,
										"publisherId": stream.publisherId,
										"streamName": stream.name,
										"invitingUserId": invitingUserId,
										"displayName": displayName,
										"appUrl": appUrl,
										"readLevel": readLevel,
										"writeLevel": writeLevel,
										"adminLevel": adminLevel,
										"state": 'pending',
										"expireTime": expiry
									})).save(function (err) {
										if (err) {
											Q.log("ERROR: Failed to save Streams.Invite for user '"+userId+"' during invite");
											Q.log(err);
											return;
										}
										(new Streams.Participant({
											"publisherId": stream.publisherId,
											"streamName": stream.name,
											"streamType": stream.type,
											"userId": userId,
											"state": "invited",
											"reason": ""
										})).save(true, function (err) {
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
                            				
                            				// Add Streams/invited/$type label
                            				(new Users.Contact({
                        				        userId: invitingUserId,
                                                label: "Streams/invited/"+stream.type,
                                                contactUserId: userId
                        				    })).save(true);             
                        				    
                        				    // Add Streams/invitedBy/$type label
                        				    // NOTE: In the future, we will have to send a distributed message to the new user's node                  				
                            				(new Users.Contact({
                        				        userId: userId,
                                                label: "Streams/invitedBy/"+stream.type,
                                                contactUserId: invitingUserId
                        				    })).save(true);
											
											// Everything is saved, now post message and process it
											// Need user's Streams/invited stream to post message
											getInvitedStream(invitingUserId, userId, function (err, invited) {
												if (err) {
													Q.log("ERROR: Failed to get invited stream for user '"+userId+"' during invite");
													Q.log(err);
													return;
												}
												Streams.Stream.emit('invite', invited.toArray(), userId, stream);
												if (!invited.testWriteLevel('post')) {
													Q.log("ERROR: Not authorized to post to invited stream for user '"+userId+"' during invite");
													Q.log(err);
													return;
												}
												var baseUrl = Q.url(Q.Config.get(['Streams', 'invites', 'baseUrl'], "i/"));
												invited.post({
													publisherId: invited.fields.publisherId,
													streamName: invited.fields.name,
													byUserId: invitingUserId,
													type: 'Streams/invite',
													sentTime: new Db.Expression("CURRENT_TIMESTAMP"),
													state: 'posted',
													content: (displayName || "Someone") + " invited you to "+baseUrl+"/"+token,
													instructions: JSON.stringify({
														token: token,
														type: stream.type.split('/').join('_'),
														displayName: displayName,
														title: stream.title,
														content: stream.content,
														appUrl: appUrl
													})
												}, function (err) {
													if (err) {
														Q.log("ERROR: Failed to save message for user '"+userId+"' during invite");
														Q.log(err);
													}
												});
											});
										});
									});
								});
							}, 
							null, 
							{
								length: Q.Config.get(['Streams', 'invites', 'tokens', 'length'], 16),
								characters: Q.Config.get(
								    ['Streams', 'invites', 'tokens', 'characters'],
								    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
								)
							});
						});
					});

			    }
			default:
				break;
		}
		return next();
	});

    Streams.fillMagicFields = function (obj) {
		var toFill = [];
		for (var i=0, l=toFill.length; i<l; ++i) {
			var f = toFill[i];
			if (!obj[f] || obj[f].expression === "CURRENT_TIMESTAMP") {
				toFill.push(f);
			}
		}
		if (!toFill.length) {
			return obj;
		}
		Streams.db().getCurrentTimestamp(function (err, timestamp) {
			for (var i=0, l=toFill.length; i<l; ++i) {
				obj[toFill[i]] = timestamp;
			}
		});
		return obj;
	};

	Streams.Stream.on('post', function (stream, uid, msg, ssid) {
		msg = Streams.fillMagicFields(msg);
		if (_messageHandlers[msg.type]) {
			_messageHandlers[msg.type].call(this, msg);
		}
		Streams.Stream.emit('post/'+msg.type, stream, uid, msg);
		(new Streams.Stream(stream)).messageParticipants('post', msg.byUserId, msg);
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
 * @param userId {string}
 *	The id of the user
 * @param sessionId {?string}
 *	The id of the session associated to some device. Should be taken from Users.Device table
 * @return {boolean}
 */
Streams.isDeviceOnline = function(userId, sessionId) {
	var clients = Streams.clients[userId];
	if (!sessionId) {
	    return !!(clients && Object.keys(clients).length);
	}
	return !!(clients && clients[sessionId]);
};

/**
 * Emits an event to user's socket.io clients that are currently connected
 * @method emitToUser
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
 * @param userId {string}
 * @param event {string}
 * @param data {object}
 * @param callback {?function}
 */

/**
 * Retrieve stream participants
 * @method getParticipants
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
 * @method fetch
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