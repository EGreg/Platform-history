/**
 * @module Q
 */
var Q = require('../Q');

/**
 * Used to cache objects in memory
 * @class Cache
 * @namespace Q
 * @constructor
 * @param max {number} The amount of memory dedicated to cache
 * @param [min="60%25%20*%20max"] {number} The amount of memory to leave untouched diring gc
 */
function Cache (max, min) {
	if (!max) throw new Error("Require the maximim memory amount for Q.Cache object");
	if (!min) min = Math.floor(max*0.6);
	var p = new Q.Tree();
	var size = 0;
	/**
	 * Sets the value to cache with key
	 * @method set
	 * @param keys {string|array}
	 * @param value {mixed}
	 * @chainable
	 */
	this.set = function (keys, value) {
		this.unset(keys);
		gc(this, max, min);
		if (typeof value !== "undefined" && value !== null) {
			var buff = new Buffer(value.toJSON ? value.toJSON() : JSON.stringify(value));
			p.set(keys, {
				timestamp: new Date(),
				constructor: value.constructor || null,
				data: buff,
				length: buff.byteLength
			});
			size += buff.length;
		}
		return this;
	};
	/**
	 * Sets the value to cache with key
	 * @method get
	 * @param keys {string|array}
	 * @return {mixed|null}
	 */
	this.get = function (keys) {
		var value = p.get(keys);
		if (value) {
			var obj = JSON.parse(value.data.toString('utf8', 0, value.length));
			return value.constructor ? new value.constructor(obj) : obj;
		} else return null;
	};
	/**
	 * Removes the value from cache with key
	 * @method unset
	 * @param keys {string|array}
	 * @param tree {Q.Tree}
	 */
	this.unset = function (keys, tree) {
		tree = tree || p;
		linked = tree.get(keys, null);
		if (linked) {
			if (Buffer.isBuffer(linked.data)) {
				size -= linked.data.length;
				delete linked.data;
			} else {
				for (var i in linked) {
					this.unset([i], new Q.Tree(linked[i]));
					delete linked[i];
				}
			}
		}
	};
	/**
	 * Returns the real size of cache on memory outside node memory pool
	 * @method size
	 * @return {number}
	 */
	this.size = function () {
		return size;
	};

	/**
	 * Performs garbage collection - effectively clearing the 'oldest' records
	 * @method gc
	 * @private
	 * @param max {number} The amount of memory dedicated to cache
	 * @param min {number} The amount of memory to leave untouched diring gc
	 */
	function gc(self, max, min) {
		if (size < max) return;
		function _leaves (keys, tree) {
			if (Buffer.isBuffer(tree.data)) return [{timestamp: tree.timestamp, keys: keys}];
			else {
				var res = [];
				for (var i in tree) {
					res.concat(_leaves(keys.push(i), tree[i]));
				}
				return res;
			}
		}
		var leaves = _leaves([], p.getAll()).sort(function(a,b) { return b.timestamp-a.timestamp; });
		var original = size;
		while (size > min) {
			self.unset(leaves.splice(0, 1));
		}
		self.emit('Q/Cache/gc', original-size); // gc cleared this amount of memory
	}
}

Q.makeEventEmitter(Cache, true);
module.exports = Cache;