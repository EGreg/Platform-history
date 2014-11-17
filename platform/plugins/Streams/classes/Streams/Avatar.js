/**
 * Class representing avatar rows.
 *
 * @module Streams
 */
var Q = require('Q');
var Streams = require('Streams');
var Db = Q.require('Db');

/**
 * Class representing 'Avatar' rows in the 'Streams' database
 * <br/>stored primarily on publisherId's Q server
 * @namespace Streams
 * @class Avatar
 * @extends Base.Streams.Avatar
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Streams_Avatar (fields) {

	// Run constructors of mixed in objects
	this.constructors.apply(this, arguments);

	/*
	 * Add any privileged methods to the model class here.
	 * Public methods should probably be added further below.
	 * If file 'Avatar.js.inc' exists, its content is included
	 * * * */

	/* * * */
}

Q.mixin(Streams_Avatar, Q.require('Base/Streams/Avatar'));

/**
 * Get the display name from a Streams.Avatar
 * 
 * @method displayName
 * @param {Object} [options] A bunch of options which can include:
 *   @param {String} [options.short] Try to show the first name only
 *   @param {String} [options.short] Try to show the first name only
 * @return {String}
 */
Streams_Avatar.prototype.displayName = function _Avatar_prototype_displayName (options) {
	var fn = this.fields.firstName;
	var ln = this.fields.lastName;
	var u = this.fields.username;
	var p1 = null, p2 = null;
	if (options && options['short']) {
		p1 = fn || u;
		p2 = null;
	} else if (fn && ln) {
		p1 = fn;
		p2 = ln;
	} else if (fn && !ln) {
		p1 = fn;
		p2 = u || null;
	} else if (!fn && !ln) {
		p1 = u;
		p2 = ln;
	} else {
		p1 = u || null;
		p2 = null;
	}
	if (options && options['html']) {
		p1 = p1 && '<span class="Streams_firstName">'+p1.encodeHTML()+'</span>';
		p2 = p2 && '<span class="Streams_lastName">'+p2.encodeHTML()+'</span>';
	}
	return (p1 === null) ? '' : ((p2 === null) ? p1 : p1 + ' ' + p2);
};

/**
 * Get plain object representing the row, as well as displayName and shortName
 * @method toArray
 */
Streams_Avatar.prototype.toArray = function () {
	var res = Db.Row.prototype.toArray.call(this);
	res.displayName = this.displayName();
	res.shortName = this.displayName({short: true});
	return res;
};

/**
 * Fetches a Streams.Avatar object.
 * The Streams plugin maintains an avatar for every user that authenticates the app.
 * 
 * @static
 * @method fetch
 * @param {String} toUserId The user to which the avatar will be displayed
 * @param {String} publisherId The user publishing the avatar
 * @param {Function} callback Receives (err, avatar)
 */
Streams_Avatar.fetch = function (toUserId, publisherId, callback) {
	Streams.Avatar.SELECT('*').where({
		toUserId: ['', toUserId],
		publisherId: publisherId
	}).execute(function (err, results) {
		if (err) {
			return callback.apply(this, arguments);
		}
		var avatar = null;
		if (results.length) {
			var index = (results.length == 1 || results[0].toUserId) ? 0 : 1;
			avatar = results[index];
		}
		callback(null, avatar);
	});
};

 /**
  * The setUp() method is called the first time
  * an object of this class is constructed.
  * @method setUp
  */
 Streams_Avatar.prototype.setUp = function () {
 	// put any code here
 	// overrides the Base class
 };

module.exports = Streams_Avatar;