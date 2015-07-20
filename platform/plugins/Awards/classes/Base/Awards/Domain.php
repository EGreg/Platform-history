<?php

/**
 * Autogenerated base class representing domain rows
 * in the Awards database.
 *
 * Don't change this file, since it can be overwritten.
 * Instead, change the Awards_Domain.php file.
 *
 * @module Awards
 */
/**
 * Base class representing 'Domain' rows in the 'Awards' database
 * @class Base_Awards_Domain
 * @extends Db_Row
 *
 * @property {string} $hostname
 * @property {integer} $publisherId
 * @property {string} $status
 */
abstract class Base_Awards_Domain extends Db_Row
{
	/**
	 * @property $hostname
	 * @type {string}
	 */
	/**
	 * @property $publisherId
	 * @type {integer}
	 */
	/**
	 * @property $status
	 * @type {string}
	 */
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		$this->setDb(self::db());
		$this->setTable(self::table());
		$this->setPrimaryKey(
			array (
			)
		);
	}

	/**
	 * Connects to database
	 * @method db
	 * @static
	 * @return {iDb} The database object
	 */
	static function db()
	{
		return Db::connect('Awards');
	}

	/**
	 * Retrieve the table name to use in SQL statement
	 * @method table
	 * @static
	 * @param {boolean} [$with_db_name=true] Indicates wheather table name should contain the database name
 	 * @return {string|Db_Expression} The table name as string optionally without database name if no table sharding
	 * was started or Db_Expression class with prefix and database name templates is table was sharded
	 */
	static function table($with_db_name = true)
	{
		if (Q_Config::get('Db', 'connections', 'Awards', 'indexes', 'Domain', false)) {
			return new Db_Expression(($with_db_name ? '{$dbname}.' : '').'{$prefix}'.'domain');
		} else {
			$conn = Db::getConnection('Awards');
  			$prefix = empty($conn['prefix']) ? '' : $conn['prefix'];
  			$table_name = $prefix . 'domain';
  			if (!$with_db_name)
  				return $table_name;
  			$db = Db::connect('Awards');
  			return $db->dbName().'.'.$table_name;
		}
	}
	/**
	 * The connection name for the class
	 * @method connectionName
	 * @static
	 * @return {string} The name of the connection
	 */
	static function connectionName()
	{
		return 'Awards';
	}

	/**
	 * Create SELECT query to the class table
	 * @method select
	 * @static
	 * @param {array} $fields The field values to use in WHERE clauseas as 
	 * an associative array of `column => value` pairs
	 * @param {string} [$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function select($fields, $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->select($fields, self::table().' '.$alias);
		$q->className = 'Awards_Domain';
		return $q;
	}

	/**
	 * Create UPDATE query to the class table
	 * @method update
	 * @static
	 * @param {string} [$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function update($alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->update(self::table().' '.$alias);
		$q->className = 'Awards_Domain';
		return $q;
	}

	/**
	 * Create DELETE query to the class table
	 * @method delete
	 * @static
	 * @param {object} [$table_using=null] If set, adds a USING clause with this table
	 * @param {string} [$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function delete($table_using = null, $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->delete(self::table().' '.$alias, $table_using);
		$q->className = 'Awards_Domain';
		return $q;
	}

	/**
	 * Create INSERT query to the class table
	 * @method insert
	 * @static
	 * @param {object} [$fields=array()] The fields as an associative array of `column => value` pairs
	 * @param {string} [$alias=null] Table alias
	 * @return {Db_Query_Mysql} The generated query
	 */
	static function insert($fields = array(), $alias = null)
	{
		if (!isset($alias)) $alias = '';
		$q = self::db()->insert(self::table().' '.$alias, $fields);
		$q->className = 'Awards_Domain';
		return $q;
	}
	/**
	 * Inserts multiple records into a single table, preparing the statement only once,
	 * and executes all the queries.
	 * @method insertManyAndExecute
	 * @static
	 * @param {array} [$records=array()] The array of records to insert. 
	 * (The field names for the prepared statement are taken from the first record.)
	 * You cannot use Db_Expression objects here, because the function binds all parameters with PDO.
	 * @param {array} [$options=array()]
	 *   An associative array of options, including:
	 *
	 * * "chunkSize" {integer} The number of rows to insert at a time. defaults to 20.<br/>
	 * * "onDuplicateKeyUpdate" {array} You can put an array of fieldname => value pairs here,
	 * 		which will add an ON DUPLICATE KEY UPDATE clause to the query.
	 *
	 */
	static function insertManyAndExecute($records = array(), $options = array())
	{
		self::db()->insertManyAndExecute(
			self::table(), $records,
			array_merge($options, array('className' => 'Awards_Domain'))
		);
	}
	
	/**
	 * Method is called before setting the field and verifies if value is string of length within acceptable limit.
	 * Optionally accept numeric value which is converted to string
	 * @method beforeSet_hostname
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not string or is exceedingly long
	 */
	function beforeSet_hostname($value)
	{
		if (!isset($value)) {
			$value='';}if ($value instanceof Db_Expression) {
			return array('hostname', $value);
		}
		if (!is_string($value) and !is_numeric($value))
			throw new Exception('Must pass a string to '.$this->getTable().".hostname");
		if (strlen($value) > 255)
			throw new Exception('Exceedingly long value being assigned to '.$this->getTable().".hostname");
		return array('hostname', $value);			
	}

	/**
	 * Returns the maximum string length that can be assigned to the hostname field
	 * @return {integer}
	 */
	function maxSize_hostname()
	{

		return 255;			
	}

	/**
	 * Method is called before setting the field and verifies if integer value falls within allowed limits
	 * @method beforeSet_publisherId
	 * @param {integer} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value is not integer or does not fit in allowed range
	 */
	function beforeSet_publisherId($value)
	{
		if ($value instanceof Db_Expression) {
			return array('publisherId', $value);
		}
		if (!is_numeric($value) or floor($value) != $value)
			throw new Exception('Non-integer value being assigned to '.$this->getTable().".publisherId");
		$value = intval($value);
		if ($value < 0 or $value > 1.844674407371E+19) {
			$json = json_encode($value);
			throw new Exception("Out-of-range value $json being assigned to ".$this->getTable().".publisherId");
		}
		return array('publisherId', $value);			
	}

	/**
	 * Returns the maximum integer that can be assigned to the publisherId field
	 * @return {integer}
	 */
	function maxSize_publisherId()
	{

		return 1.844674407371E+19;			
	}

	/**
	 * Method is called before setting the field and verifies if value belongs to enum values list
	 * @method beforeSet_status
	 * @param {string} $value
	 * @return {array} An array of field name and value
	 * @throws {Exception} An exception is thrown if $value does not belong to enum values list
	 */
	function beforeSet_status($value)
	{
		if ($value instanceof Db_Expression) {
			return array('status', $value);
		}
		if (!in_array($value, array('pending','verified')))
			throw new Exception("Out-of-range value '$value' being assigned to ".$this->getTable().".status");
		return array('status', $value);			
	}

	/**
	 * Retrieves field names for class table
	 * @method fieldNames
	 * @static
	 * @param {string} [$table_alias=null] If set, the alieas is added to each field
	 * @param {string} [$field_alias_prefix=null] If set, the method returns associative array of `'prefixed field' => 'field'` pairs
	 * @return {array} An array of field names
	 */
	static function fieldNames($table_alias = null, $field_alias_prefix = null)
	{
		$field_names = array('hostname', 'publisherId', 'status');
		$result = $field_names;
		if (!empty($table_alias)) {
			$temp = array();
			foreach ($result as $field_name)
				$temp[] = $table_alias . '.' . $field_name;
			$result = $temp;
		} 
		if (!empty($field_alias_prefix)) {
			$temp = array();
			reset($field_names);
			foreach ($result as $field_name) {
				$temp[$field_alias_prefix . current($field_names)] = $field_name;
				next($field_names);
			}
			$result = $temp;
		}
		return $result;			
	}
};