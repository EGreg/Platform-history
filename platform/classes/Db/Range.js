/**
 * @module Db
 */
/**
 * The class representing a rabge of database values
 * @class Range
 * @namespace Db
 * @constructor
 * @param min {string}
 * @param includeMin {boolean}
 * @param includeMax {boolean}
 * @param max {string}
 */
function Range(min, includeMin, includeMax, max) {
	this.min = min;
	this.includeMin = includeMin;
	this.includeMax = includeMax;
	this.max = max;
	this.typename = "Db.Range";
}

module.exports = Range;