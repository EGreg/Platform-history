/**
 * Autogenerated base class representing total rows
 * in the Users database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the Users/Total.js file.
 *
 * @module Users
 */

var Q = require('Q');
var Db = Q.require('Db');
var Users = Q.require('Users');
var Row = Q.require('Db/Row');

/**
 * Base class representing 'Total' rows in the 'Users' database
 * @namespace Base.Users
 * @class Total
 * @extends Db.Row
 * @constructor
 * @param {object} [fields={}] The fields values to initialize table row as 
 * an associative array of `{column: value}` pairs
 */
function Base (fields) {
	
}

Q.mixin(Base, Row);

/**
 * @property forType
 * @type String
 */
/**
 * @property forId
 * @type String
 */
/**
 * @property voteCount
 * @type integer
 */
/**
 * @property weightTotal
 * @type number
 */
/**
 * @property value
 * @type number
 */
/**
 * @property updatedTime
 * @type String|Db.Expression
 */

/**
 * This method calls Db.connect() using information stored in the configuration.
 * If this has already been called, then the same db object is returned.
 * @method db
 * @return {Db} The database connection
 */
Base.db = function () {
	return Users.db();
};

/**
 * Retrieve the table name to use in SQL statements
 * @method table
 * @param [withoutDbName=false] {boolean} Indicates wheather table name should contain the database name
 * @return {String|Db.Expression} The table name as string optionally without database name if no table sharding was started
 * or Db.Expression object with prefix and database name templates is table was sharded
 */
Base.table = function (withoutDbName) {
	if (Q.Config.get(['Db', 'connections', 'Users', 'indexes', 'Total'], false)) {
		return new Db.Expression((withoutDbName ? '' : '{$dbname}.')+'{$prefix}total');
	} else {
		var conn = Db.getConnection('Users');
		var prefix = conn.prefix || '';
		var tableName = prefix + 'total';
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
	return 'Users';
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
	q.className = 'Users_Total';
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
	q.className = 'Users_Total';
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
	q.className = 'Users_Total';
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
	q.className = 'Users_Total';
	return q;
};

/**
 * The name of the class
 * @property className
 * @type string
 */
Base.prototype.className = "Users_Total";

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
		"forType",
		"forId"
	];
};

/**
 * Retrieves field names for class table
 * @method fieldNames
 * @return {array} An array of field names
 */
Base.prototype.fieldNames = function () {
	return [
		"forType",
		"forId",
		"voteCount",
		"weightTotal",
		"value",
		"updatedTime"
	];
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_forType
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_forType = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".forType");
		if (typeof value === "string" && value.length > 31)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".forType");
		return value;
};

/**
 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
 * Optionally accept numeric value which is converted to string
 * @method beforeSet_forId
 * @param {string} value
 * @return {string} The value
 * @throws {Error} An exception is thrown if 'value' is not string or is exceedingly long
 */
Base.prototype.beforeSet_forId = function (value) {
		if (value instanceof Db.Expression) return value;
		if (typeof value !== "string" && typeof value !== "number")
			throw new Error('Must pass a string to '+this.table()+".forId");
		if (typeof value === "string" && value.length > 255)
			throw new Error('Exceedingly long value being assigned to '+this.table()+".forId");
		return value;
};

/**
 * Method is called before setting the field and verifies if integer value falls within allowed limits
 * @method beforeSet_voteCount
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} An exception is thrown if 'value' is not integer or does not fit in allowed range
 */
Base.prototype.beforeSet_voteCount = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value) || Math.floor(value) != value) 
			throw new Error('Non-integer value being assigned to '+this.table()+".voteCount");
		if (value < -9.2233720368548E+18 || value > 9223372036854775807)
			throw new Error("Out-of-range value '"+value+"' being assigned to "+this.table()+".voteCount");
		return value;
};

/**
 * Method is called before setting the field to verify if value is a number
 * @method beforeSet_weightTotal
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} If 'value' is not number
 */
Base.prototype.beforeSet_weightTotal = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value))
			throw new Error('Non-number value being assigned to '+this.table()+".weightTotal");
		return value;
};

/**
 * Method is called before setting the field to verify if value is a number
 * @method beforeSet_value
 * @param {integer} value
 * @return {integer} The value
 * @throws {Error} If 'value' is not number
 */
Base.prototype.beforeSet_value = function (value) {
		if (value instanceof Db.Expression) return value;
		value = Number(value);
		if (isNaN(value))
			throw new Error('Non-number value being assigned to '+this.table()+".value");
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
 * Check if mandatory fields are set and updates 'magic fields' with appropriate values
 * @method beforeSave
 * @param {array} value The array of fields
 * @return {array}
 * @throws {Error} If mandatory field is not set
 */
Base.prototype.beforeSave = function (value) {
	var fields = ['forType','forId'], i;
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