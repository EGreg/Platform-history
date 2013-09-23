/*
 * @module Db
 * @main Db
 */
var Q = require('Q');
var Db = module.exports;
Q.makeEventEmitter(Db);

/**
 * The database interface module. Contains basic properties and methods and serves as namespace
 * for more specific sub-classes
 * @class Db
 * @static
 * @requires Q
 */
var dbs = {};

Db.Expression = Q.require('Db/Expression');
Db.Query = Q.require('Db/Query');
Db.Row = Q.require('Db/Row');
Db.Range = Q.require('Db/Range');
Db.Q = Q;

/**
 * Add a database connection with a name
 * @method setConnection
 * @param name {string} The name under which to store the connection details
 * @param details {object} The connection details. Should include the keys:
 *  'dsn', 'username', 'password', 'driver_options'
 */
Db.setConnection = function(name, details) {
	Q.Config.set(['Db', 'connections', name], details);
};

/**
 * Returns all the connections added thus far
 * @method getConnections
 * @return {object}
 */
Db.getConnections = function () {
	return Q.Config.get(['Db', 'connections'], {});
};

/**
 * Returns connection details for a connection
 * @method getConnection
 * @param name {string}
 * @return {object|null}
 */
Db.getConnection = function(name) {
	if (!name) return null;
	return Q.Config.get(['Db', 'connections', name], null);
};

/**
 * Add a named shard under a database connection
 * Can contain the keys "dsn", "username", "password", "driver_options"
 * They are used in constructing the PDO object.
 * @method setShard
 * @param connName {string} The name of the connection to which the shard pertains
 * @param shardName {string} The name under which to store the shard modifications
 * @param modifications {object} The shard modifications. Can include the keys:
 *  'dsn', 'host', 'port', 'dbname', 'unix_socket', 'charset',
 *  'username', 'password', 'driver_options',
 */
Db.setShard = function(connName, shardName, modifications) {
	Q.Config.set(['Db', 'connections', connName, 'shards', shardName], modifications);
};

/**
 * Returns all the shards added thus far for a connection
 * @method getShards
 * @param connName {string}
 * @return {object}
 */
Db.getShards = function (connName) {
	return Q.Config.get(['Db', 'connections', connName, 'shards'], {});
};

/**
 * Returns modification details for a shard pertaining to a connection
 * @method getShard
 * @param connName {string}
 * @param [shardName=''] {string}
 * @return {object|null}
 */
Db.getShard = function(connName, shardName) {
	if (!connName) return null;
	shardName = shardName || '';
	return Q.Config.get(['Db', 'connections', connName, 'shards', shardName], null);
};

/**
 * Parses dsn string and convert to object
 * @method parseDsnString
 * @param dsn {string} The dsn string for the database
 * @return {object} The data extracted from the DSN string
 */
Db.parseDsnString = function(dsn) {
	var parts = dsn.split(':');
	var parts2 = parts[1].split(';');
	var result = {};
	for (var k in parts2) {
		var parts3 = parts2[k].split('=');
		result[ parts3[0] ] = parts3[1];
	}
	result['dbms'] = parts[0].toLowerCase();
	return result;
};

/**
 * This function uses Db to establish a connection
 * with the information stored in the configuration.
 * If the this Db object has already been made,
 * it returns this Db object.
 * @method connect
 * @param name {string} The name of the connection out of the connections added with Db::setConnection
 * @return {Db} The database connection
 * @throws {Q.Exception} if database connection wasn't registered with Db
 */
Db.connect = function(name) {
	var info = Db.getConnection(name);
	if (!info) {
		throw new Q.Exception("Database connection \""+name+"\" wasn't registered with Db");
	}
	
	if (name in dbs) {
		return dbs[name];
	}

	var dsn = Db.parseDsnString(info['dsn']),
		dbms = dsn['dbms'];
	var moduleName =  dbms.charAt(0).toUpperCase() + dbms.substr(1);
	Db[moduleName] = Q.require('Db/' + moduleName);

	return dbs[name] = new Db[moduleName](name, dsn);
};
/**
 * @method listen
 * @param  {object} [options={}]
 * @return {http.server}
 */
Db.listen = function (options) {
	options = options || {};
	var server = Q.listen({
		port: options.port,
		host: options.host
	});
	if (!server.attached.db) {
		server.attached.db = {}; // nothing really to construct here
	}
	server.attached.express.use(function Db_request_handler (req, res, next) {
		try {
			var query = req.info.fields.query;
			if (!query) {
				throw new Q.Exception("Db: no query provided");
			}
			query = JSON.parse(query);
			if (Q.typeOf(query) !== 'array') {
				throw new Q.Exception("Db: expected query to be an array");
			}
			var qparts = [], queries = {}, sql, connection, shardName;
			for (var i=0; i<query.length; ++i) {
				sql = query[i][0];
				connection = query[i][1];
				shardName = query[i][2];
				if (isNaN(sql)) {
					sql = qs[sql].sql;
				}
				qparts[i] = {
					sql: sql,
					connection: connection,
					shardName: shardName
				};
				queries[shardName] = new Db.connect(connection).rawQuery(sql, {});
			}
			new Db.connect(connection).rawQuery("", {}).execute(function () {
				// TODO: fill the response with the results
			}, {queries: queries});
		} catch (e) {
			res.send(JSON.stringify({"errors": [e]}));
		}
	});
	return server;
};