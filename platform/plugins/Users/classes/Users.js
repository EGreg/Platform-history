/*jshint node:true */
/**
 * Users model
 * @module Users
 * @main Users
 */
var Q = require('Q');

/**
 * Static methods for the Users model
 * @class Users
 * @extends Base.Users
 * @static
 */
function Users() { }
module.exports = Users;

var Base_Users = require('Base/Users');
Q.mixin(Users, Base_Users);

/*
 * This is where you would place all the static methods for the models,
 * the ones that don't strongly pertain to a particular row or table.
 * Just assign them as methods of the Users object.
 
 * * * */

var internalServer = null;
var db = Q.require('Db').connect('Users');
var querystring = require('querystring');
var util = require('util');

/**
 * Store user sessions
 * @property sessions
 * @type {object}
 */
Users.sessions = {};
/**
 * Store clients
 * @property clients
 * @type {object}
 */ 
Users.clients = {};

/**
 * Gets a user (from database if needed) associated with sessionId and passes it to callback.
 * @method userFromSession
 * @param sessionId {string}
 *	User's session Id
 * @param callback {function}
 *  Passes a Users.User object, or null if the the user wasn't found
 */
Users.userFromSession = function (sessionId, callback) {
	if (Users.sessions[sessionId]) {
		var user = Q.getObject([sessionId, 'Users', 'loggedInUser'], Users.sessions) || null;
		callback && callback(user);
	} else {
		Users.Session.SELECT('*').where({
			id: sessionId
		}).execute(function(err, results){
			if (!results || results.length === 0) {
				callback(null);
			} else {
				if (results[0].fields.content === undefined) {
					Q.log(err, results);
					throw new Q.Error("Users.userFromSession session.fields.content is undefined");
				}
				var sess = JSON.parse(results[0].fields.content);
				
				if (!Q.isSet(sess, ['Users', 'loggedInUser'])) {
					callback(null);
				} else {
					Users.sessions[sessionId] = { Users: sess.Users };
					callback(Users.sessions[sessionId].Users.loggedInUser);
				}
			}
		});
	}
};

/**
 * Gets an array of user's device tokens associated with userId and passes it to callback.
 * Data is filtered for platforms listed in config array `{app}/cordova/platform` or `Q/cordova/platform`
 * @method tokensForUser
 * @param userId {string}
 *	User Id
 * @param callback {function}
 *  Passes arrays of device ids per platform and array of device sessions
 */
Users.tokensForUser = function (userId, callback) {
	var self = this,
	    app = Q.Config.get(["Q", "app"], "Q"),
	    platforms = Q.Config.get([app, "cordova", "platform"], []);
	Users.Device.SELECT('*').where({
		userId: userId,
		platform: platforms
	}).execute(function(err, res) {
		if (err) return;
		var tokens = {}, sessions = [], i, platform;
		for(i=0; i<res.length; i++) {
			platform = res[i].fields.platform;
			if (!tokens[platform]) {
			    tokens[platform] = [];
			}
			tokens[platform].push(res[i].fields.deviceId);
			sessions.push(res[i].fields.sessionId);
		}
		callback.call(self, tokens, sessions);
	});
};

/**
 * Start internal listener for Users plugin and open socket<br/>
 * Accepts "Users/session" message
 * @method listen
 * @param {object} options={}
 *  So far no options are implemented.
 */
Users.listen = function (options) {

	// Start internal server
	var internalServer = Q.listen();
    internalServer.attached.express.post('/Q/node', internalServerHandler);

};

function internalServerHandler(req, res, next) {
	var parsed = req.body;
    if (!parsed || !parsed['Q/method']) {
		return next();
	}
    switch (parsed['Q/method']) {
		case 'Users/session':
            var sid = parsed.sessionId;
            var content = parsed.content ? JSON.parse(parsed.content) : null;
			if (content !== null) {
				util.log((Users.sessions[sid] ? "Update" : "New") + " session from PHP: " + sid);
				Users.sessions[sid] = content;
			} else {
				delete Users.sessions[sid];
				util.log("Deleted session from PHP: " + sid);
			}
			break;
		case 'Users/sendMessage':
			/*
			 * Required: view, emailAddress or mobile number
			 * Optional: delay, subject, fields, options
			 */
			function _send() {
				var options = Q.extend({isSource: true}, parsed.options);
				if (parsed.emailAddress) {
					Q.Utils.sendEmail(
						parsed.emailAddress,
						parsed.subject,
						parsed.body,
						{},
						options,
						_callback
					);					
				} else if (parsed.mobileNumber) {
					Q.Utils.sendSMS(
						parsed.mobileNumber,
						parsed.body,
						{},
						options,
						_callback
					);
				}
				function _callback() {
					// Message sent successfully
				}
			}
			if (parsed.delay) {
				setTimeout(_send, parsed.delay);
			} else {
				_send();
			}
			break;
		default:
			break;
	}
	return next();
}

/* * * */
