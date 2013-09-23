<?php

/**
 * @module Q
 */
class Q_Exception extends Exception
{	
	/**
	 * Represents a complex exception thrown in Q. It may contain more details.
	 * @class Q_Exception
 	 * @constructor
	 * @extends Exception
	 * @param {array} [$params=array()] Array of parameters for the exception. 
	 *  Used in the exception message, etc.
	 *  To access them later, call $e->params()
	 *  You can also provide a string here, which will
	 *  then be the exception message.
	 * @param {array} [$input_fields=array()] Array of names of input fields to which the exception applies.
	 */
	function __construct(
	  $params = array(),
	  $input_fields = array())
	{
		if (is_string($input_fields)) {
			$input_fields = array($input_fields);
		}
		$this->inputFields = $input_fields;
		
		if (is_string($params)) {
			parent::__construct($params, 0);
			return;
		}
		$this->params = is_array($params) ? $params : array();

		$class_name = get_class($this);
		if (isset(self::$messages[$class_name])) {
			$t_message = Q::interpolate(
				self::$messages[$class_name], $this->params
			);
		} else {
			$t_message = $class_name;
		}
		if (isset(self::$messages[$class_name])) {
			$t_code = self::$codes[$class_name];
		} else {
			$t_code = 0;
		}
		parent::__construct($t_message, $t_code);
	}
	
	/**
	 * @method __get
	 * @param {string} $param
	 * @return {mixed}
	 */
	function __get($param)
	{
		return isset($this->params[$param])
			? $this->params[$param]
			: null;
	}
	
	/**
	 * @method __set
	 * @param {string} $param
	 * @param {mixed} $value
	 */
	function __set($param, $value) {
		$this->params[$param] = $value;
	}
	
	function set()
	{
		
	}
	
	/**
	 * Returns the array of parameters the exception was created with.
	 * @method params
	 * @return {array}
	 */
	function params()
	{
		return $this->params;
	}
	
	/**
	 * Returns the array of names of input fields the exception applies to.
	 * @method inputFields
	 * @return {array}
	 */
	function inputFields()
	{
		return $this->inputFields;
	}
	
	/**
	 * Registers a new exception class that extends Q_Exception
	 * @method add
	 * @static
	 * @param {string} $class_name The name of the exception class.
	 * @param {string} $message The description of the error. Will be eval()-ed before rendering,
	 *  so it can include references to parameters, such as $my_param.
	 * @param {array} [$rethrow_dest_class=array()] The name of the class that should handle this exception,
	 *  should it be thrown. Almost all catch() blocks in your code should use
	 *  `Q_Exception::rethrow($e, __CLASS__)` as the first statement, 
	 *  if the exception might have to be re-thrown further down the stack.
	 */
	static function add(
	 $class_name,
	 $message,
	 $rethrow_dest_classes = array())
	{
		static $exception_code = 10000;
		++$exception_code; // TODO: improve this somehow
		
		self::$codes[$class_name] = $exception_code;
		self::$messages[$class_name] = $message;
		self::$rethrowDestClasses[$class_name] = $rethrow_dest_classes;
	}
	
	/**
	 * Use in your catch() blocks if you think the exception 
	 * might have to be thrown further down the stack.
	 * @method rethrow
	 * @static
	 * @param {Exception} $exception The exception that was thrown. It is analyzed for
	 *  whether it should be re-thrown.
	 * @param {string} $current_class If the $rethrow_dest_classes was specified in Q_Exception::add
	 *  when creating this exception's class, and it does not contain
	 *  $current_class, this function throws the exception again.
	 */
	static function rethrow(
	 $exception, 
	 $current_class)
	{
		if (!is_callable(array($exception, 'rethrowDestClasses')))
			return false;

		$rdc = $exception->rethrowDestClasses();
		if ($rdc and !in_array($current_class, $rdc)) {
			throw $exception;
		}
	}
	
	/**
	 * Returns an array of classes to rethrow to, if any.
	 * @method rethrowDestClasses
	 * @return {array}
	 */
	function rethrowDestClasses()
	{
		$class_name = get_class($this);
		if (isset(self::$rethrowDestClasses[$class_name])) {
			return self::$rethrowDestClasses[$class_name];
		}
		return array();
	}
	
	/**
	 * Returns the trace array, can be overridden. Use this in your exception reporting.
	 * This is the default implementation.
	 * @method getTraceEx
	 * @return {array}
	 */
	function getTraceEx()
	{
		return parent::getTrace();
	}
	
	/**
	 * Returns trace as string, can be overridden. Use this in your exception reporting.
	 * This is the default implementation.
	 * @method getTraceAsStringEx
	 * @return {string}
	 */
	function getTraceAsStringEx()
	{
		return parent::getTraceAsString();
	}
	
	/**
	 * Converts an exception or array of exceptions to an array
	 * @method toArray
	 * @static
	 * @param {Exception|array} $exceptions The exception object or array of exceptions to convert
	 * @return {array}
	 */
	static function toArray($exceptions)
	{
		if (empty($exceptions)) {
			return array();
		}
		$array_was_passed = true;
		if (!is_array($exceptions)) {
			$exceptions = array($exceptions);
			$array_was_passed = false;
		}
		$results = array();
		$show_fal = Q_Config::get('Q', 'exception', 'showFileAndLine', true);
		$show_trace = Q_Config::get('Q', 'exception', 'showTrace', true);
		foreach ($exceptions as $e) {
			if (!($e instanceof Exception)) {
				continue;
			}
			$message = $e->getMessage();
			$code = $e->getCode();
			if ($show_fal) {
				$line = $e->getLine();
				$file = $e->getFile();
			}
			if ($show_trace) {
				if (is_callable(array($e, 'getTraceEx'))) {
					$trace = $e->getTraceEx();
				} else {
					$trace = $e->getTrace();
				}
			}
			$fields = null;
			if (is_callable(array($e, 'inputFields'))) {
				$fields = $e->inputFields();
			}
			$classname = get_class($e);
			$results[] = compact('message', 'code', 'line', 'file', 'trace', 'fields', 'classname');
		}
		if ($array_was_passed) {
			return $results;
		} else {
			$ret = reset($results);
			return $ret ? $ret : array();
		}
	}
	
	/**
	 * @property $params
	 * @protected
	 * @type array
	 */
	protected $params = array();
	/**
	 * @property $inputFields
	 * @protected
	 * @type array
	 */
	protected $inputFields = array();
	
	/**
	 * @property $codes
	 * @protected
	 * @type array
	 */
	protected static $codes = array();
	/**
	 * @property $messages
	 * @protected
	 * @type array
	 */
	protected static $messages = array();
	/**
	 * @property $rethrowDestClasses
	 * @protected
	 * @type array
	 */
	protected static $rethrowDestClasses = array();
}
