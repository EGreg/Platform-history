/**
 * Autogenerated base class representing stream rows
 * in the Streams database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the Streams/Stream.js file.
 *
 * @module Streams
 */

var Q = require('Q');
var Db = Q.require('Db');
var Streams = Q.require('Streams');
var Row = Q.require('Db/Row');

/**
 * Base class representing 'Stream' rows in the 'Streams' database
 * @namespace Base.Streams
 * @class Stream
 * @extends Db.Row
 * @constructor
 * @param {object} [fields={}] The fields values to initialize table row as 
 * an associative array of `{column: value}` pairs
 */
function Base (fields) {
	
}

Q.mixin(Base, Row);

/**
 * @property publisherId
 * @type String
 */
/**
 * @property name
 * @type String
 */
/**
 * @property insertedTime
 * @type String|Db.Expression
 */
/**
 * @property updatedTime
 * @type String|Db.Expression
 */
/**
 * @property type
 * @type String
 */
/**
 * @property title
 * @type String
 */
/**
 * @property icon
 * @type String
 */
/**
 * @property content
 * @type String
 */
/**
 * @property attributes
 * @type String
 */
/**
 * @property readLevel
 * @type integer
 */
/**
 * @property writeLevel
 * @type integer
 */
/**
 * @property adminLevel
 * @type integer
 */
/**
 * @property inheritAccess
 * @type String
 */
/**
 * @property messageCount
 * @type integer
 */
/**
 * @property participantCount
 * @type integer
 */
/**
 * @property closedTime
 * @type String|Db.Expression
 */

/**
 * This method calls Db.connect() using information stored in the configuration.
 * If this has already been called, then the same db object is returned.
 * @method db
 * @return {Db} The database connection
 */
Base.db = function () {
	return Streams.db();
};

/**
 * Retrieve the table name to use in SQL statements
 * @method table
 * @param [withoutDbName=false] {boolean} Indicates wheather table name should contain the database name
 * @return {String|Db.Expression} The table name as string optionally without database name if no table sharding was started
 * or Db.Expression object with prefix and database name templates is table was sharded
 */
Base.table = function (withoutDbName) {
	if (Q.Config.get(['Db', 'connections', 'Streams', 'indexes', 'Stream'], false)) {
		return new Db.Expression((withoutDbName ? '' : '{$dbname}.')+'{$prefix}stream');
	} else {
		var conn = Db.getConnection('Streams');
		var prefix = conn.prefix || '';
		var tableName = prefix + 'stream';
		var dbname = Base.table.dbname;
		if (!dbname) {
			var dsn = Db.parseDsnString(conn['dsn']);
			dbname = Base.table.dbname = dsn.dbname;
		}
		return withoutDbName ? tableName : dbname + '.' + tableName;
	}
};

/**
 * The connection name for the class
 * @method connectionName
 * @return {string} The name of the connection
 */
Base.connectionName = function() {
	return 'Streams';
};

/**
 * Create SELECT query to the class table
 * @method SELECT
 * @param fields {object|string} The field values to use in WHERE clauseas as an associative array of `{column: value}` pairs
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.SELECT = function(fields, alias) {
	var q = Base.db().SELECT(fields, Base.table()+(alias ? ' '+alias : ''));
	q.className = 'Streams_Stream';
	return q;
};

/**
 * Create UPDATE query to the class table. Use Db.Query.Mysql.set() method to define SET clause
 * @method UPDATE
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.UPDATE = function(alias) {
	var q = Base.db().UPDATE(Base.table()+(alias ? ' '+alias : ''));
	q.className = 'Streams_Stream';
	return q;
};

/**
 * Create DELETE query to the class table
 * @method DELETE
 * @param [table_using=null] {object} If set, adds a USING clause with this table
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.DELETE = function(table_using, alias) {
	var q = Base.db().DELETE(Base.table()+(alias ? ' '+alias : ''), table_using);
	q.className = 'Streams_Stream';
	return q;
};

/**
 * Create INSERT query to the class table
 * @method INSERT
 * @param {object} [fields={}] The fields as an associative array of `{column: value}` pairs
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.INSERT = function(fields, alias) {
	var q = Base.db().INSERT(Base.table()+(alias ? ' '+alias : ''), fields || {});
	q.className = 'Streams_Stream';
	return q;
};

/**
 * The name of the class
 * @property className
 * @type string
 */
Base.prototype.className = "Streams_Stream";

// Instance methods

/**
 * Create INSERT query to the class table
 * @method INSERT
 * @param {object} [fields={}] The fields as an associative array of `{column: value}` pairs
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.prototype.setUp = function() {
	// does nothing for now
};

/**
 * Create INSERT query to the class table
 * @method INSERT
 * @param {object} [fields={}] The fields as an associative array of `{column: value}` pairs
 * @param [alias=null] {string} Table alias
 * @return {Db.Query.Mysql} The generated query
 */
Base.prototype.db = function () {
	return Base.db();
};

/**
 * Retrieve the table name to use in SQL statements
 * @method table
 * @param [withoutDbName=false] {boolean} Indicates wheather table name should contain the database name
 * @return {String|Db.Expression} The table name as string optionally without database name if no table sharding was started
 * or Db.Expression object with prefix and database name templates is table was sharded
 */
Base.prototype.table = function () {
	return Base.table();
};

/**
 * Retrieves primary key fields names for class table
 * @method primaryKey
 * @return {string[]} An array of field names
 */
Base.prototype.primaryKey = function () {
	return [
		"publisherId",
		"name"
	];
};

/**
 * Retrieves field names for class table
 * @method fieldNames
 * @return {array} An array of field names
 */
Base.prototype.fieldNames = function () {
	return [
		"publisherId",
		"name",
		"insertedTime",
		"updatedTime",
		"type",
		"title",
		"icon",
		"content",
		"attributes",
		"readLevel",
		"writeLevel",
		"adminLevel",
		"inheritAccess",
		"messageCount",
		"participantCount",
		"closedTime"
	];
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_publisherId
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_publisherId = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".publisherId");
		if (typeof value === "string" && value.length > 31)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".publisherId");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_name
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_name = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".name");
		if (typeof value === "string" && value.length > 255)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".name");
		return value;
};

/**
 * Method is called before setting the field
 * @method beforeSet_insertedTime
 * @param {String} value
 * @return {Date|Db.Expression} If 'value' is not Db.Expression the current date is returned
 */
Base.prototype.beforeSet_insertedTime = function (value) {
		if (value instanceof Db.Expression) return value;
		value = (value instanceof Date) ? Base.db().toDateTime(value) : value;
		return value;
};

/**
 * Method is called before setting the field
 * @method beforeSet_updatedTime
 * @param {String} value
 * @return {Date|Db.Expression} If 'value' is not Db.Expression the current date is returned
 */
Base.prototype.beforeSet_updatedTime = function (value) {
		if (!value) return value;
		if (value instanceof Db.Expression) return value;
		value = (value instanceof Date) ? Base.db().toDateTime(value) : value;
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_type
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_type = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".type");
		if (typeof value === "string" && value.length > 63)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".type");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_title
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_title = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".title");
		if (typeof value === "string" && value.length > 255)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".title");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_icon
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_icon = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".icon");
		if (typeof value === "string" && value.length > 255)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".icon");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_content
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_content = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".content");
		if (typeof value === "string" && value.length > 1023)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".content");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_attributes
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_attributes = function (value) {
		if (!value) return value;
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".attributes");
		if (typeof value === "string" && value.length > 1023)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".attributes");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_readLevel
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_readLevel = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".readLevel");
		if (value < -2147483648 || value > 2147483647)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".readLevel");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_writeLevel
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_writeLevel = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".writeLevel");
		if (value < -2147483648 || value > 2147483647)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".writeLevel");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_adminLevel
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_adminLevel = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".adminLevel");
		if (value < -2147483648 || value > 2147483647)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".adminLevel");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_inheritAccess
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_inheritAccess = function (value) {
		if (!value) return value;
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".inheritAccess");
		if (typeof value === "string" && value.length > 255)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".inheritAccess");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_messageCount
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_messageCount = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".messageCount");
		if (value < -2147483648 || value > 2147483647)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".messageCount");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_participantCount
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_participantCount = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".participantCount");
		if (value < -2147483648 || value > 2147483647)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".participantCount");
		return value;
};

/**
 * Method is called before setting the field
 * @method beforeSet_closedTime
 * @param {String} value
 * @return {Date|Db.Expression} If 'value' is not Db.Expression the current date is returned
 */
Base.prototype.beforeSet_closedTime = function (value) {
		if (!value) return value;
		if (value instanceof Db.Expression) return value;
		value = (value instanceof Date) ? Base.db().toDateTime(value) : value;
		return value;
};

/**
 * Check if mandatory fields are set and updates 'magic fields' with appropriate values
 * @method beforeSave
 * @param {array} value The array of fields
 * @return {array}
 * @throws {Error} If mandatory field is not set
 */
Base.prototype.beforeSave = function (value) {
	var fields = ['name','type','title','content'], i;
	if (!this._retrieved) {
		var table = this.table();
		for (i=0; i<fields.length; i++) {
			if (typeof this.fields[fields[i]] === "undefined") {
				throw new Error("the field "+table+"."+fields[i]+" needs a value, because it is NOT NULL, not auto_increment, and lacks a default value.");
			}
		}
	}
	// convention: we'll have updatedTime = insertedTime if just created.
	this['updatedTime'] = value['updatedTime'] = new Db.Expression('CURRENT_TIMESTAMP');
	return value;
};

module.exports = Base;