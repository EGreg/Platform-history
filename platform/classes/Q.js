/**
 * Contains core Q functionality.
 * @module Q
 * @main Q
 */
var express = require('express');
var http = require('http');
var util = require('util');
var events = require('events');
var path = require('path');
var fs = require('fs');

var QConstructor = function QConstructor() {};
QConstructor.prototype = new events.EventEmitter();
/**
 * The main platform module. Contains basic properties and methods and serves as namespace
 * for more specific sub-classes
 * @class Q
 * @static
 */
var Q = new QConstructor();
module.exports = Q;

Q.VERSION = 0.8;

/**
 * Walks the tree from the parent, and returns whether the path was defined
 * @method isSet
 * @param {object} parent
 * @param {array} keys
 * @return {boolean}
 */
Q.isSet = function _Q_isSet(parent, keys) {
	var p = parent;
	if (!p) {
		return false;
	}
	for (var i=0; i<keys.length; i++) {
		if (!(keys[i] in p)) {
			return false;
		}
		p = p[keys[i]];
	}
	return true;
};

/**
 * Walks the tree from the parent, returns the object at the end of the path, or the the defaultValue
 * @method ifSet
 * @param parent {object}
 * @param keys {array}
 * @param defaultValue {mixed}
 * @return {mixed} The resulting object
 */
Q.ifSet = function _Q_ifSet(parent, keys, defaultValue) {
	var p = parent;
	if (!p) {
		return defaultValue;
	}
	for (var i=0; i<keys.length; i++) {
		if (!(keys[i] in p)) {
			return defaultValue;
		}
		p = p[keys[i]];
	}
	return p;
};

/**
 * Makes an object into an event emitter.
 * @method makeEventEmitter
 * @param what {object} Can be an object or a function
 * @param [isConstructor=false] {boolean} Whether the object is a constructor function. In this case,
 *  it is not the function that is made an emitter, but the
 *  objects which the function constructs.
 */
Q.makeEventEmitter = function _Q_makeEventEmitter(what, isConstructor) {
	if (isConstructor) {
		what.prototype.__proto__ = events.EventEmitter.prototype;
	} else {
		what.__proto__ = events.EventEmitter.prototype;
	}
};

/**
 * Creates a derived object which you can extend, inheriting from an existing object
 * @method objectWithPrototype
 * @param original {object} The object to use as the prototype
 * @return {object} The derived object
 */
Q.objectWithPrototype = function _Q_objectWithPrototype(original) {
	if (!original) {
		return {};
	}
	function Clone() {}
	Clone.prototype = original;
	return new Clone();
};

/**
 * Clones the Base constructor and mixes in the Constructor function
 * @param Base {Function} the base function, such as Q.Tool
 * @param Constructor {Function} the constructor function to change
 * @return {Function} The resulting function to be used as a constructor
 */
Q.inherit = function _Q_inherit(Base, Constructor) {
	function InheritConstructor() {
		InheritConstructor.constructors.apply(this, arguments);
	}
	InheritConstructor.prototype = Q.objectWithPrototype(Q.Tool.prototype);
	InheritConstructor.prototype.constructor = InheritConstructor;
	Q.mixin(InheritConstructor, Constructor);
	return InheritConstructor;
};

/**
 * Returns the type of a value
 * @method typeOf
 * @param value {mixed} The value to test type
 * @return {string} String description of the type
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value;
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (value instanceof Array || (value.constructor && value.constructor.name === 'Array')) {
			s = 'array';
		} else if (typeof(value.typename) != 'undefined' ) {
			return value.typename;
		} else if (typeof(value.constructor) != 'undefined' && typeof(value.constructor.name) != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Tests if the value is an integer
 * @method isInteger
 * @param value {mixed} The value to test
 * @return {boolean} Whether it is an integer
 */
Q.isInteger = function _Q_isInteger(value) {
	return (parseFloat(value) == parseInt(value)) && !isNaN(value);
};

/**
 * Binds a method to an object, so "this" inside the method
 * refers to that object when it is called.
 * @method bind
 * @param method {function} A reference to the function to call
 * @param obj {object} The object to bind to
 * @param {object} [options={}] If supplied, binds these options and passes
 *  them during invocation.
 * @return {mixed} The result of calling "method" in the context of "obj"
 */
Q.bind = function _Q_bind(method, obj, options) {
	if (options) {
		return function () {
			var args = Array.prototype.slice.call(arguments);
			if (options) args.push(options);
			return method.apply(obj, args);
		};
	} else {
		return function () {
			return method.apply(obj, arguments);
		};
	}
};

/**
 * A convenience method for constructing Q.Pipe objects
 * and is really here just for backward compatibility.
 * @return {Q.Pipe}
 * @see Q.Pipe
 */
Q.pipe = function _Q_pipe(requires, maxTimes, callback) {
	return new Q.Pipe(requires, maxTimes, callback);
};

/*
 * Sets up control flows involving multiple callbacks and dependencies
 * Usage:
 * var p = Q.pipe(['user', 'stream], function (params, subjects) {
 *   // arguments that were passed are in params.user, params.stream
 *   // this objects that were passed are in subjects.user, subjects.stream
 * });
 * mysql("SELECT * FROM user WHERE userId = 2", p.fill('user'));
 * mysql("SELECT * FROM stream WHERE publisherId = 2", p.fill('stream'));
 *
 * The first parameter to p.fill() is the name of the array to fill when it's called
 * You can pass a second parameter to p.fill, which can be either:
 * true - in this case, the current function is ignored during the next times through the pipe
 * a string - in this case, this name is considered unfilled the next times through this pipe
 * an array of strings - in this case, these names are considered unfilled the next times through the pipe
 *
 * @see {Q.Pipe.prototype.add} for more info on the parameters
 */
Q.Pipe = function _Q_Pipe(requires, maxTimes, callback) {
	this.callbacks = [];
	this.params = {};
	this.subjects = {};
	this.ignore = {};
	this.finished = false;
	this.add.apply(this, arguments);
};

/**
 * Adds a callback to the pipe
 * @method add
 * @param requires Array
 *  Optional. Pass an array of required field names here.
 * @param maxTimes Number
 *  Optional. The maximum number of times times the callback should be called.
 * @param callback Function
 *  Once all required fields are filled (see previous parameter, if any)
 *  this function is called every time something is piped.
 *  If you return false from this function, it will no longer be called for future pipe runs.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 * @param requires2 Array
 * @param maxTimes2 Number
 * @param callback2 Function
 *  Keep passing as many functions (preceded by arrays of required fields)
 *  as you want and they will be processed in order every time something is
 *  piped in. You would typically do this to set up some functions
 *  that depend on some fields, and other functions that depend on other fields
 *  and have functions execute once all the data is available.
 *  Thus you can mix and match sequential and parallel processing.
 *  If you need getters, throttling, or batching, use Q.getter( ).
 */
Q.Pipe.prototype.add = function _Q_pipe_add(requires, maxTimes, callback) {
	var r = null, n = null;
	for (var i=0; i<arguments.length; i++) {
		if (typeof arguments[i] === 'function') {
			arguments[i].pipeRequires = r;
			arguments[i].pipeRemaining = n;
			this.callbacks.push(arguments[i]);
			r = n = null;
		} else if (Q.typeOf(arguments[i]) === 'array') {
			r = arguments[i];
		} else if (Q.typeOf(arguments[i]) === 'number') {
			n = arguments[i];
		}
	}
	return this;
};

/**
 * Makes a function that fills a particular field in the pipe and can be used as a callback
 * @method fill
 * @param field
 *   For error callbacks, you can use field="error" or field="users.error" for example.
 * @param ignore
 *   Optional. If true, then ignores the current field in subsequent pipe runs.
 *   Or pass the name (string) or names (array) of the field(s) to ignore in subsequent pipe runs.
 * @return {Function} Returns a callback you can pass to other functions.
 */
Q.Pipe.prototype.fill = function _Q_pipe_fill(field, ignore) {
	if (ignore === true) {
		this.ignore[this.i] = true;
	} else if (typeof ignore === 'string') {
		this.ignore[ignore] = true;
	} else if (Q.typeOf(ignore) === 'array') {
		for (var i=0; i<ignore.length; ++i) {
			this.ignore[ignore[i]] = true;
		}
	}

	var pipe = this;

	return function _Q_pipe_fill() {
		pipe.params[field] = Array.prototype.slice.call(arguments);
		pipe.subjects[field] = this;
		pipe.run();
	};
};

/**
 * Runs the pipe
 * @method run
 * @return {Number} the number of pipe callbacks that wound up running
 */
Q.Pipe.prototype.run = function _Q_pipe_run() {
	var cb, ret, callbacks = this.callbacks, params = Q.copy(this.params), count = 0;

	cbloop:
	for (var i=0; i<callbacks.length; i++) {
		if (this.ignore[i]) {
			continue;
		}
		this.i = i;
		if (!(cb = callbacks[i]))
			continue;
		if (cb.pipeRequires) {
			for (var j=0; j<cb.pipeRequires.length; j++) {
				if (this.ignore[cb.pipeRequires[j]]) {
					continue;
				}
				if (! (cb.pipeRequires[j] in params)) {
					continue cbloop;
				}
			}
		}
		if (cb.pipeRemaining) {
			if (!--cb.pipeRemaining) {
				delete callbacks[i];
			}
		}
		ret = cb.call(this, this.params, this.subjects, cb.pipeRequires);
		++count;
		if (ret === false) {
			delete callbacks[i];
		} else if (ret === true) {
			this.callbacks = []; // clean up memory
			this.finished = true;
			break;
		}
	}
};


/**
 * This function helps create "batch functions", which can be used in getter functions
 * and other places to accomplish things in batches.
 * @param batch {Function}
 *  This is the function you must write to implement the actual batching functionality.
 *  It is passed the arguments, subjects and callbacks that were collected by Q.batcher
 *  from the individual calls that triggered your batch function to be run.
 *  Your batch function is supposed to cycle through the callbacks array -- where each
 *  entry is the array of (one or more) callbacks the client passed during a particular
 *  call -- and Q.handle the appropriate one.
 *  NOTE: When receiving results from the server, make sure the order in which
 *  results are returned matches the order in which your batch function was provided the
 *  arguments from the individual calls. This will help you call the correct callbacks.
 *  Typically you would serialize the array of arguments e.g. into JSON when sending 
 *  the request down to the server, and the server should also return an array of results
 *  that is in the same order.
 * @param options {Object}
 *  An optional hash of possible options, which can include:
 *  "max": Defaults to 10. When the number of individual calls in the queue reaches this,
 *         the batch function is run.
 *  "ms": Defaults to 50. When this many milliseconds elapse without another call to the
 *         same batcher function, the batch function is run.
 * @return {Function} It returns a function that the client can use as usual, but which,
 * behind the scenes, queues up the calls and then runs a batch function that you write.
 */
Q.batcher = function _Q_batch(batch, options) {
	var o = Q.extend({
		max: 10,
		ms: 50
	}, options);
	var result = function _Q_batch_result() {
		var i, j;
		var callbacks = [], args = [], argmax = 0, cbmax = 0;

		// separate fields and callbacks
		for (i=0; i<arguments.length; ++i) {
			if (typeof arguments[i] === 'function') {
				callbacks.push(arguments[i]);
			} else {
				args.push(arguments[i]);
			}
		}
		if (!batch.count) batch.count = 0;
		if (!batch.argmax) batch.argmax = 0;
		if (!batch.cbmax) batch.cbmax = 0;

		++batch.count;
		if (callbacks.length > batch.cbmax) batch.cbmax = callbacks.length;
		if (args.length > batch.argmax) batch.argmax = args.length;

		// collect various arrays for convenience of writing batch functions,
		// at the expense of extra work and memory
		if (!batch.subjects) batch.subjects = [];
		if (!batch.args) batch.args = [];
		if (!batch.callbacks) batch.callbacks = [];

		batch.subjects.push(this);
		batch.args.push(args);
		batch.callbacks.push(callbacks);

		if (batch.timeout) {
			clearTimeout(batch.timeout);
		}
		function runBatch() {
			batch.call(this, batch.subjects, batch.args, batch.callbacks);
			batch.subjects = batch.args = batch.callbacks = null;
			batch.count = 0;
			batch.argmax = 0;
			batch.cbmax = 0;
		}
		if (batch.count == o.max) {
			runBatch();
		} else {
			batch.timeout = setTimeout(runBatch, o.ms);
		}
	};
	result.batch = batch;
	result.cancel = function () {
		clearTimeout(batch.timeout);
	};
	return result;
};

/**
 * Helper function for Q.Cache and Q.getter
 */
function _getKey(args, functions) {
	var i, keys = [];
	for (i=0; i<args.length; ++i) {
		if (typeof args[i] !== 'function') {
			keys.push(args[i]);
		} else if (functions && functions.push) {
			functions.push(args[i]);
		}
	}
	return JSON.stringify(keys);
}

/**
 * Wraps a getter function to provide support for re-entrancy, cache and throttling.
 *  It caches based on all non-function arguments which were passed to the function.
 *  If this object has methods called get(key) and set(key, cbpos, subject, params), then
 *  they are called instead of simply getting and setting key-value pairs in the object.
 *  get retuns object {cbpos, subject, params}, set - nothing.
 *  If it has the method remove(args), it is called when a cache entry needs to be unset.
 *  All functions passed in as arguments are considered as callbacks. Getter execution is
 *  considered complete when one of the callbacks is fired. If any other callback is fired,
 *  throttling may be influenced - i.e. throttleSize will increase by number of callbacks fired.
 *  If the original function has a "batch" property, it gets copied as a property of
 *  the wrapper function being returned. This is useful when calling Q.getter(Q.batcher(...))
 *  Call method .forget with the same arguments as original getter to clear cache record
 *  and update it on next call to getter (if it happen)
 * @method getter
 * @param original Function The original getter function to be wrapped
 *  Can also be an array of [getter, execute] which you can use if
 *  your getter does "batching", and waits a tiny bit before sending the batch request,
 *  to see if any more will be requested. In this case, the execute function
 *  is supposed to execute the batched request without waiting any more.
 * @param options Object An optional hash of possible options, which include:
 *
 * * "throttle" => a String id to throttle on, or an Object that supports the throttle interface:
 *  - "throttle.throttleTry" => function(subject, getter, args) - applies or throttles getter with subject, args
 *  - "throttle.throttleNext" => function (subject) - applies next getter with subject
 *  - "throttleSize" => defaults to 100. Integer representing the size of the throttle, if it is enabled
 * * "cache" => pass false here to prevent caching, or an object which supports the cache interface
 * @return {number} Result code
 *
 * * 0 if found in cache,
 * * 1 if throttled,
 * * 2 if run,
 * * 3 if waiting for other request to deliver data
 */
Q.getter = function _Q_getter(original, options) {
	
	Q.extend(result, Q.getter.options, options);
	
	var _waiting = {};
	if (result.cache === false) {
		// no cache
		result.cache = null;
	} else if (result.cache === true) {
		// create our own Object that will cache locally in the page
		result.cache = Q.Cache.document(++_Q_getter_i);
	} else {
		// assume we were passed an Object that supports the cache interface
	}
	
	result.throttle = result.throttle || null;
	if (result.throttle === true) {
		result.throttle = '';
	}
	if (typeof result.throttle === 'string') {
		// use our own objects
		if (!Q.getter.throttles[result.throttle]) {
			Q.getter.throttles[result.throttle] = {};
		}
		result.throttle = Q.getter.throttles[result.throttle];
	}

	if (typeof JSON === 'undefined' || !JSON.stringify) {
		throw new Error("Need JSON.stringify to be defined");
	}

	function result() {
		var i, j, key, that = this, arguments2 = Array.prototype.slice.call(arguments);
		var callbacks = [];

		// separate fields and callbacks
		key = _getKey(arguments2, callbacks);
		if (callbacks.length === 0) {
			// in case someone forgot to pass a callback
			// pretend they added a callback at the end
			noop = function _noop() {} ;
			arguments2.push(noop);
			callbacks.push(noop);
		}

		var cached, cbpos;

		// if caching required check the cache -- maybe the result is there
		if (result.cache) {
			cached = result.cache.get(key);
			if (cached) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					callbacks[cbpos].apply(cached.subject, cached.params);
					return 0; // result found in cache, callback and throttling have run
				}
			}
		}
		
		if (_waiting[key]) {
			_waiting[key].push(callbacks);
			return 3; // the request is already in process - let's wait
		} else {
			_waiting[key] = [];
		}

		// replace the callbacks with smarter functions
		var args = [];
		for (i=0, cbi=0; i<arguments2.length; i++) {
			
			// we only care about functions
			if (typeof arguments2[i] !== 'function') {
				args.push(arguments2[i]); // regular argument
				continue;
			}
			
			args.push((function (cb, cbpos) {
				// make a function specifically to call the
				// callbacks in position pos, and then decrement
				// the throttle
				return function () {

					// save the results in the cache
					if (result.cache) {
						result.cache.set(key, cbpos, this, arguments);
					}
					cb.apply(this, arguments); // execute the waiting callback in position cbpos
					
					// process waiting callbacks
					if (_waiting[key]) {
						for (i = 0; i < _waiting[key].length; i++) {
							_waiting[key][i][cbpos].apply(this, arguments);
						}
						delete _waiting[key]; // check if need to delete item by item ***
					}
					
					// tell throttle to execute the next function, if any
					if (result.throttle && result.throttle.throttleNext) {
						result.throttle.throttleNext(that);
					}
				};
			})(callbacks[cbi], cbi));
			++cbi; // the index in the array of callbacks
		}

		if (!result.throttle) {
			// no throttling, just run the function
			original.apply(that, args);
			return 2;
		}
		
		if (!result.throttle.throttleTry) {
			// the throttle object is probably not set up yet
			// so set it up
			var p = {
				size: result.throttleSize,
				count: 0,
				queue: [],
				args: []
			};
			result.throttle.throttleTry = function _throttleTry(that, getter, args) {
				++p.count;
				if (p.size === null || p.count <= p.size) {
					getter.apply(that, args);
					return true;
				}
				// throttle is full, so queue this function
				p.queue.push(getter);
				p.args.push(args);
				return false;
			};
			result.throttle.throttleNext = function _throttleNext(that) {
				if (--p.count < 0) throw new Error("Throttle count out of range!");
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!result.throttleSize) {
			result.throttle.throttleSize = function _throttleSize(newSize) {
				if (typeof(newSize) === 'undefined') {
					return p.size;
				}
				p.size = newSize;
			};
		}
		
		// execute the throttle
		if (result.throttle.throttleTry(this, original, args)) {
			return 2;
		} else {
			return 1;
		}
	};

	result.forget = function _forget() {
		var key = _getKey(arguments);
		if (key && result.cache) {
	        result.cache.remove(key);
	    }
	};

	if (original.batch) {
		result.batch = original.batch;
	}
	return result;
};
_Q_getter_i = 0;
Q.getter.options = {
	cache: true,
	throttle: null,
	throttleSize: 100,
	cache: true
};
Q.getter.throttles = {};
Q.getter.cache = {};
Q.getter.waiting = {};

/**
 * Q.Cache constructor
 * @namespace Q
 * @class Cache
 * @constructor
 * @param {Object} [options={}] you can pass the following options:
 *  "max": the maximum number of items the cache should hold. Defaults to 100.
 */
Q.Cache = function  _Q_Cache(options) {
	options = options || {};
	this.name = options.name;
	this.data = {};
	this.max = options.max || 100;
	this.earliest = this.latest = null;
	this.count = 0;
};
/**
 * @method set
 * Accesses the cache and sets an entry in it
 * @param {String} key
 * @param {Number} cbpos
 * @param {Object} subject
 * @param {Object} params
 * @param {Object} options supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
	if (typeof key !== 'string') {
		key = _getKey(key);
	}
	var existing = this.data[key], previous;
	if (!options || !options.dontTouch) {
		// marks the item as being recently used, if it existed in the cache already
		existing = this.get(key);
		if (!existing) {
			++this.count;
		}
	}
	var value = {
		cbpos: cbpos,
		subject: subject,
		params: params,
		prev: (options && options.prev) ? options.prev : (existing ? existing.prev : this.latest),
		next: (options && options.next) ? options.next : (existing ? existing.next : null)
	};
	this.data[key] = value;
	if (!existing || (!options || !options.dontTouch)) {
		if (previous = this.data[value.prev]) {
			previous.next = key;
		}
		this.latest = key;
		if (this.count === 1) {
			this.earliest = key;
		}
	}
	if (this.count > this.max) {
		this.remove(this.earliest);
	}
	return existing ? true : false;
};
/**
 * @method get
 * Accesses the cache and gets an entry from it
 * @param {String} key
 * @param {Object} options supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {mixed} whatever is stored there, or else returns undefined
 */
Q.Cache.prototype.get = function _Q_Cache_prototype_get(key, options) {
	if (typeof key !== 'string') {
		key = _getKey(key);
	}
	if (!(key in this.data)) {
		return undefined;
	}
	var existing = this.data[key], previous;
	if ((!options || !options.dontTouch) && this.latest !== key) {
		if (this.earliest == key) {
			this.earliest = existing.next;
		}
		existing.prev = this.latest;
		existing.next = null;
		if (previous = this.data[existing.prev]) {
			previous.next = key;
		}
		this.latest = key;
	}
	return existing;
};
/**
 * @method remove
 * Accesses the cache and removes an entry from it.
 * @param key {String} the key of the entry to remove
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.remove = function _Q_Cache_prototype_remove(key) {
	if (typeof key !== 'string') {
		key = _getKey(key);
	}
	if (!(key in this.data)) {
		return false;
	}
	var existing = this.data[key];
	--this.count;
	if (this.latest === key) {
		this.latest = existing.prev;
	}
	if (this.earliest === key) {
		this.earliest = existing.next;
	}
	delete this.data[key];
	return true;
};
/**
 * @method clear
 * @param  {string} key
 */
Q.Cache.prototype.clear = function _Q_Cache_prototype_clear(key) {
	this.data = {};
};
/**
 * Cycles through all the entries in the cache
 * @param args {Array} An array consisting of some or all the arguments that form the key
 * @param callback {Function} Is passed two parameters: key, value, with this = the cache
 */
Q.Cache.prototype.each = function _Q_Cache_prototype_clear(args, callback) {
    var cache = this;
    var prefix = null;
    if (typeof args === 'function') {
        callback = args;
        args = undefined;
    } else {
        var json = _getKey(args);
        prefix = json.substring(0, json.length-1);
    }
    return Q.each(this.data, function (key, item) {
        if (prefix && k.substring(0, prefix.length) !== prefix) {
            return;
        }
        if (callback.call(cache, key, item) === false) {
            return false;
        }
    });
};
/**
 * @method local
 * @param  {string} name
 * @return {mixed}
 */
Q.Cache.local = function _Q_Cache_local(name) {
	console.log('a');
	if (!Q.Cache.local.caches[name]) {
		Q.Cache.local.caches[name] = new Q.Cache({name: name});
	}
	return Q.Cache.local.caches[name];
};
Q.Cache.local.caches = {};

/**
 * @class Q
 */
/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @method handle
 * @param callables {callable} The callables to call
 * @param context {object} The context in which to call them
 * @param args {array} An array of arguments to pass to them
 * @return {number} The number of handlers executed
 */
Q.handle = function _Q_handle(callables, context, args) {
	if (!callables) {
		return 0;
	}
	var i=0, count= 0, result;
	switch (Q.typeOf(callables)) {
	 case 'function':
		result = callables.apply(
			context ? context : null,
			args ? args : []
		);
		if (result === false) return false;
		return 1;
	 case 'array':
		for (i=0; i<callables.length; ++i) {
			result = Q.handle(callables[i], context, args);
			if (result === false) return false;
			count += result;
		}
		return count;
	 case 'object':
		for (k in callables) {
			result = Q.handle(callables[k], context, args);
			if (result === false) return false;
			count += result;
		}
		return count;
	 case 'Q.Event':
		for (i=0; i<callables.keys.length; ++i) {
			result = Q.handle(callables.handlers[ callables.keys[i] ], context, args);
			if (result === false) return false;
			count += result;
		}
		callables.occurred = true;
		callables.lastContext = context;
		callables.lastArgs = args;
		return count;
	 default:
		return 0;
	}
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * @method each
 * @param {array|object|string|number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {function} callback
 *  A function with two parameters
 *  index: the index
 *  value: the value
 * @param {Object} options
 *  ascending: Optional. Pass true here to traverse in ascending key order, false in descending.
 *  numeric: Optional. Used together with ascending. Use numeric sort instead of string sort.
 *  hasOwnProperty: Optional. Set to true to skip properties found on the prototype chain.
 * @throws {Q.Exception} If container is not array, object or string
 */
Q.each = function _Q_each(container, callback, options) {
	var i, k, length, r;
	switch (Q.typeOf(container)) {
		default:
			// Assume it is an array-like structure.
			// Make a copy in case it changes during iteration. Then iterate.
			container = Array.prototype.slice.call(container, 0);
		case 'array':
			length = container.length;
			if (!container || !length || !callback) return;
			if (options && options.ascending === false) {
				for (i=length-1; i>=0; --i) {
					r = Q.handle(callback, container[i], [i, container[i]]);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, container[i], [i, container[i]]);
					if (r === false) return false;
				}
			}
			break;
		case 'object':
			if (!container || !callback) return;
			if (options && ('ascending' in options)) {
				var keys = [], key;
				for (k in container) {
					if (options.hasOwnProperty && !Q.has(container, k)) {
						continue;
					}
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						keys.push(options.numeric ? Number(k) : k);
					}
				}
				keys = options.numeric ? keys.sort(function (a,b) {return a-b;}) : keys.sort();
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], [key, container[key]]);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], [key, container[key]]);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], [k, container[k]]);
						if (r === false) return false;
					}
				}
			}
			break;
		case 'string':
			if (!container || !callback) return;
			if (options && options.ascending === false) {
				for (i=0; i<container.length; ++i) {
					r = Q.handle(callback, container, [i, container.charAt(i)]);
					if (r === false) return false;
				}
			} else {
				for (i=container.length-1; i>=0; --i) {
					r = Q.handle(callback, container, [i, container.charAt(i)]);
					if (r === false) return false;
				}
			}
			break;
		case 'number':
			var from = 0, to=container, step;
			if (typeof arguments[1] === 'number') {
				from = arguments[0];
				to = arguments[1];
				if (typeof arguments[2] === 'number') {
					step = arguments[2];
					if (!step || (to-from)*step<0) {
						throw new Q.Exception("Q.each: step="+step+" leads to infinite loop");
					}
					callback = arguments[3];
					options = arguments[4];
				} else {
					callback = arguments[2];
					options = arguments[3];
				}
			}
			if (!callback) return;
			if (step === undefined) {
				step = (from <= to ? 1 : -1);
			}
			if (from <= to) {
				for (i=from; i<=to; i+=step) {
					r = Q.handle(callback, this, [i]);
					if (r === false) return false;
				}
			} else {
				for (i=from; i>=to; i+=step) {
					r = Q.handle(callback, this, [i]);
					if (r === false) return false;
				}
			}
			break;
	}
}

/**
 * Returns the first index in a container with a value that's not undefined
 * @method first
 * @param {Array|Object|String} container
 * @param {Object} options
 *  "nonEmpty": return the first nonempty key
 * @return {Number|String}
 *  the index in the container, or null
 * @throws {Q.Exception} If container is not array, object or string
 */
Q.first = function _Q_first(container, options) {
	if (!container) {
		return null;
	}
	switch (typeof container) {
		case 'array':
			for (var i=0; i<container.length; ++i) {
				if (container[i] !== undefined) {
					return i;
				}
			}
			break;
		case 'object':
			for (var k in container) {
				if (container.hasOwnProperty(k)
				&& container[k] !== undefined) {
					if (k || !options || !options.nonEmpty) {
						return k;
					}
				}
			}
			break;
		case 'string':
			return 0;
		default:
			throw new Q.Exception("Q.first: container has to be an array, object or string");
	}
	return null;
};

/**
 * Returns a container with the items in the first parameter that are not in the others
 * @method first
 * @param {Array|Object} container to subtract items from to form the result
 * @param {Array|Object} container whose items are subtracted in the result
 * @param {Function} comparator accepts item1, item2, index1, index2) and returns whether two items are equal
 * @return {Array|Object} a container of the same type as container1, but without elements of container2
 */
Q.diff = function _Q_diff(container1, container2, /*, ... */ comparator) {
    if (!container1 || !container2) {
        return container1;
    }
    var len = arguments.length;
    comparator = arguments[len-1];
    if (typeof comparator !== 'function') {
        throw new Q.Exception("Q.diff: comparator must be a function");
    }
    var isArr = (Q.typeOf(container1) === 'array');
    var result = isArr ? [] : {};
    Q.each(container1, function (i, v1) {
        var found = false;
        for (var i=1; i<len-1; ++i) {
            Q.each(arguments[i], function (j, v2) {
                if (comparator(v1, v2, i, j)) {
                    found = true;
                    return false;
                }
            });
            if (found) {
                break;
            }
        }
        if (!found) {
            if (isArr) {
                result.push(v1);
            } else {
                result[i] = v1;
            }
        }
    });
	return result;
};

/**
 * Tests whether a variable contains a false value,
 * or an empty object or array.
 * @method isEmpty
 * @param o {object} The object to test.
 */
Q.isEmpty = function _Q_isEmpty(o) {
	if (!o) {
		return true;
	}
	var i, v, t;
	t = Q.typeOf(o);
	if (t === 'object') {
		for (i in o) {
			v = o[i];
			if (v !== undefined) {
				return false;
			}
		}
		return true;
	} else if (t === 'array') {
		return (o.length === 0);
	}
	return false;
};

/**
 * Determines whether something is a plain object created within Javascript,
 * or something else, like a DOMElement or Number
 * @return Boolean
 *  Returns true only for a non-null plain object
 */
Q.isPlainObject = function (x) {
	if (x === null || typeof x !== 'object') {
		return false;
	}
	if (Object.prototype.toString.apply(x) !== "[object Object]") {
		return false;
	}
	return true;
};

/**
 * Makes a shallow copy of an object. But, if any property is an object with a "copy" method,
 * it recursively calls that method to copy the property.
 * @param {array} fields
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @return Object
 *  Returns the shallow copy where some properties may have deepened the copy
 */
Q.copy = function _Q_copy(x, fields) {
	if (Q.typeOf(x) === 'array') {
		return x.slice(0);
	}
	if (x && typeof x.copy === 'function') {
		return x.copy();
	}
	if (x === null || !Q.isPlainObject(x)) {
		return x;
	}
	var result = Q.objectWithPrototype(Object.getPrototypeOf(x)), i, k, l;
	if (fields) {
		l = fields.length;
		for (i=0; i<l; ++i) {
			k = fields[i];
			if (!(k in x)) continue;
			if (x[k] && typeof(x[k].copy) === 'function') {
				result[k] = x[k].copy();
			} else {
				result[k] = x[k];
			}
		}
	} else {
		for (k in x) {
			if (!Q.has(x, k)) {
				continue;
			}
			if (x[k] && typeof(x[k].copy) === 'function') {
				result[k] = x[k].copy();
			} else {
				result[k] = x[k];
			}
		}
	}
	return result;
};

/**
 * Extends an object with other objects. Similar to the jQuery method.
 * @param target {Object}
 *  This is the first object. It winds up being modified, and also returned
 *  as the return value of the function.
 * @param deep {Boolean|Number}
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
 *  Precede it with a nonzero integer to indicate that we should also copy
 *  that many additional levels inside the object.
 * @param anotherObject {Object}
 *  Put as many objects here as you want, and they will extend the original one.
 * @param namespace {String}
 *  At the end, you can specify namespace to add to handlers added to any Q.Event during this operation
 * @return
 *  The extended object.
 */
Q.extend = function _Q_extend(target /* [[deep,] anotherObject], ... [, namespace] */ ) {
	var length = arguments.length;
	var namespace = undefined;
	if (typeof arguments[length-1] === 'string') {
		namespace = arguments[length-1];
		--length;
	}
	if (length === 0) {
		return {};
	}
	target = target || {};
	var deep = false, levels = 0;
	// shim for Object.hasOwnProperty
	var __hasProp = Object.prototype.hasOwnProperty || function(key) { return key in self; };
	for (var i=1; i<length; ++i) {
		var arg = arguments[i];
		if (!arg) {
			continue;
		}
		if (arg === true) {
			deep = true;
			continue;
		}
		if (arg === false) {
			continue;
		}
		if (typeof(arg) === 'number' && arg) {
			levels = arg;
			continue;
		}
		for (var k in arg) {
			if (deep === true || (arg.hasOwnProperty && arg.hasOwnProperty(k))
				|| (!arg.hasOwnProperty && (k in arg)))
			{
				var a = arg[k];
				if ((k in target) && Q.typeOf(target[k]) === 'Q.Event') {
					if (a && a.constructor === Object) {
						for (var m in a) {
							target[k].set(a[m], m);
						}
					} else {
						target[k].set(a, namespace);
					}
				} else if (!levels || !Q.isPlainObject(a)
				|| Q.typeOf(arg[k]) === 'Q.Event'
				|| (a.constructor == Object)) {
					target[k] = Q.copy(a);
				} else {
					target[k] = Q.extend(target[k], deep, levels-1, a);
				}
			}
		}
		deep = false;
		levels = 0;
	}
	return target;
};

/**
 * Extends an object with other objects. Similar to the jQuery method.
 * @param target {Object}
 *  This is the first object. It winds up being modified, and also returned
 *  as the return value of the function.
 * @param deep {Boolean|Number}
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
 *  Precede it with a nonzero integer to indicate that we should also copy
 *  that many additional levels inside the object.
 * @param anotherObject {Object}
 *  Put as many objects here as you want, and they will extend the original one.
 * @param namespace {String}
 *  At the end, you can specify namespace to add to handlers added to any Q.Event during this operation
 * @return
 *  The extended object.
 */
Q.extend = function _Q_extend(target /* [[deep,] anotherObject], ... [, namespace] */ ) {
	var length = arguments.length;
	var namespace = undefined;
	if (typeof arguments[length-1] === 'string') {
		namespace = arguments[length-1];
		--length;
	}
	if (length === 0) {
		return {};
	}
	target = target || {};
	var deep = false, levels = 0;
	// shim for Object.hasOwnProperty
	var __hasProp = Object.prototype.hasOwnProperty || function(key) { return key in self; };
	for (var i=1; i<length; ++i) {
		if (!arguments[i]) {
			continue;
		}
		if (arguments[i] === true) {
			deep = true;
			continue;
		}
		if (arguments[i] === false) {
			continue;
		}
		if (typeof(arguments[i]) === 'number' && arguments[i]) {
			levels = arguments[i];
			continue;
		}
		var arg = arguments[i];
		for (var k in arg) {
			if (deep === true || (arg.hasOwnProperty && arg.hasOwnProperty(k))
				|| (!arg.hasOwnProperty && (k in arg)))
			{
				if ((k in target) && Q.typeOf(target[k]) === 'Q.Event') {
					target[k].set(Q.copy(arguments[i][k]), namespace);
				} else if (levels && Q.isPlainObject(arguments[i][k])) {
					target[k] = Q.extend(target[k], deep, levels-1, arguments[i][k]);
				} else {
					target[k] = Q.copy(arguments[i][k]);
				}
			}
		}
		deep = false;
		levels = 0;
	}
	return target;
};

/**
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * @method mixin
 * @param A {function} The constructor corresponding to the "class" we are mixing functionality into
 *  This function will get the following members set:
 *
 * * __mixins: an array of [B, C, ...]
 * * constructors(subject, params): a method to call the constructor of all mixing classes, in order. Pass this to it.
 * * staticProperty(property): a method for getting a property name
 * @param B {function} One or more constructors representing "classes" to mix functionality from
 *  They will be tried in the order they are provided, meaning methods from earlier ones
 *  override methods from later ones.
 * @throws {Error} if argument is not a function
 */
Q.mixin = function _Q_mixin(A, B) {
	var __mixins = (A.__mixins || (A.__mixins = []));
	for (var i = 1, l = arguments.length; i < l; ++i) {
		var mixin = arguments[i];
		if (typeof mixin !== 'function') {
			throw new Error("Q.mixin: argument " + i + " is not a function");
		}
		Q.extend(A.prototype, mixin.prototype);
		for (var k in mixin) {
			if (!(k in A) && typeof mixin[k] === 'function') {
				A[k] = mixin[k];
			}
		}
		if (mixin.__mixins) {
			Array.prototype.splice.apply(__mixins, [__mixins.length, 0].concat(mixin.__mixins));
		}
		__mixins.push(arguments[i]);
	}

	A.prototype.constructors = function _constructors(args) {
		if (!this.constructor.__mixins) {
			console.log(this);
			console.log(this.constructor);
			throw new Error("Q.mixin: mixinObject.constructors() called on something that does not have mixins info");
		}
		for (var mixins = this.constructor.__mixins, i = 0, l = mixins.length; i < l; ++i) {
			mixins[i].apply(this, args);
		}
	};
	
	A.staticProperty = function _staticProperty(propName) {
		for (var i=0; i<A.__mixins.length; ++i) {
			if (propName in A.__mixins[i]) {
				return A.__mixins[i].propName;
			}
		}
		return undefined;
	};
};

/**
 * Use this function to create "Classes", i.e. functions that construct objects
 * @param construct {Function}
 *  The constructor function to call when the object's mixins have been constructed
 * @param Base1 {Function}
 *  One or more constructors (e.g. other Classes) that will be mixed in as base classes
 * @param properties {Object}
 *  Here you can pass properties to add to the prototype of the class constructor
 * @param classProperties {Object}
 *  Here you can pass properties to add to the class constructor
 * @return {Function} a constructor for the class
 */
Q.Class = function _Q_Class(construct /* [, Base1, ...] [, properties, [classProperties]] */) {
	var i, j, l = arguments.length;
	for (i=1, j=1; i<l; ++i) {
		if (typeof arguments[i] !== 'function') break;
		j = i;
	};
	var constructors = Array.prototype.slice.call(arguments, 1, j+1);
	constructors.unshift(Q_ClassConstructor);
	
	function Q_ClassConstructor() {
		this.constructors.apply(this, arguments);
		construct && construct.apply(this, arguments);
	}
	
	if (typeof arguments[++j] === 'object') {
		Q.extend(Q_ClassConstructor.prototype, arguments[j]);
		if (typeof arguments[++j] === 'object') {
			Q.extend(Q_ClassConstructor, arguments[j]);
		}
	}
	
	Q.mixin.apply(Q, constructors);
	return Q_ClassConstructor;
};

/**
 * @method take
 * @param source {object} An Object from which to take things
 * @param fields {array|object} An array of fields to take or an object of fieldname: default pairs
 * @return {object} a new Object
 */
Q.take = function _Q_take(source, fields) {
	var result = {};
	if (Q.typeOf(fields) === 'array') {
		for (var i = 0; i < fields.length; ++i) {
			result [ fields[i] ] = source [ fields[i] ];
		}
	} else {
		for (var k in fields) {
			result[k] = (k in source) ? source[k] : fields[k];
		}
	}
	return result;
};

/**
 * Returns whether an object contains a property directly
 * @method has
 * @param obj Object
 * @param key String
 * @return Boolean
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * Shuffles an array
 * @method shuffle
 * @param arr {array} The array taht gets passed here is shuffled in place
 */
Q.shuffle = function _Q_shuffle( arr ) {
	var i = arr.length;
	if ( !i ) return false;
	while ( --i ) {
	var j = Math.floor( Math.random() * ( i + 1 ) );
		var tempi = arr[i];
		var tempj = arr[j];
		arr[i] = tempj;
		arr[j] = tempi;
	}
};

/**
 * Returns microtime like PHP
 * @method microtime
 * @param get_as_float {Boolean}
 * @return {String}
 */
Q.microtime = function _Q_microtime(get_as_float) {
	// http://kevin.vanzonneveld.net
	// +   original by: Paulo Freitas
	// *     example 1: timeStamp = microtime(true);
	// *     results 1: timeStamp > 1000000000 && timeStamp < 2000000000
	var now = new Date().getTime() / 1000;
	var s = parseInt(now, 10);

	return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
};

/**
 * Default exception handler for Q
 * @method exceptionHandler
 * @param exception {exception}
 **/
Q.exceptionHandler = function _Q_exceptionHandler(exception) {
	// print the exception on the console and keep going
	console.log("UNCAUGHT EXCEPTION: " + exception.message);
	console.log("STACK TRACE:");
	console.log(exception.stack);
};
process.on('uncaughtException', Q.exceptionHandler);

/**
 * Search for directory and passes to callback if found. Passes an error if not directory
 * @method dir
 * @param start {string} Directory path
 * @param [callback=null] {function} Callback functions with arguments "error", "result" where result
 *	is an object `{dirs: [...], files: [...]}`
 */
Q.dir = function _Q_dir(start, callback) {
	// Use lstat to resolve symlink if we are passed a symlink
	fs.lstat(start, function(err, stat) {
		if(err) {
			callback && callback(err);
			return;
		}
		var found = {dirs: [], files: []},
			total = 0,
			processed = 0;
		function isDir(abspath) {
			fs.stat(abspath, function(err, stat) {
				if(stat.isDirectory()) {
					found.dirs.push(abspath);
					// If we found a directory, recurse!
					Q.dir(abspath, function(err, data) {
						found.dirs = found.dirs.concat(data.dirs);
						found.files = found.files.concat(data.files);
						if(++processed == total) {
							callback && callback(null, found);
						}
					});
				} else {
					found.files.push(abspath);
					if(++processed == total) {
						callback && callback(null, found);
					}
				}
			});
		}
		// Read through all the files in this directory
		if(stat.isDirectory()) {
			fs.readdir(start, function (err, files) {
				if (files.length) {
					total = files.length;
					for(var x=0, l=files.length; x<l; x++) {
						isDir(path.join(start, files[x]));
					}            		
				} else {
					callback && callback(null, {dirs: [], files: []});
				}
			});
		} else {
			callback && callback(new Error("path: " + start + " is not a directory"));
		}
	});
};

// Hashes
var hexcase=0;
var b64pad="";
function any_md5(a,b){return rstr2any(rstr_md5(str2rstr_utf8(a)),b);}
function any_hmac_md5(a,c,b){return rstr2any(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(c)),b);}
function md5_vm_test(){return hex_md5("abc").toLowerCase()=="900150983cd24fb0d6963f7d28e17f72";}
function rstr_md5(a){return binl2rstr(binl_md5(rstr2binl(a),a.length*8));}
function rstr_hmac_md5(c,f){var e=rstr2binl(c);if(e.length>16){e=binl_md5(e,c.length*8);}var a=Array(16),d=Array(16);for(var b=0;b<16;b++){a[b]=e[b]^909522486;d[b]=e[b]^1549556828;}var g=binl_md5(a.concat(rstr2binl(f)),512+f.length*8);return binl2rstr(binl_md5(d.concat(g),512+128));}
function rstr2hex(c){try{hexcase;}catch(g){hexcase=0;}var f=hexcase?"0123456789ABCDEF":"0123456789abcdef";var b="";var a;for(var d=0;d<c.length;d++){a=c.charCodeAt(d);b+=f.charAt((a>>>4)&15)+f.charAt(a&15);}return b;}
function rstr2b64(c){try{b64pad;}catch(h){b64pad="";}var g="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";var b="";var a=c.length;for(var f=0;f<a;f+=3){var k=(c.charCodeAt(f)<<16)|(f+1<a?c.charCodeAt(f+1)<<8:0)|(f+2<a?c.charCodeAt(f+2):0);for(var d=0;d<4;d++){if(f*8+d*6>c.length*8){b+=b64pad;}else{b+=g.charAt((k>>>6*(3-d))&63);}}}return b;}
function rstr2any(m,c){var b=c.length;var l,f,a,n,e;var k=Array(Math.ceil(m.length/2));for(l=0;l<k.length;l++){k[l]=(m.charCodeAt(l*2)<<8)|m.charCodeAt(l*2+1);}var h=Math.ceil(m.length*8/(Math.log(c.length)/Math.log(2)));var g=Array(h);for(f=0;f<h;f++){e=Array();n=0;for(l=0;l<k.length;l++){n=(n<<16)+k[l];a=Math.floor(n/b);n-=a*b;if(e.length>0||a>0){e[e.length]=a;}}g[f]=n;k=e;}var d="";for(l=g.length-1;l>=0;l--){d+=c.charAt(g[l]);}return d;}
function str2rstr_utf8(c){var b="";var d=-1;var a,e;while(++d<c.length){a=c.charCodeAt(d);e=d+1<c.length?c.charCodeAt(d+1):0;if(55296<=a&&a<=56319&&56320<=e&&e<=57343){a=65536+((a&1023)<<10)+(e&1023);d++;}if(a<=127){b+=String.fromCharCode(a);}else{if(a<=2047){b+=String.fromCharCode(192|((a>>>6)&31),128|(a&63));}else{if(a<=65535){b+=String.fromCharCode(224|((a>>>12)&15),128|((a>>>6)&63),128|(a&63));}else{if(a<=2097151){b+=String.fromCharCode(240|((a>>>18)&7),128|((a>>>12)&63),128|((a>>>6)&63),128|(a&63));}}}}}return b;}
function str2rstr_utf16le(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode(b.charCodeAt(c)&255,(b.charCodeAt(c)>>>8)&255);}return a;}
function str2rstr_utf16be(b){var a="";for(var c=0;c<b.length;c++){a+=String.fromCharCode((b.charCodeAt(c)>>>8)&255,b.charCodeAt(c)&255);}return a;}
function rstr2binl(b){var a=Array(b.length>>2),c;for(c=0;c<a.length;c++){a[c]=0;}for(c=0;c<b.length*8;c+=8){a[c>>5]|=(b.charCodeAt(c/8)&255)<<(c%32);}return a;}
function binl2rstr(b){var a="";for(var c=0;c<b.length*32;c+=8){a+=String.fromCharCode((b[c>>5]>>>(c%32))&255);}return a;}
function binl_md5(p,k){p[k>>5]|=128<<((k)%32);p[(((k+64)>>>9)<<4)+14]=k;var o=1732584193;var n=-271733879;var m=-1732584194;var l=271733878;for(var g=0;g<p.length;g+=16){var j=o;var h=n;var f=m;var e=l;o=md5_ff(o,n,m,l,p[g+0],7,-680876936);l=md5_ff(l,o,n,m,p[g+1],12,-389564586);m=md5_ff(m,l,o,n,p[g+2],17,606105819);n=md5_ff(n,m,l,o,p[g+3],22,-1044525330);o=md5_ff(o,n,m,l,p[g+4],7,-176418897);l=md5_ff(l,o,n,m,p[g+5],12,1200080426);m=md5_ff(m,l,o,n,p[g+6],17,-1473231341);n=md5_ff(n,m,l,o,p[g+7],22,-45705983);o=md5_ff(o,n,m,l,p[g+8],7,1770035416);l=md5_ff(l,o,n,m,p[g+9],12,-1958414417);m=md5_ff(m,l,o,n,p[g+10],17,-42063);n=md5_ff(n,m,l,o,p[g+11],22,-1990404162);o=md5_ff(o,n,m,l,p[g+12],7,1804603682);l=md5_ff(l,o,n,m,p[g+13],12,-40341101);m=md5_ff(m,l,o,n,p[g+14],17,-1502002290);n=md5_ff(n,m,l,o,p[g+15],22,1236535329);o=md5_gg(o,n,m,l,p[g+1],5,-165796510);l=md5_gg(l,o,n,m,p[g+6],9,-1069501632);m=md5_gg(m,l,o,n,p[g+11],14,643717713);n=md5_gg(n,m,l,o,p[g+0],20,-373897302);o=md5_gg(o,n,m,l,p[g+5],5,-701558691);l=md5_gg(l,o,n,m,p[g+10],9,38016083);m=md5_gg(m,l,o,n,p[g+15],14,-660478335);n=md5_gg(n,m,l,o,p[g+4],20,-405537848);o=md5_gg(o,n,m,l,p[g+9],5,568446438);l=md5_gg(l,o,n,m,p[g+14],9,-1019803690);m=md5_gg(m,l,o,n,p[g+3],14,-187363961);n=md5_gg(n,m,l,o,p[g+8],20,1163531501);o=md5_gg(o,n,m,l,p[g+13],5,-1444681467);l=md5_gg(l,o,n,m,p[g+2],9,-51403784);m=md5_gg(m,l,o,n,p[g+7],14,1735328473);n=md5_gg(n,m,l,o,p[g+12],20,-1926607734);o=md5_hh(o,n,m,l,p[g+5],4,-378558);l=md5_hh(l,o,n,m,p[g+8],11,-2022574463);m=md5_hh(m,l,o,n,p[g+11],16,1839030562);n=md5_hh(n,m,l,o,p[g+14],23,-35309556);o=md5_hh(o,n,m,l,p[g+1],4,-1530992060);l=md5_hh(l,o,n,m,p[g+4],11,1272893353);m=md5_hh(m,l,o,n,p[g+7],16,-155497632);n=md5_hh(n,m,l,o,p[g+10],23,-1094730640);o=md5_hh(o,n,m,l,p[g+13],4,681279174);l=md5_hh(l,o,n,m,p[g+0],11,-358537222);m=md5_hh(m,l,o,n,p[g+3],16,-722521979);n=md5_hh(n,m,l,o,p[g+6],23,76029189);o=md5_hh(o,n,m,l,p[g+9],4,-640364487);l=md5_hh(l,o,n,m,p[g+12],11,-421815835);m=md5_hh(m,l,o,n,p[g+15],16,530742520);n=md5_hh(n,m,l,o,p[g+2],23,-995338651);o=md5_ii(o,n,m,l,p[g+0],6,-198630844);l=md5_ii(l,o,n,m,p[g+7],10,1126891415);m=md5_ii(m,l,o,n,p[g+14],15,-1416354905);n=md5_ii(n,m,l,o,p[g+5],21,-57434055);o=md5_ii(o,n,m,l,p[g+12],6,1700485571);l=md5_ii(l,o,n,m,p[g+3],10,-1894986606);m=md5_ii(m,l,o,n,p[g+10],15,-1051523);n=md5_ii(n,m,l,o,p[g+1],21,-2054922799);o=md5_ii(o,n,m,l,p[g+8],6,1873313359);l=md5_ii(l,o,n,m,p[g+15],10,-30611744);m=md5_ii(m,l,o,n,p[g+6],15,-1560198380);n=md5_ii(n,m,l,o,p[g+13],21,1309151649);o=md5_ii(o,n,m,l,p[g+4],6,-145523070);l=md5_ii(l,o,n,m,p[g+11],10,-1120210379);m=md5_ii(m,l,o,n,p[g+2],15,718787259);n=md5_ii(n,m,l,o,p[g+9],21,-343485551);o=safe_add(o,j);n=safe_add(n,h);m=safe_add(m,f);l=safe_add(l,e);}return Array(o,n,m,l);}
function md5_cmn(h,e,d,c,g,f){return safe_add(bit_rol(safe_add(safe_add(e,h),safe_add(c,f)),g),d);}
function md5_ff(g,f,k,j,e,i,h){return md5_cmn((f&k)|((~f)&j),g,f,e,i,h);}
function md5_gg(g,f,k,j,e,i,h){return md5_cmn((f&j)|(k&(~j)),g,f,e,i,h);}
function md5_hh(g,f,k,j,e,i,h){return md5_cmn(f^k^j,g,f,e,i,h);}
function md5_ii(g,f,k,j,e,i,h){return md5_cmn(k^(f|(~j)),g,f,e,i,h);}
function safe_add(a,d){var c=(a&65535)+(d&65535);var b=(a>>16)+(d>>16)+(c>>16);return(b<<16)|(c&65535);}
function bit_rol(a,b){return(a<<b)|(a>>>(32-b));}
/**
 * Calculates MD5 hash
 * @method md5
 * @param a {string}
 * @return {string} The calculated hash
 */
Q.md5 = function _Q_md5(a){return rstr2hex(rstr_md5(str2rstr_utf8(a)));};
/**
 * Calculates b64_MD5 hash
 * @method b64_md5
 * @param a {string}
 * @return {string} The calculated hash
 */
Q.md5_b64 = function _Q_md5_b64(a){return rstr2b64(rstr_md5(str2rstr_utf8(a)));};
/**
 * Calculates MD5_HMAC hash
 * @method md5_hmac
 * @param a {string}
 * @param b {string}
 * @return {string} The calculated hash
 */
Q.md5_hmac = function _Q_md5_hmac(a,b){return rstr2hex(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)));};
/**
 * Calculates MD5_HMAC_b64 hash
 * @method md5_hmac_b64
 * @param a {string}
 * @param b {string}
 * @return {string} The calculated hash
 */
Q.md5_hmac_b64 = function _Q_md5_hmac_b64(a,b){return rstr2b64(rstr_hmac_md5(str2rstr_utf8(a),str2rstr_utf8(b)));};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * @method normalize
 * @param text {string} The text to normalize
 * @param [replacement='_'] {string} A string to replace one or more unacceptable characters.
 *  You can also change this default using the config Db/normalize/replacement
 * @param [characters='/[^A-Za-z0-9]+/'] {string} A regexp of characters that are not acceptable.
 *  You can also change this default using the config Db/normalize/characters
 * @return {string} The normalized string
 */
Q.normalize = function _Q_normalize(text, replacement, characters) {
	if (replacement === undefined) replacement = '_';
	characters = characters || new RegExp("[^A-Za-z0-9]+");
	result = text.toLowerCase().replace(characters, replacement);
	if (text.length > 233) {
		result = text.substr(0, 200) + '_' + Q.md5(result.substr(200));
	}	
	return result;
};

/*
 * A collection of HTTP servers started with Q.listen
 * @property servers
 * @type object
 * @default {}
 */
Q.servers = {};

/**
 * Starts internal server to listen for messages from PHP processes and other things.
 * Uses the Q/node/port and Q/node/host config fields.
 * Make sure to protect the communication using a firewall.
 * @method listen
 * @param {object} [options={}] Options can include:
 *
 * * "port": the port to listen on<br/>
 * * "host": the hostname to listen for<br/>
 * * "attach": an array of additional listeners to attach.<br/>
 *    Each member is a name of a class (e.g. "Q.Socket", "Q.Dispatcher" and "Db")
 *    which has the listen(options) method.
 * * "https": https options. Not supported for now.
 * @param [callback=null] {function} callback is fired when server is actually listening.
 *	callback receives server address as argument
 * @throws {Q.Exception} if config field Q/nodeInternal/port or Q/nodeInternal/host are missing
 */
Q.listen = function _Q_listen(options, callback) {
	options = options || {};
	var internalPort = Q.Config.get(['Q', 'nodeInternal', 'port'], null);
	var internalHost = Q.Config.get(['Q', 'nodeInternal', 'host'], null);
	var port = options.port || internalPort;
	var host = options.host || internalHost;
	var info;

	if (port === null)
		throw new Q.Exception("Q.listen: Missing config field: Q/nodeInternal/port");
	if (host === null)
		throw new Q.Exception("Q.listen: Missing config field: Q/nodeInternal/host");

	var server = Q.ifSet(Q.servers, [port, host], null);
	if (server) {
		var address = server.address();
		if (address) callback && callback(address);
		else server.once('listening', function () {
			callback && callback(server.address());
		});
		return server;
	}
	var _express;
	if (parseInt(express.version) >= 3) {
		_express = express();
		server = http.createServer(_express);
	} else {
		server = express.createServer();
		_express = server;
	}
	server.host = host;
	server.port = port;
	server.attached = {
		express: _express
	};
	
	var app = server.attached.express;
	app.use(express.bodyParser());
	
	var use = app.use;
	app.use = function _app_use() {
		console.log("Adding request handler under " + server.host + ":" + server.port + " :", arguments[0].name);
		use.apply(this, Array.prototype.slice.call(arguments));
	};
	var methods = {
		"get": "GET",
		"post": "POST",
		"put": "PUT",
		"del": "DELETE",
		"options": "OPTIONS",
		"all": "ALL"
	};
	Q.each(methods, function (k) {
		var f = app[k];
		app[k] = function () {
			var w, h;
			if (arguments.length > 1) {
				w = arguments[0];
				h = arguments[1];
			} else if (typeof arguments[0] === 'function') {
				w = '';
				h = arguments[0];
			} else {
				return;
			}
			if (typeof h === 'function') {
				h = h.name;
			} else if (typeof h !== 'string') {
				h = h.toString();
			}
			console.log("Adding " + methods[k] + " handler under "
				+ server.host + ":" + server.port
				+ w + " :", h);
			f.apply(this, Array.prototype.slice.call(arguments));
		};
	})
	app.use(function Q_request_handler (req, res, next) {
		// WARNING: the following per-request log may be a bottleneck in high-traffic sites:
		var a = server.address();
		if (Q.Config.get('Q', 'node', 'logRequests', true)) {
			util.log(req.method+" "+req.socket.remoteAddress+ " -> "+a.address+":"+a.port+req.url.split('?', 2)[0] + (req.body['Q/method'] ? ", method: '"+req.body['Q/method']+"'" : ''));
		}
		req.info = {
			port: port,
			host: host
		};
		var headers;
		if (headers = Q.Config.get(['Q', 'node', 'headers'], false)) {
			res.header(headers);
		}
		Q.Utils.validate(req, res, function () {
			/**
			 * Http request
			 * @event request
			 * @param req {http.Request}
			 *	The request object
			 * @param res {http.Response}
			 *	The response object
			 */
			Q.emit('request', req, res);
			next();
		});
	});
	server.listen(port, host, function () {
		var internalString = (internalHost == host && internalPort == port) ? ' (internal requests)' : '';
		console.log('Q: listening at ' + host + ':' + port + internalString);
		callback && callback(server.address());
	});

	if (!Q.servers[port]) {
		Q.servers[port] = {};
	}
	Q.servers[port][host] = server;
	return server;
};

/**
 * This should be called from Q.inc.js
 * @method init
 * @param {object} app An object that MUST contain one key:
 * * DIR: the directory of the app
 * @param {boolean} [notListen=false] Indicate wheather start http server. Useful for forking parallel processes.
 * @throws {Q.Exception} if app is not provided or does not contain DIR field
 */
Q.init = function _Q_init(app, notListen) {
	if (!app) { throw new Q.Exception("Q.init: app is required"); }
	if (!app.DIR) { throw new Q.Exception("Q.init: app.DIR is required"); }

	var path = require('path');
	var Q_dir = path.normalize(__dirname+'/..');
	
	if (require('os').type().toLowerCase().indexOf('windows') === -1) {
		/**
		 * Directory separator
		 * @property DS
		 * @type string
		 */
		Q.DS = '/';
		/**
		 * Path separator
		 * @property PS
		 * @type string
		 */
		Q.PS = ':';
	} else {
		Q.DS = '\\';
		Q.PS = ';';
	}
	/**
	 * Application data
	 * @property app
	 * @type object
	 */
	Q.app = app;
	
	//
	// constants
	//
	var dirs = {
		/**
		 * Directory for platform classes. Also Q.app.CLASSES_DIR is defined for application classes
		 * @property CLASSES_DIR
		 * @type string
		 */
		CLASSES_DIR: 'classes',
		/**
		 * Directory for platform config. Also Q.app.CONFIG_DIR is defined for application config
		 * @property CONFIG_DIR
		 * @type string
		 */
		CONFIG_DIR: 'config',
		/**
		 * Directory for platform local config. Also Q.app.LOCAL_DIR is defined for application local config
		 * @property LOCAL_DIR
		 * @type string
		 */
		LOCAL_DIR: 'local',
		/**
		 * Directory for platform files. Also Q.app.FILES_DIR is defined for application files
		 * @property FILES_DIR
		 * @type string
		 */
		FILES_DIR: 'files',
		/**
		 * Directory for platform handlers. Also Q.app.HANDLERS_DIR is defined for application handlers
		 * @property HANDLERS_DIR
		 * @type string
		 */
		HANDLERS_DIR: 'handlers',
		/**
		 * Directory for platform plugins. Also Q.app.PLUGINS_DIR is defined for application plugins
		 * @property PLUGINS_DIR
		 * @type string
		 */
		PLUGINS_DIR: 'plugins',
		/**
		 * Directory for platform scripts. Also Q.app.SCRIPTS_DIR is defined for application scripts
		 * @property SCRIPTS_DIR
		 * @type string
		 */
		SCRIPTS_DIR: 'scripts',
		/**
		 * Directory for platform test dir. Also Q.app.TESTS_DIR is defined for application test dir
		 * @property TESTS_DIR
		 * @type string
		 */
		TESTS_DIR: 'tests',
		/**
		 * Directory for platform views. Also Q.app.VIEWS_DIR is defined for application views
		 * @property VIEWS_DIR
		 * @type string
		 */
		VIEWS_DIR: 'views'
	};
	for (k in dirs) {
		Q[k] = Q_dir  + '/' + dirs[k];
	}
	for (k in dirs) {
		if (!(k in app)) {
			app[k] = app.DIR  + '/' + dirs[k];
		}
	}
	
	//
	// modules
	//
	/**
	 * Reference to Q.Exception class
	 * @property Exception
	 * @type {object}
	 */
	Q.Exception = require('./Q/Exception');
	/**
	 * Reference to Q.Tree class
	 * @property Tree
	 * @type {object}
	 */
	Q.Tree = require('./Q/Tree');
	/**
	 * Reference to Q.Config class
	 * @property Config
	 * @type {object}
	 */
	Q.Config = require('./Q/Config');
	/**
	 * Reference to Q.Bootstrap class
	 * @property Bootstrap
	 * @type {object}
	 */
	Q.Bootstrap = require('./Q/Bootstrap');
	/**
	 * Reference to Q.Request class
	 * @property Request
	 * @type {object}
	 */
	Q.Request = require('./Q/Request');
	/**
	 * Reference to Q.Socket class
	 * @property Socket
	 * @type {object}
	 */
	Q.Socket = require('./Q/Socket');
	/**
	 * Reference to Q.Dispatcher class
	 * @property Dispatcher
	 * @type {object}
	 */
	Q.Dispatcher = require('./Q/Dispatcher');
	/**
	 * Reference to Q.Mustache class
	 * @property Mustache
	 * @type {object}
	 */
	Q.Mustache = require('./Q/Mustache');

	//
	// set things up
	//
	//Q.Bootstrap.registerExceptionHandler();
	Q.Bootstrap.setIncludePath();
	/**
	 * Reference to Q.Utils class
	 * @property Utils
	 * @type {object}
	 */
	Q.Utils = require('./Q/Utils');
	Q.Bootstrap.configure(function (err) {
		if (err) process.exit(2); // if run as child Q.Bootstrap.configure returns errors in callback
		Q.Bootstrap.loadPlugins(function () {
			Q.Bootstrap.loadHandlers(function () {
				console.log(typeof notListen === "string" ? notListen : 'Q platform initialized!');
				/**
				 * Q platform initialized
				 * @event init
				 * @param Q {Q}
				 *	Initialized Q instance
				 */
				Q.emit('init', Q);
			});
		});
	}, notListen);
};

/**
 * Check if a file exists in the include path
 * And if it does, return the absolute path.
 * @method realPath
 * @param filename {string} Name of the file to look for
 * @param [ignoreCache=false] {boolean} If true, then this function ignores
 *  the cached value, if any, and always attempts to search
 *  for the file. It will cache the new value.
 * @return {string|false} The absolute path if file exists, false if it does not
 */
Q.realPath = function _Q_realPath(filename, ignoreCache) {
  if (!ignoreCache && (filename in realPath_results)) {
		return realPath_results[filename];
	}
	var result = false, paths = (process.env.NODE_PATH || '').split(Q.PS);
	for (var i = 0; i<=paths.length; ++i) {
		var p = (i == paths.length) ? '' : paths[i];
		var fullpath = path.normalize((p.substr(-1) === Q.DS) ? p + filename : p + Q.DS + filename);
		if (fs.existsSync(fullpath) || fs.existsSync(fullpath + '.js')) {
			result = fullpath;
			break;
		}
  }
	realPath_results[filename] = result;
	return result;
};
var realPath_results = {};

/**
 * Require node module
 * @method require
 * @param  {string} what
 * @return {mixed}
 */
Q.require = function _Q_require(what) {
	var realPath = Q.realPath(what);
	if (!realPath) throw new Error("Q.require: file '"+what+"' not found");
	return require(realPath);
};

var logStream = {};
/**
 * Writes a string to application log. If run outside Q application writes to console.
 * @method log
 * @param message {mixed} The data to write to log file. If data is string it is written to log, if it has other type
 *	it is converted to string using util.format with depth defined by Q/var_dump_max_levels config key
 * @param [key='Q/app'] {string} If set log file will be named key+'_node.log', otherwise 'Q/app' config value + '_node.log'
 * @param [timestamp=true] {boolean} Whether to prepend the current timestamp
 * @param [callback=null] {function} The callback to call after log file is written
 * @return {boolean} false if failed to parse arguments
 */

Q.log = function _Q_log(message, key, timestamp, callback) {
	if (typeof timestamp === "undefined") timestamp = true;
	if (typeof key === "function") {
		callback = key;
		timestamp = true;
		key = Q.Config.get(['Q', 'app'], false);
	} else if (typeof timestamp === "function") {
		callback = timestamp;
		timestamp = true;
	}
	if (typeof key === "undefined" || key === true) key = Q.Config.get(['Q', 'app'], false);

	if (typeof message !== "string")
		message = 'inspecting "'+Q.typeOf(message)+'":\n'+util.inspect(message, false, Q.Config.get('Q', 'var_dump_max_levels', 5));

	message = (timestamp ? '['+Q.date('Y-m-d h:i:s')+'] ' : '')+(key ? key : 'Q')+': ' + message + "\n";

	if (key) {
		if (typeof logStream[key] === "undefined") {
			logStream[key] = [];
			var path = ((Q.app && Q.app.FILES_DIR) ? Q.app.FILES_DIR : Q.FILES_DIR)+Q.DS+'Q'+Q.DS+Q.Config.get(['Q', 'internal', 'logDir'], 'logs');
			var filename = path+Q.DS+key+'_node.log';
			Q.Utils.preparePath(filename, function (err) {
				if (err) {
					console.error("Failed to create directory '"+path+"', Error:", err.message);
					callback && callback(err);
				} else {
					fs.stat(filename, function (err, stats) {
						if (err && err.code !=='ENOENT') {
							console.error("Could not stat '"+filename+"', Error:", err.message);
							callback && callback(err);
							return;
						} else if (err && err.code ==='ENOENT') {
							logStream[key].unshift(message);
							data = "# begin log for '"+key+"' on "+Q.date('Y-m-d h:i:s')+"\n";
						} else if (!stats.isFile()) {
							console.error("'"+filename+"' exists but is not a file");
							callback && callback(new Error("'"+filename+"' exists but is not a file"));
							return;
						}
						var log = logStream[key];
						logStream[key] = fs.createWriteStream(filename, {flags: 'a', encoding: 'utf-8'});
						logStream[key].write(message);
						while (log.length) logStream[key].write(log.shift());
					});
				}
			});
		} else if (!logStream[key].path) {
			logStream[key].push(message);
			callback && callback();
		} else {
			logStream[key].write(message);
			callback && callback();
		}
	} else util.log(message);
};

/**
 * Returns date/time string formatted the same way as PHP date function does
 * @method date
 * @param format {string} The format string
 * @param timestamp {number} The date to format
 * @return {string}
 */

Q.date = function (format, timestamp) {
	// http://kevin.vanzonneveld.net
	var that = this,
		jsdate, f, formatChr = /\\?([a-z])/gi,
		formatChrCb,
		// Keep this here (works, but for code commented-out
		// below for file size reasons)
		//, tal= [],
		_pad = function (n, c) {
			if ((n = n + '').length < c) {
				return new Array((++c) - n.length).join('0') + n;
			}
			return n;
		},
		txt_words = ["Sun", "Mon", "Tues", "Wednes", "Thurs", "Fri", "Satur", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	formatChrCb = function (t, s) {
		return f[t] ? f[t]() : s;
	};
	f = {
		// Day
		d: function () { // Day of month w/leading 0; 01..31
			return _pad(f.j(), 2);
		},
		D: function () { // Shorthand day name; Mon...Sun
			return f.l().slice(0, 3);
		},
		j: function () { // Day of month; 1..31
			return jsdate.getDate();
		},
		l: function () { // Full day name; Monday...Sunday
			return txt_words[f.w()] + 'day';
		},
		N: function () { // ISO-8601 day of week; 1[Mon]..7[Sun]
			return f.w() || 7;
		},
		S: function () { // Ordinal suffix for day of month; st, nd, rd, th
			var j = f.j();
			return j < 4 | j > 20 && ['st', 'nd', 'rd'][j%10 - 1] || 'th'; 
		},
		w: function () { // Day of week; 0[Sun]..6[Sat]
			return jsdate.getDay();
		},
		z: function () { // Day of year; 0..365
			var a = new Date(f.Y(), f.n() - 1, f.j()),
				b = new Date(f.Y(), 0, 1);
			return Math.round((a - b) / 864e5) + 1;
		},

		// Week
		W: function () { // ISO-8601 week number
			var a = new Date(f.Y(), f.n() - 1, f.j() - f.N() + 3),
				b = new Date(a.getFullYear(), 0, 4);
			return _pad(1 + Math.round((a - b) / 864e5 / 7), 2);
		},

		// Month
		F: function () { // Full month name; January...December
			return txt_words[6 + f.n()];
		},
		m: function () { // Month w/leading 0; 01...12
			return _pad(f.n(), 2);
		},
		M: function () { // Shorthand month name; Jan...Dec
			return f.F().slice(0, 3);
		},
		n: function () { // Month; 1...12
			return jsdate.getMonth() + 1;
		},
		t: function () { // Days in month; 28...31
			return (new Date(f.Y(), f.n(), 0)).getDate();
		},

		// Year
		L: function () { // Is leap year?; 0 or 1
			var j = f.Y();
			return j%4===0 & j%100!==0 | j%400===0;
		},
		o: function () { // ISO-8601 year
			var n = f.n(),
				W = f.W(),
				Y = f.Y();
			return Y + (n === 12 && W < 9 ? -1 : n === 1 && W > 9);
		},
		Y: function () { // Full year; e.g. 1980...2010
			return jsdate.getFullYear();
		},
		y: function () { // Last two digits of year; 00...99
			return (f.Y() + "").slice(-2);
		},

		// Time
		a: function () { // am or pm
			return jsdate.getHours() > 11 ? "pm" : "am";
		},
		A: function () { // AM or PM
			return f.a().toUpperCase();
		},
		B: function () { // Swatch Internet time; 000..999
			var H = jsdate.getUTCHours() * 36e2,
				// Hours
				i = jsdate.getUTCMinutes() * 60,
				// Minutes
				s = jsdate.getUTCSeconds(); // Seconds
			return _pad(Math.floor((H + i + s + 36e2) / 86.4) % 1e3, 3);
		},
		g: function () { // 12-Hours; 1..12
			return f.G() % 12 || 12;
		},
		G: function () { // 24-Hours; 0..23
			return jsdate.getHours();
		},
		h: function () { // 12-Hours w/leading 0; 01..12
			return _pad(f.g(), 2);
		},
		H: function () { // 24-Hours w/leading 0; 00..23
			return _pad(f.G(), 2);
		},
		i: function () { // Minutes w/leading 0; 00..59
			return _pad(jsdate.getMinutes(), 2);
		},
		s: function () { // Seconds w/leading 0; 00..59
			return _pad(jsdate.getSeconds(), 2);
		},
		u: function () { // Microseconds; 000000-999000
			return _pad(jsdate.getMilliseconds() * 1000, 6);
		},

		// Timezone
		e: function () { // Timezone identifier; e.g. Atlantic/Azores, ...
			// The following works, but requires inclusion of the very large
			// timezone_abbreviations_list() function.
/*              return this.date_default_timezone_get();
*/
			throw 'Not supported (see source code of date() for timezone on how to add support)';
		},
		I: function () { // DST observed?; 0 or 1
			// Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
			// If they are not equal, then DST is observed.
			var a = new Date(f.Y(), 0),
				// Jan 1
				c = Date.UTC(f.Y(), 0),
				// Jan 1 UTC
				b = new Date(f.Y(), 6),
				// Jul 1
				d = Date.UTC(f.Y(), 6); // Jul 1 UTC
			return 0 + ((a - c) !== (b - d));
		},
		O: function () { // Difference to GMT in hour format; e.g. +0200
			var tzo = jsdate.getTimezoneOffset(),
				a = Math.abs(tzo);
			return (tzo > 0 ? "-" : "+") + _pad(Math.floor(a / 60) * 100 + a % 60, 4);
		},
		P: function () { // Difference to GMT w/colon; e.g. +02:00
			var O = f.O();
			return (O.substr(0, 3) + ":" + O.substr(3, 2));
		},
		T: function () { // Timezone abbreviation; e.g. EST, MDT, ...
			// The following works, but requires inclusion of the very
			// large timezone_abbreviations_list() function.
/*              var abbr = '', i = 0, os = 0, default = 0;
			if (!tal.length) {
				tal = that.timezone_abbreviations_list();
			}
			if (that.php_js && that.php_js.default_timezone) {
				default = that.php_js.default_timezone;
				for (abbr in tal) {
					for (i=0; i < tal[abbr].length; i++) {
						if (tal[abbr][i].timezone_id === default) {
							return abbr.toUpperCase();
						}
					}
				}
			}
			for (abbr in tal) {
				for (i = 0; i < tal[abbr].length; i++) {
					os = -jsdate.getTimezoneOffset() * 60;
					if (tal[abbr][i].offset === os) {
						return abbr.toUpperCase();
					}
				}
			}
*/
			return 'UTC';
		},
		Z: function () { // Timezone offset in seconds (-43200...50400)
			return -jsdate.getTimezoneOffset() * 60;
		},

		// Full Date/Time
		c: function () { // ISO-8601 date.
			return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
		},
		r: function () { // RFC 2822
			return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
		},
		U: function () { // Seconds since UNIX epoch
			return jsdate / 1000 | 0;
		}
	};
	this.date = function _Q_date (format, timestamp) {
		that = this;
		jsdate = (!timestamp ? new Date() : (timestamp instanceof Date) ? new Date(timestamp) : new Date(timestamp * 1000));
		return format.replace(formatChr, formatChrCb);
	};
	return this.date(format, timestamp);
};

var timeHandles = {};

/**
 * Start time counter
 * @method time
 * @param handle {string} A handle to reffer to time counter. Shall be namespaced to avoid overlap with
 *	other possible counters - Q/PROCESS/NAME
 */
Q.time = function _Q_time(handle) {
	timeHandles[handle] = (new Date()).getTime();
};

/**
 * Retrieves time difference between start by Q.time() and current time.
 * Time is formatted string <code>"XX days XX hours XX minutes XX seconds"</code>
 * If time is less than a second returns <code>"XXX miliseconds"</code>
 * @method timeEnd
 * @param handle {string} The handle started with Q.time(). If not started returns null
 * @return {string|null}
 */
Q.timeEnd = function _Q_timeEnd(handle) {
	if (timeHandles[handle]) {
		var diff = (new Date()).getTime() - timeHandles[handle];
		var days = Math.floor(diff / 1000 / 60 / 60 / 24);
		var hours = Math.floor(diff / 1000 / 60 / 60 - (24 * days));
		var minutes = Math.floor(diff / 1000 / 60 - (24 * 60 * days) - (60 * hours));
		var seconds = Math.floor(diff / 1000 - (24 * 60 * 60 * days) - (60 * 60 * hours) - (60 * minutes));
		return 	((days > 0) ? days+" days " : '') +
				((days+hours > 0) ? hours+" hours " : '') +
				((days+hours+minutes > 0) ? minutes+" minutes " : '') +
				((days+hours+minutes+seconds > 0) ? seconds+" seconds" : diff+" milliseconds");
	} else return null;
};

String.prototype.replaceAll = function _String_prototype_replaceAll(pairs) {
	var result = this;
	for (var k in pairs) {
		result = result.replace(new RegExp(k, 'g'), pairs[k]);
	}
	return result;
};

/**
 * Wraps a callable in a Q.Event object
 * @class Event
 * @namespace Q
 * @constructor
 * @param callable {callable} Optional. If not provided, the chain of handlers will start out empty.
 *  Any kind of callable which Q.handle can invoke
 * @param [key=null] {string} Optional key under which to add this, so you can remove it later if needed
 * @param [prepend=false] {boolean} If true, then prepends the callable to the chain of handlers
 */
Q.Event = function _Q_Event(callable, key, prepend) {
	var event = this;
	this.handlers = {};
	this.keys = [];
	this.typename = "Q.Event";
	if (callable) {
		this.set(callable, key, prepend);
	}
	/**
	 * Shorthand closure for emitting events
	 * Pass any arguments to the event here.
	 * You can pass this closure anywhere a callback function is expected.
	 * @method handle
	 * @return {mixed}
	 */
	this.handle = function _Q_Event_instance_handle() {
		var i, count = 0, result;
		for (i=0; i<event.keys.length; ++i) {
			result = Q.handle(event.handlers[ event.keys[i] ], this, arguments);
			if (result === false) return false;
			count += result;
		}
		event.occurred = true;
		event.lastContext = this;
		event.lastArgs = arguments;
		return count;
	};
};

Q.Event.prototype.occurred = false;

/**
 * Adds a callable to a handler, or overwrites an existing one
 * @param callable Any kind of callable which Q.handle can invoke
 * @param key {String|Q.Tool} Optional key to associate with the callable.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param prepend Boolean
 *  If true, then prepends the handler to the chain
 */
Q.Event.prototype.set = function _Q_Event_prototype_set(callable, key, prepend) {
	var i;
	if (key === undefined || key === null) {
		i = this.keys.length;
		key = 'unique_' + i;
		while (this[key]) {
			key = 'unique_' + (++i);
		}
	}
	
	this.handlers[key] = callable; // can be a function, string, Q.Event, etc.
	if (this.keys.indexOf(key) == -1) {
		if (prepend) {
			this.keys.unshift(key);
		} else {
			this.keys.push(key);
		}
	}
	
    if (this.keys.length === 1 && this._onFirst) {
        this._onFirst.handle(callable, key, prepend);
    }
	if (this._onSet) {
	    this._onSet.handle(callable, key, prepend);
	}
	
	return key;
};

/**
 * Like the "set" method, adds a callable to a handler, or overwrites an existing one.
 * But in addition, immediately handles the callable if the event has already occurred at least once,
 * passing it the same subject and arguments as were passed to the event the last time it occurred.
 * @param callable Any kind of callable which Q.handle can invoke
 * @param key {String|Q.Tool} Optional key to associate with the callable.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param prepend Boolean
 *  If true, then prepends the handler to the chain
 */
Q.Event.prototype.add = function _Q_Event_prototype_add(callable, key, prepend) {
	this.set(callable, key, prepend);
	if (this.occurred) {
		Q.handle(callable, this.lastContext, this.lastArgs);
	}
};

/**
 * Removes a callable
 * @param key String
 *  The key of the callable to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Q.Event.prototype.remove = function _Q_Event_prototype_remove(key) {
	// Only available in the front-end Q.js: {
	if (Q.typeOf(key) === 'Q.Tool')	{
		var tool = key;
		key = tool.prefix;
	}
	// }
	delete this.handlers[key];
	var i = this.keys.indexOf(key);
	if (i < 0) {
		return 0;
	}
	this.keys.splice(i, 1);
	if (this._onRemove) {
	    this._onRemove.handle(callable, key, prepend);
	}
    if (!this.keys.length && this._onEmpty) {
        this._onEmpty.handle(callable, key, prepend);
    }
	return 1;
};

/**
 * Removes all handlers for this event
 * @param key String
 *  The key of the callable to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Q.Event.prototype.removeAllHandlers = function _Q_Event_prototype_removeAllHandlers() {
	this.handlers = {};
	this.keys = [];
    if (this._onEmpty) {
        this._onEmpty.handle(callable, key, prepend);
    }
};

/**
 * Make a copy of this handler
 * @method copy
 */
Q.Event.prototype.copy = function _Q_Event_prototype_copy() {
	var result = new Q.Event();
	for (var i=0; i<this.keys.length; ++i) {
		result.handlers[this.keys[i]] = this.handlers[this.keys[i]];
		result.keys.push(this.keys[i]);
	}
	return result;
};

Q.Event.prototype.onFirst = function () {
   return this._onFirst || (this._onFirst = new Q.Event());
};

Q.Event.prototype.onSet = function () {
   return this._onSet || (this._onSet = new Q.Event());
};

Q.Event.prototype.onRemove = function () {
   return this._onRemove || (this._onRemove = new Q.Event());
};

Q.Event.prototype.onEmpty = function () {
   return this._onEmpty || (this._onEmpty = new Q.Event());
};

/**
 * Make an event factory
 * @param {Object} collection
 *  The object that will store all the events. Pass null here to auto-create one.
 * @param {Array} defaults
 *  You can pass an array of defaults for the fields in the returned function
 *  The last element of this array can be a function that further processes the arguments,
 *  returning an array of the resulting arguments
 * @param {Function} callback
 *  An optional callback that gets called when a new event is created
 * @return {Function}
 *  Returns a function that can take one or more index fields and return a Q.Event
 *  that was either already stored under those index fields or newly created.
 */
Q.Event.factory = function (collection, defaults, callback) {
    if (!collection) {
        collection = {};
    }
    defaults = defaults || [];
    return function _Q_Event_factory () {
        var args = Array.prototype.slice.call(arguments, 0), a;
        var len = defaults.length;
        var f = typeof(defaults[len-1] === 'function') ? defaults[defaults.length-1] : null;
        for (var i=args.length; i<len-1; ++i) {
            args[i] = defaults[i];
        }
        args = (f && f.apply(this, args)) || args;
        var delimiter = "\t";
        var name = args.join(delimiter);
        var e = Q.getObject(name, collection, delimiter);
        if (e) {
            return e;
        }
        e = Q.setObject(name, new Q.Event(), collection, delimiter);
        if (callback) {
            callback.apply(e, args);
        }
        return e;
    };
};

function _getProp (/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var p, i = 0;
	if (context === null) return undefined;
	context = context || window;
	if(!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		context = (p in context ? context[p] : (create ? context[p] = {} : undefined));
	}
	return context; // mixed
};

/**
 * Extend a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * @param name {String} Path to a property, in the form "A.B.C".
 * @param value {Object} value or object to place at location given by name
 * @param [context=window] {Object} Optional. Object to use as root of path.
 * @param [delimiter='.'] {String} The delimiter to use in the name
 * @return {Object|undefined} Returns the passed value if setting is successful or `undefined` if not.
 */
Q.extendObject = function _Q_extendObject(name, value, context, delimiter){
    delimiter = delimiter || '.';
	var parts = name.split(delimiter), p = parts.pop(), obj = _getProp(parts, true, context);
	if (obj === undefined) {
		console.warn("Failed to set '"+name+"'");
		return undefined;
	} else {
		// not null && object (maybe array) && value is real object
		if (obj[p] && typeof obj[p] === "object" && Q.typeOf(value) === "object") {
			Q.extend(obj[p], value);
		} else {
			obj[p] = value;
		}
		return value;
	}
};

/**
 * Set an object from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * Another way to call this function is to pass an object of {name: value} pairs as the first parameter
 * and context as an optional second parameter. Then the return value is an object of the usual return values.
 * @param name {String|Array} Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param value {anything} value or object to place at location given by name
 * @param [context=window] {Object} Optional. Object to use as root of path.
 * @param [delimiter='.'] {String} The delimiter to use in the name
 * @return {Object|undefined} Returns the passed value if setting is successful or `undefined` if not.
 */
Q.setObject = function _Q_setObject(name, value, context, delimiter) {
    delimiter = delimiter || '.';
	if (typeof name === 'object') {
		context = value;
		var result = {};
		for (var k in name) {
			result[k] = Q.setObject(k, name[k], context);
		}
		return result;
	}
	if (typeof name === 'string') {
		name = name.split(delimiter);
	}
	var p = name.pop(),
	    obj = _getProp(name, true, context);
	return obj && (p !== undefined) ? (obj[p] = value) : undefined;
};

/**
 * Get a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * @param name {String|Array} Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param [context=window] {Object} Optional. Object to use as root of path. Null may be passed.
 * @param [delimiter='.'] {String} The delimiter to use in the name
 * @return {Object|undefined} Returns the stored value or `undefined` if nothing is there
 */
Q.getObject = function _Q_getObject(name, context, delimiter) {
    delimiter = delimiter || '.';
	if (typeof name === 'string') {
		name = name.split(delimiter);
	}
	return _getProp(name, false, context);
};

/**
 * Extend some built-in prototypes
 */

if (!Object.getPrototypeOf) {
	Object.getPrototypeOf = function (obj) {
		if (obj.__proto__) return obj.__proto__;
		if (obj.constructor && obj.constructor.prototype) return obj.constructor.prototype;
		return null;
	};
}

String.prototype.toCapitalized = function _String_prototype_toCapitalized() {
	return (this + '').replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

String.prototype.htmlentities = function _String_prototype_htmlentities() {
	var aStr = this.split(''),
	i = aStr.length,
	aRet = [];

	while (--i) {
		var iC = aStr[i].charCodeAt();
		if (iC < 65 || iC > 127 || (iC>90 && iC<97)) {
			aRet.push('&#'+iC+';');
		} else {
			aRet.push(aStr[i]);
		}
	}
	return aRet.reverse().join('');
};

String.prototype.quote = function _String_prototype_quote() {
	var c, i, l = this.length, o = '"';
	for (i = 0; i < l; i += 1) {
		c = this.charAt(i);
		if (c >= ' ') {
			if (c === '\\' || c === '"') {
				o += '\\';
			}
			o += c;
		} else {
			switch (c) {
			case '\b':
				o += '\\b';
				break;
			case '\f':
				o += '\\f';
				break;
			case '\n':
				o += '\\n';
				break;
			case '\r':
				o += '\\r';
				break;
			case '\t':
				o += '\\t';
				break;
			default:
				c = c.charCodeAt();
				o += '\\u00' + Math.floor(c / 16).toString(16) +
					(c % 16).toString(16);
			}
		}
	}
	return o + '"';
};

String.prototype.interpolate = function _String_prototype_interpolate(o) {
	return this.replace(/\{\{([^{}]*)\}\}/g,
		function (a, b) {
			var r = o[b];
			return typeof r === 'string' || typeof r === 'number' ? r : a;
		}
	);
};

String.prototype.replaceAll = function _String_prototype_replaceAll(pairs) {
	var result = this;
	for (var k in pairs) {
		result = result.replace(new RegExp(k, 'g'), pairs[k]);
	}
	return result;
};

/**
 * Gets a param from a string, which is usually the location.search or location.hash
 * @param name {String} The name of the field
 * @param value {String} Optional, provide a value to set in the querystring, or null to delete the field
 * @return {String} the value of the field in the source, or if value was not undefined, the resulting querystring
 */
String.prototype.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'], count = prefixes.length, prefix = '', i, l, p, keys, parsed;
	for (var i=0; i<count; ++i) {
		l = prefixes[i].length;
		p = this.substring(0, l);
		if (p == prefixes[i]) {
			previx = p;
			what = this.substring(l);
			break;
		}
	}
	if (typeof name === 'object') {
		var result = what;
		Q.each(value, function (key, value) {
			result = result.queryField(key, value);
		});
	} else if (value === undefined) {
		return Q.parseQueryString(what) [ name ];
	} else if (value === null) {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		delete parsed[name];
		return prefix + Q.buildQueryString(parsed, keys);
	} else {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		if (!(name in parsed)) {
			keys.push(name);
		}
		parsed[name] = value;
		return prefix + Q.buildQueryString(parsed, keys);
	}
};

if (!String.prototype.trim) {
	String.prototype.trim = function _String_prototype_trim() {
		return this.replace(/^\s+|\s+$/g, "");
	};
}

if (!Function.prototype.bind) {
	Function.prototype.bind = function _String_prototype_bind(obj, options) {
		return Q.bind(this, obj, options);
	};
}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function _Array_prototype_indexOf(searchElement /*, fromIndex */ ) {
		if (this === 0 || this === null) {
			throw new TypeError();
		}
		var t = Object(this);
		var len = t.length >>> 0;
		if (len === 0) {
			return -1;
		}
		var n = 0;
		if (arguments.length > 0) {
			n = Number(arguments[1]);
			if (n !== n) { // shortcut for verifying if it's NaN
				n = 0;
			} else if (n !== 0 && n !== window.Infinity && n !== -window.Infinity) {
				n = (n > 0 || -1) * Math.floor(Math.abs(n));
			}
		}
		if (n >= len) {
			return -1;
		}
		var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
		for (; k < len; k++) {
			if (k in t && t[k] === searchElement) {
				return k;
			}
		}
		return -1;
	};
}

// Backward compatibility with older versions of Node.js
fs.exists = fs.exists || function(uri, callback){return path.exists.call(path, uri, callback);};
fs.existsSync = fs.existsSync || function(uri){return path.existsSync.call(path, uri);};
