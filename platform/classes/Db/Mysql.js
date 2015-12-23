/**
 * @module Db
 */
var Q = require('Q');
var Db = Q.require('Db');
var util = require('util');
	
/**
 * MySQL connection class
 * @class Mysql
 * @namespace Db
 * @constructor
 * @param {String} connName The name of connection
 * @param {String} dsn The DSN string to make connection
 * @throws {Q.Exception} If database connection is not registered with Db module
 */
function Db_Mysql(connName, dsn) {
	
	/**
	 * Connection information
	 * @property info
	 * @type object
	 * @private
	 */
	var info = Db.getConnection(connName);
	if (!info) {
		throw new Q.Exception("Database connection \""+connName+"\" wasn't registered with Db");
	}
	if (!dsn) {
		dsn = Db.parseDsnString(info['dsn']);
	}
	
	var dbm = this;
	/**
	 * The name of connection
	 * @property connName
	 * @type string
	 */
	dbm.connName = connName;
	/**
	 * The connection created with mysql.createConnection()
	 * @property connection
	 * @type mysql.Connection
	 * @default null
	 */
	dbm.connection = null;
	/**
	 * Wheather connection is connected to database
	 * @property connected
	 * @type boolean
	 * @default false
	 */
	dbm.connected = false;
	
	/**
	 * Cache of connections
	 * @property connections
	 * @type object
	 * @default {}
	 * @private
	 */
	var connections = {};

	function mysqlConnection(host, port, user, password, database, options) {
		var key = [host, port, user, password, database].join("\t");
		if (connections[key]) {
			return connections[key];
		}
		var o = Q.extend({
			host: host,
			port: port,
			user: user,
			password: password,
			database: database,
			multipleStatements: true
		}, options);
		return connections[key] = require('mysql').createConnection(o);
	}

	/**
	 * Retrieve connection information possibly modified for particular shard
	 * @method info
	 * @param {String} [shardName=''] The name of the shard, defaults to '' - i.e. main table
	 * @param {Object} [modifications={}] Additional modifications to table information. If supplied override shard modifications
	 * @return {Object} Parsed dsn string with possible modifications
	 */
	dbm.info = function(shardName, modifications) {
		modifications = modifications || Db.getShard(this.connName, shardName || '') || {};
		return Q.extend({}, info, dsn, modifications, (modifications['dsn'] ? Db.parseDsnString(modifications['dsn']): {}));
	};

	/**
	 * Create mysql.Connection and connects to the database table
	 * @method reallyConnect
	 * @param {Function} callback The callback is fired after connection is complete. mysql.Connection is passed as argument
	 * @param {String} [shardName=''] The name of the shard to connect
	 * @param {object} [modifications={}] Additional modifications to table information. If supplied override shard modifications
	 */
	dbm.reallyConnect = function(callback, shardName, modifications) {
		info = this.info(shardName, modifications);
		var connection = mysqlConnection(
			info.host,
			info.port || 3306,
			info.username,
			info.password,
			info.dbname,
			info.options
		);
		if (!callback) return connection;
		if (!dbm.connected && Q.Config.get(['Db', 'debug'], false)) {
			connection._original_query = connection.query;
			connection.query = function (sql) {
				console.log("--> db="+connection.database+": ", sql.replace(/\n+/g, " "));
				return connection._original_query.apply(connection, arguments);
			};
		}
		if (!dbm.connected)
		{
			// add an error listener to handle mysql errors,
			// so the client won't crash
			dbm.on('error', function(err, mq) {
				console.log("Db.Mysql error: " + err);
				mq.getSQL(function (repres) {
					console.log("Query was: " + repres);
				});
			});
			connection.query('SET NAMES UTF8');
			dbm.connected = true;
		}
		callback(connection);
	};
	/**
	 * Retrieves table prefix to use with connection
	 * @method prefix
	 * @return {string}
	 */
	dbm.prefix = function() {
		return info.prefix;
	};
	
	/**
	 * Retrieves database name to use with connection
	 * @method dbname
	 * @return {string}
	 */
	dbm.dbname = function() {
		return info.dbname;
	};
	
	/**
	 * Creates a raw query.
	 * @method rawQuery
	 * @param {String} query The query string
 * @param parameters {Object|Array} The parameters to add to the query right away (to be bound when executing). Values corresponding to numeric keys replace question marks, while values corresponding to string keys replace ":key" placeholders, in the SQL.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.rawQuery = function(query, parameters) {
		return new Db.Query.Mysql(this, Db.Query.TYPE_RAW, {"RAW": query}, parameters);
	};

	/**
	 * Creates a query to rollback a previously started transaction.
	 * @method rollback
	 * @param {array} $criteria The criteria to use, for sharding
	 * @return {Db_Query_Mysql} The resulting Db_Query object
	 */
	dbm.rollback = function(criteria) {
		return new Db.Query.Mysql(this, Db.Query.TYPE_ROLLBACK).rollback(criteria);
	};

	/**
	 * Creates a query to select fields from a table. Needs to be used with Db.Query.from().
	 * @method SELECT
	 * @param {String|Object} fields The fields as strings, or associative array of `{alias: field}`
	 * @param {String|Object} tables The tables as strings, or associative array of `{alias: table}`
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.SELECT = function(fields, tables) {
		if (!fields)
			throw new Q.Exception("fields not specified in call to 'select'.");
		if (tables === undefined)
			throw new Q.Exception("tables not specified in call to 'select'.");
		var query = new Db.Query.Mysql(this, Db.Query.TYPE_SELECT);
		return query.SELECT(fields, tables);
	};
	
	/**
	 * Creates a query to insert a record into a table
	 * @method INSERT
	 * @param {String} table_into The name of the table to insert into
	 * @param {Object} fields The fields as an associative of `{column: value}` pairs
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.INSERT = function(table_into, fields) {
		if (!table_into)
			throw new Q.Exception("table not specified in call to 'insert'.");

		// fields might be an empty array,
		// but the insert will still be attempted.

		var columns_list = [];
		var values_list = [];
		for (var column in fields) {
			var value = fields[column];
			columns_list.push(column);
			if (value && value.typename === 'Db.Expression') {
				values_list.push(value.valueOf());
			} else {
				values_list.push(":" + column);
			}
		}
		var columns_string = columns_list.join(', ');
		var values_string = values_list.join(', ');

		var clauses = {
			"INTO": table_into,
			"FIELDS": columns_string,
			"VALUES": values_string
		};

		return new Db.Query.Mysql(this, Db.Query.TYPE_INSERT, clauses, fields, table_into);
	};
	
	/**
	 * Creates a query to update records. Must be used with Db.Query.set
	 * @method UPDATE
	 * @param {String} table The table to update
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.UPDATE = function (table) {
		if (!table)
			throw new Q.Exception("table not specified in call to 'update'.");
		var clauses = {"UPDATE": table};
		return new Db.Query.Mysql(this, Db.Query.TYPE_UPDATE, clauses, null, table);
	};

	/**
	 * Creates a query to delete records.
	 * @method DELETE
	 * @param {String} table_from The table to delete from
	 * @param {String} [table_using=null] If set, adds a USING clause with this table.
	 *  You can then use .join() with the resulting Db_Query.
	 * @return {Db.Query.Mysql} The resulting Db.Query object
	 */
	dbm.DELETE = function (table_from, table_using) {
		if (!table_from)
			throw new Q.Exception("table not specified in call to 'delete'.");

		var clauses = table_using ? {"FROM": table_from + " USING " + table_using} : {"FROM": table_from};
		return new Db.Query.Mysql(this, Db.Query.TYPE_DELETE, clauses, null, table_from);
	};
	
	/**
	 * Generate an ID that is unique in a table
	 * @method uniqueId
	 * @param {String} table The name of the table
	 * @param {String} field The name of the field to check for uniqueness.
	 *  You should probably have an index starting with this field.
	 * @param {Function} callback When an acceptable unique ID is generated, this function is called with the ID
	 *  as the first parameter.
	 * @param {Object} [where={}] You can indicate conditions here to limit the search for
	 *  an existing value. The result is an id that is unique within
	 *  a certain partition.
	 * @param {Object} [options={}] Optional hash used to override default options:
	 * @param {Number} [options.length=8] The length of the ID to generate, after the prefix.
	 * @param {String} [options.characters='abcdefghijklmnopqrstuvwxyz']  All the characters from which to construct the id
	 * @param {String} [options.prefix=''] The prefix to prepend to the unique id.
	 * @param {Function} [options.filter]
	 *     A function that will take the generated string and check it.
	 *     The filter function can modify the string by returning another string,
	 *     or simply reject the string by returning false, in which case
	 *     another string will be generated.
	 * @param {Function|Q.Event} [options.onError] Triggered if an error occurs
	 */
	dbm.uniqueId = function(table, field, callback, where, options) {
		where = where || {};
		options = options || {};
		var length = options.length || 8;
		var characters = options.characters || 'abcdefghijklmnopqrstuvwxyz';
		var prefix = options.prefix || '';
		var count = characters.length;
		var that = this;
		function attempt() {
			var id = prefix;
			for (var i=0; i<length; ++i) {
				id += characters[Math.floor(Math.random() * count)];
			}
			if (options.filter) {
				var ret = Q.handle(options.filter, this, [id, table, field, where, options]);
				if (ret === false) {
					attempt();
					return;
				} else if (ret) {
					id = ret;
				}
			}
			where[field] = id;
			var q = that.SELECT(field, table).where(where);
			q.limit(1).execute(function (err, rows) {
				if (err) {
					Q.handle(options.onError, that, [err]);
				} else if (!rows.length) {
					Q.handle(callback, that, [id]);
				} else {
					attempt(); // generate another id
				}
			});
		}
		attempt();
	};
	
	/**
	 * Returns a timestamp from a Date string
	 * @method fromDate
	 * @param {string} date The Date string that comes from the db
	 * @return {integer} The timestamp
	 */
	dbm.fromDate = function(date) {
		var year = date.substr(0, 4),
		    month = date.substr(5, 2),
		    day = date.substr(8, 2);
		return (new Date(year, month, day).getTime());
	};
    
	/**
	 * Returns a timestamp from a DateTime string
	 * @method fromDateTime
	 * @param {string} datetime The DateTime string that comes from the db
	 * @return {integer} The timestamp
	 */
	dbm.fromDateTime = function(datetime) {
		if (datetime.constructor === Date) {
			return datetime.getTime();
		}
		var year = datetime.substr(0, 4),
		    month = datetime.substr(5, 2),
		    day = datetime.substr(8, 2),
		    hour = datetime.substr(11, 2),
		    min = datetime.substr(14, 2),
		    sec = datetime.substr(17, 2);
		return (new Date(year, month, day, hour, min, sec, 0).getTime());
	};

	/**
	 * Returns a Date string to store in the database
	 * @method toDate
	 * @param {string} $timestamp The UNIX timestamp, e.g. from a strtotime function
	 * @return {string}
	 */
	dbm.toDate = function(timestamp) {
		if (!(timestamp instanceof Date)) {
			timestamp = new Date(timestamp);
		}
		timestamp = timestamp.getTime();
		var date = new Date(timestamp),
			year = date.getFullYear(),
			month = date.getMonth(),
			day = date.getDate();
		month = month < 10 ? '0'+month : month;
		day = day < 10 ? '0'+day : day;
		return year + '-' + month + '-' + day;
	};

	/**
	 * Returns a DateTime string to store in the database
	 * @method toDateTime
	 * @param {Date|string} timestamp a standard UNIX timestamp
	 * @return {string}
	 */
	dbm.toDateTime = function(timestamp) {
		if (!(timestamp instanceof Date)) {
			timestamp = new Date(timestamp);
		}
		timestamp = timestamp.getTime();
		var date = new Date(timestamp),
			year = date.getFullYear(),
			month = date.getMonth()+1,
			day = date.getDate(),
			hours = date.getHours(),
			minutes = date.getMinutes(),
			seconds = date.getSeconds();
		month = month < 10 ? '0'+month : month;
		day = day < 10 ? '0'+day : day;
		hours = hours < 10 ? '0'+hours : hours;
		minutes = minutes < 10 ? '0'+minutes : minutes;
		seconds = seconds < 10 ? '0'+seconds : seconds;
		return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
	};
	
	var _dbtime = null,
	    _nodetime = null;
	
	/**
	 * Returns the timestamp the db server would have, based on synchronization
	 * @method timestamp
	 * @param {Function} callback receives (err, timestamp)
	 * @return {integer}
	 */
	dbm.getCurrentTimestamp = function (callback) {
		if (_dbtime) {
			return callback(null, _dbtime + Math.round(Date.now() - _nodetime));
		}
		var time1 = Date.now();
		dbm.SELECT('CURRENT_TIMESTAMP ct', '').execute(function (err, rows) {
			if (err) {
				return callback(err);
			}
			if (!rows || !rows[0]) {
				return callback("No results returned");
			}
			_dbtime = dbm.fromDateTime(rows[0].fields.ct);
			var time2 = Date.now();
			_nodetime = (time1 + time2) / 2;
			callback(null, _dbtime + Math.round(time2 - _nodetime));
		});
	};

}

Q.makeEventEmitter(Db_Mysql, true);
module.exports = Db_Mysql;