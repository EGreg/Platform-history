<?php

/**
 * @module Db
 */

class Db_Range
{
	/**
	 * This class lets you use make range queries, in a structured way.
	 * @class Db_Range
	 * @constructor
	 * @param {mixed} $min Minimal value of the range. Pass null to skip the min.
	 * @param {boolean} $include_min Whether the range extends to include the minimum value
	 * @param {boolean} $include_max Whether the range extends to include the maximum value
	 * @param {mixed} $max Maximal value of the range. Pass null to skip the max.
	 *  If boolean true is passed here, then $max is set to $min with the last character
	 *  incremented to the next ASCII value.
	 */
	function __construct ($min, $include_min, $include_max, $max)
	{
		$this->min = $min;
		$this->includeMin = $include_min;
		$this->includeMax = $include_max;
		if ($max === true) {
			if (!is_string($min)) {
				throw new Exception("Db_Range: min is the wrong type, expected a string");
			}
			$last_char = strlen($min) ? substr($min, -1) : ' ';
			$max = substr($min, 0, -1).chr(ord($last_char)+1);
		}
		$this->max = $max;
		$this->typename = "Db.Range";
	}
	/**
	 * Minimal value of the range
	 * @property $min
	 * @type mixed
	 */
	/**
	 * Maximal value of the range
	 * @property $max
	 * @type mixed
	 */
	/**
	 * Wheather maximum value shall be included to the range
	 * @property $includeMax
	 * @type boolean
	 */
	/**
	 * Wheather minimum value shall be included to the range
	 * @property $includeMin
	 * @type boolean
	 */
	public $min, $max, $includeMin, $includeMax;
}