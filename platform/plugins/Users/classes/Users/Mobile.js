/**
 * Class representing mobile rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Mobile' rows in the 'Users' database
 * @namespace Users
 * @class Mobile
 * @extends Base.Users.Mobile
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Mobile (fields) {

	// Run constructors of mixed in objects
	this.constructors.apply(this, arguments);

	/*
	 * Add any other methods to the model class by assigning them to this.
	 
	 * * * */

	/* * * */
}

Q.mixin(Users_Mobile, Q.require('Base/Users/Mobile'));

/**
 * @method sendMessage
 * @param {string} view
 *  The name of a view for the message. Fields are passed to this array.
 * @param {array} fields={}
 *  Optional. The fields referenced in the subject and/or view
 * @param {array} options={}
 *  Optional. Array of options. Doesn't include anything yet.
 * @param {function} callback Receives error and response objects after complete
 */
Users_Mobile.prototype.sendMessage = function (view, fields, options, callback) {
	if (typeof fields === 'function') {
		callback = fields;
		options = fields = {};
	} else if (typeof options === "function") {
		callback = options;
		options = {};
	}
	options.html = false; // just to be sure ;)

	var gateways = Q.Config.get(['Users', 'mobile', 'gateways'], {
		'at&t': 'txt.att.net',
		'sprint': 'messaging.sprintpcs.com',
		'verizon': 'vtext.com',
		't-mobile': 'tmomail.net'
	});
	var number = this.number.substr(1), provider, address = [];
	for (provider in gateways) {
		address.push(number+'@'+gateways[provider]);
	}

	if (!Q.Config.get(['Users', 'email', 'smtp'])) {
		Q.log("\nSent mobile message to ".address.join(',').":\n".view);
	} else {
		Q.Utils.sendEmail(address.join(','), null, view, fields, options, callback);
	}
};

/**
 * The setUp() method is called the first time
 * an object of this class is constructed.
 * @method setUp
 */
Users_Mobile.prototype.setUp = function () {
	// put any code here
	// overrides the Base class
};

module.exports = Users_Mobile;