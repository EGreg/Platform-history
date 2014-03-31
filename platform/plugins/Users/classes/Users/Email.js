/**
 * Class representing email rows.
 *
 * This description should be revised and expanded.
 *
 * @module Users
 */
var Q = require('Q');
var Db = Q.require('Db');

/**
 * Class representing 'Email' rows in the 'Users' database
 * @namespace Users
 * @class Email
 * @extends Base.Users.Email
 * @constructor
 * @param fields {object} The fields values to initialize table row as
 * an associative array of `{column: value}` pairs
 */
function Users_Email (fields) {

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
	
	/**
	 * Send e-mail message
	 * @method sendMessage
	 * @param {string} subject
	 *  The subject. May contain variable references to members
	 *  of the $fields array.
	 * @param {string} view
	 *  The name of a view for the body. Fields are passed to it.
	 * @param {array} fields={}
	 *  Optional. The fields referenced in the subject and/or view
	 * @param {array} $options={}
	 *  Optional. Array of options. Can include:<br/>
	 *  "html" => Defaults to false. Whether to send as HTML email.<br/>
	 *  "from" => An array of emailAddress, human_readable_name<br/>
	 * @param {function} callback Receives error and response objects after complete
	 */
	this.sendMessage = function(subject, view, fields, options, callback) {
		if (typeof fields === 'function') {
			callback = fields;
			options = fields = {};
		} else if (typeof options === "function") {
			callback = options;
			options = {};
		}
		Q.Utils.sendEmail(this.address, subject, view, fields, options, callback);
	};

	/* * * */
}

Q.mixin(Users_Email, Q.require('Base/Users/Email'));

module.exports = Users_Email;