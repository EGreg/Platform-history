/**
 * Q namespace/module/singleton
 *
 * Used to access functionality for Q front ends.
 * Some methods of this module were taken from Douglas Crockford's website.
 * @module Q
 * @class Q
 */
if (!window.Q) (function () {

// private properties
var m_isReady = false;
var m_isOnline = null;

function Q () {
	// not called right now
};

// public properties:
Q.tools = {};
Q.constructors = {};
Q.plugins = {};
Q.text = {
	Q: {
		"request": {
			"error": "Error {{status}} during request",
			"404": "Not found: {{url}}",
			"0": "Request interrupted"
		}
	}
}; // put all your text strings here e.g. Q.text.Users.foo

/**
 * Extend some built-in prototypes
 */

Object.getPrototypeOf = Object.getPrototypeOf || function (obj) {
	if (obj.__proto__) return obj.__proto__;
	if (obj.constructor && obj.constructor.prototype) return obj.constructor.prototype;
	return null;
};

Object.keys = Object.keys || (function () {
	var hasOwnProperty = Object.prototype.hasOwnProperty,
		hasDontEnumBug = !{toString:null}.propertyIsEnumerable("toString"),
		DontEnums = [
			'toString',
			'toLocaleString',
			'valueOf',
			'hasOwnProperty',
			'isPrototypeOf',
			'propertyIsEnumerable',
			'constructor'
		],
		DontEnumsLength = DontEnums.length;
  
	return function (o) {
		if (typeof o != "object" && typeof o != "function" || o === null)
			throw new TypeError("Object.keys called on a non-object");
	 
		var result = [];
		for (var name in o) {
			if (hasOwnProperty.call(o, name))
				result.push(name);
		}
	 
		if (hasDontEnumBug) {
			for (var i = 0; i < DontEnumsLength; i++) {
				if (hasOwnProperty.call(o, DontEnums[i]))
					result.push(DontEnums[i]);
			}   
		}
	 
		return result;
	};
})();

String.prototype.toCapitalized = function _String_prototype_toCapitalized() {
	return (this + '').replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

String.prototype.isUrl = function () {
	return this.match(new RegExp("^[A-Za-z]*:\/\/"));
};

String.prototype.encodeHTML = function _String_prototype_encodHTML(quote_style, charset, double_encode) {
	return this.replaceAll({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;'
	});
};

String.prototype.decodeHTML = function _String_prototype_encodHTML(quote_style, charset, double_encode) {
	return this.replaceAll({
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'"
	});
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

String.prototype.hashCode = function() {
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		hash = hash % 16777216;
		hash = ((hash<<5)-hash)+c;
		hash = hash & 0xffffffff; // Convert to 32bit integer
	}
	return hash;
};

String.prototype.trim = String.prototype.trim || function _String_prototype_trim() {
	return this.replace(/^\s+|\s+$/g, "");
};

Function.prototype.bind = Function.prototype.bind || function _Function_prototype_bind(obj, options) {
	return Q.bind(this, obj, options);
};

Array.prototype.indexOf = Array.prototype.indexOf || function _Array_prototype_indexOf(searchElement /*, fromIndex */ ) {
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

Date.now = Date.now || function _Date_now() {
	return new Date().getTime();
};

HTMLElement.prototype.contains = HTMLElement.prototype.contains || function (child) {
	if (!child) return false;
    var node = child.parentNode;
    while (node != null) {
        if (node == this) {
            return true;
        }
        node = node.parentNode;
    }
    return false;
};

HTMLElement.prototype.isOrContains = function (child) {
	return this === child || this.contains(child);
};

HTMLElement.prototype.computedStyle = function(name) {
    var computedStyle;
    if ( this.currentStyle !== undefined ) {
    	computedStyle = this.currentStyle;
    } else {
    	computedStyle = window.getComputedStyle(this, null);
    }
    return name ? computedStyle[name] : computedStyle;
};

HTMLElement.prototype.copyComputedStyle = function(src) {
    var s = src.computedStyle();
    for ( var i in s ) {
    	// Do not use `hasOwnProperty`, nothing will get copied
    	if ( typeof i == "string" && i != "cssText" && !/\d/.test(i) ) {
    		// The try is for setter only properties
    		try {
    			this.style[i] = s[i];
    			// `fontSize` comes before `font` If `font` is empty, `fontSize` gets
    			// overwritten.  So make sure to reset this property. (hackyhackhack)
    			// Other properties may need similar treatment
    			if ( i == "font" ) {
    				this.style.fontSize = s.fontSize;
    			}
    		} catch (e) {}
    	}
    }
	return this;
};

HTMLElement.prototype.swap = function(element) {
	var parent1, next1, parent2, next2;
	parent1 = this.parentNode;
	next1   = this.nextSibling;
	parent2 = element.parentNode;
	next2   = element.nextSibling;
	parent1.insertBefore(element, next1);
	parent2.insertBefore(this, next2);
};

HTMLElement.prototype.preventSelections = function () {
	this.onselectstart = function() { return false; }; 
    this.unselectable = 'on'; 
	this.style['-moz-user-select']
	= this.style['-webkit-user-select']
	= this.style['-ms-user-select']
	= this.style['user-select'] = 'none';
};

HTMLElement.prototype.isBefore = function (element, context) {
	var before = true, that = this;
	context = context || document.documentElement; // TODO: can triangulate a parentNode instead
	Q.find(context, null, function (elem) {
		if (elem === element) {
			before = false;
			return false;
		}
		if (elem === that) {
			return false;
		}
	});
	return before;
};

if(!document.getElementsByClassName) {
    document.getElementsByClassName = function(className) {
		return Array.prototype.slice.call(this.querySelectorAll("." + className));
    };
    Element.prototype.getElementsByClassName = document.getElementsByClassName;
}

Q.elementFromPoint = function (pageX, pageY) {
	return document.elementFromPoint(
		pageX - document.body.scrollLeft - document.documentElement.scrollLeft,
		pageY - document.body.scrollTop - document.documentElement.scrollTop
	);
};

// public methods:

/**
 * Creates a derived object which you can extend, inheriting from an existing object
 */
Q.objectWithPrototype = function _Q_objectWithPrototype(original) {
	if (!original) {
		return {};
	}
	function Derived() {}
	Derived.prototype = original;
	return new Derived();
};

/**
 * Returns the type of a value
 * @param value
 *
 * return
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value, x;
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (value instanceof Array || (value.constructor && value.constructor.name === 'Array')
		|| Object.prototype.toString.apply(value) === '[object Array]') {
			s = 'array';
		} else if (typeof(value.typename) != 'undefined' ) {
			return value.typename;
		} else if (typeof(value.constructor) != 'undefined' && typeof(value.constructor.name) != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			return value.constructor.name;
		} else if ((x = Object.prototype.toString.apply(value).substr(0, 8)) === "[object ") {
			return x.substring(8, x.length-1);
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * @method each
 * @param {Array|Object|String|Number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {Function|String} callback
 *  A function which will receive two parameters
 *    index: the index of the current item
 *    value: the value of the current item
 *  Also can be a string, which would be the name of a method to invoke on each item, if possible.
 *  In this case the callback should be followed by an array of arguments to pass to the method calls.
 * @param {Object} options
 *  ascending: Optional. Pass true here to traverse in ascending key order, false in descending.
 *  numeric: Optional. Used together with ascending. Use numeric sort instead of string sort.
 *  hasOwnProperty: Optional. Set to true to skip properties found on the prototype chain.
 * @throws {Q.Exception} If container is not array, object or string
 */
Q.each = function _Q_each(container, callback, options) {
	var i, k, length, r, t, args;
	if (typeof callback === 'string' && Q.typeOf(arguments[2]) === 'array') {
		args = arguments[2];
		options = arguments[3];
	}
	switch (t = Q.typeOf(container)) {
		default:
			if (!container) break;
			// Assume it is an array-like structure.
			// Make a copy in case it changes during iteration. Then iterate.
			var c = Array.prototype.slice.call(container, 0);
			if (('0' in container) && !('0' in c)) { // we are probably dealing with IE < 9
				var c = [];
				for (i=0; r = container[i]; ++i) {
					c.push(r);
				}
			}
			container = c;
		case 'array':
			length = container.length;
			if (!container || !length || !callback) return;
			if (options && options.ascending === false) {
				for (i=length-1; i>=0; --i) {
					r = Q.handle(callback, container[i], args || [i, container[i]]);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, container[i], args || [i, container[i]]);
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
				keys = options.numeric ? keys.sort(function (a,b) {return Number(a)-Number(b);}) : keys.sort();
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key]]);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key]]);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], args || [k, container[k]]);
						if (r === false) return false;
					}
				}
			}
			break;
		case 'string':
			if (!container || !callback) return;
			if (options && options.ascending === false) {
				for (i=0; i<container.length; ++i) {
					r = Q.handle(callback, container, args || [i, container.charAt(i)]);
					if (r === false) return false;
				}
			} else {
				for (i=container.length-1; i>=0; --i) {
					r = Q.handle(callback, container, args || [i, container.charAt(i)]);
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
						throw "Q.each: step="+step+" leads to infinite loop";
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
					r = Q.handle(callback, this, args || [i]);
					if (r === false) return false;
				}
			} else {
				for (i=from; i>=to; i+=step) {
					r = Q.handle(callback, this, args || [i]);
					if (r === false) return false;
				}
			}
			break;
		case 'function':
		case 'boolean':
			if (container === false) break;
			throw "Q.each: does not support iterating a " + t;
		case 'null':
			break;
	}
};

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
Q.diff = function _Q_diff(container1, container2 /*, ... comparator */) {
    if (!container1 || !container2) {
        return container1;
    }
	var args = arguments;
    var len = arguments.length;
    var comparator = arguments[len-1];
    if (typeof comparator !== 'function') {
        throw new Q.Exception("Q.diff: comparator must be a function");
    }
    var isArr = (Q.typeOf(container1) === 'array');
    var result = isArr ? [] : {};
    Q.each(container1, function (k, v1) {
        var found = false;
        for (var i=1; i<len-1; ++i) {
            Q.each(args[i], function (j, v2) {
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
                result[k] = v1;
            }
        }
    });
	return result;
};

/**
 * Walks the tree from the parent, returns the object at the end of the path, or the the defaultValue
 * @method ifSet
 * @param parent {object}
 * @param keys {array}
 * @param defaultValue {mixed}
 * @return {mixed}
 *	The resulting object
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
 * Tests whether a variable contains a falsy value,
 * or an empty object or array.
 * @param o
 *  The object to test.
 */
Q.isEmpty = function _Q_isEmpty(o) {
	if (!o) {
		return true;
	}
	var i, v, t;
	t = Q.typeOf(o);
	if (t === 'array') {
		return (o.length === 0);
	}
	if (t === 'object') {
		for (i in o) {
			v = o[i];
			if (v !== undefined) {
				return false;
			}
		}
		return true;
	}
	return false;
};

/**
 * Tests if the value is an integer
 * @method isInteger
 * @param value {mixed}
 *  The value to test
 * @return {boolean}
 *	Whether it is an integer
 */
Q.isInteger = function _Q_isInteger(value) {
	return (parseFloat(value) == parseInt(value)) && !isNaN(value);
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
	if (window.attachEvent && !window.addEventListener) {
		// This is just for IE8
		if (x && x.constructor !== Object) {
			return false;
		}
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
 * Extends an object with properties from one or more other objects.
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
				|| (a.constructor !== Object)) {
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
 * Returns whether an object contains a property directly
 * @param obj Object
 * @param key String
 * @return Boolean
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * @param source Object
 *  An Object from which to take things
 * @param fields Array|Object
 *  An array of fields to take
 *  Or an Object of fieldname: default pairs
 * @return a new Object
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
 * Shuffles an array
 * @param Array arr
 *  The array taht gets passed here is shuffled in place
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
 * @param get_as_float {Boolean}
 * @return {String}
 */
Q.microtime = function _Q_microtime(get_as_float) {
	// http://kevin.vanzonneveld.net
	// +   original by: Paulo Freitas
	// *	 example 1: timeStamp = microtime(true);
	// *	 results 1: timeStamp > 1000000000 && timeStamp < 2000000000
	var now = new Date().getTime() / 1000;
	var s = parseInt(now, 10);

	return (get_as_float) ? now : (Math.round((now - s) * 1000) / 1000) + ' ' + s;
};

/**
 * Binds a method to an object, so "this" inside the method
 * refers to that object when it is called.
 * @param method
 *  A reference to the function to call
 * @param obj
 *  The object to bind to
 * @param options
 *  Optional. If supplied, binds these options and passes
 *  them during invocation.
 */
Q.bind = function _Q_bind(method, obj, options) {
	if (options) {
		return function _Q_bind_result_withOptions() {
			var args = Array.prototype.slice.call(arguments);
			if (options) args.push(options);
			return method.apply(obj, args);
		};
	} else {
		return function _Q_bind_result() {
			return method.apply(obj, arguments);
		};
	}
};

/**
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * @param A Function
 *  The constructor corresponding to the "class" we are mixing functionality into
 *  This function will get the following members set:
 *  __mixins: an array of [B, C, ...]
 *  constructors(subject, params): a method to call the constructor of all mixing classes, in order. Pass this to it.
 *  staticProperty(property): a method for getting a property name
 * @param B Function
 *  One or more constructors representing "classes" to mix functionality from
 *  They will be tried in the order they are provided, meaning methods from earlier ones
 *  override methods from later ones.
 */
Q.mixin = function _Q_mixin(A, B) {
	var __mixins = (A.__mixins || (A.__mixins = []));
	for (var i = 1, l = arguments.length; i < l; ++i) {
		var mixin = arguments[i];
		if (typeof mixin !== 'function') {
			throw "Q.mixin: argument " + i + " is not a function";
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

	A.prototype.constructors = function _constructors() {
		if (!this.constructor.__mixins) {
			throw "Q.mixin: mixinObject.constructors() called on something that does not have mixins info";
		}
		for (var mixins = this.constructor.__mixins, i = 0, l = mixins.length; i < l; ++i) {
			mixins[i].apply(this, arguments);
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
	}
	var constructors = Array.prototype.slice.call(arguments, 1, j+1);
	constructors.unshift(Q_ClassConstructor);

	function Q_ClassConstructor() {
		this.constructors.apply(this, arguments);
		construct && construct.apply(this, arguments);
	}

	if (typeof arguments[++j] === 'object') {
		Q.extend(Q_ClassConstructor.prototype, Q.Class.options.levels, arguments[j]);
		if (typeof arguments[++j] === 'object') {
			Q.extend(Q_ClassConstructor, arguments[j]);
		}
	}

	Q.mixin.apply(Q, constructors);
	return Q_ClassConstructor;
};

Q.Class.options = {
	levels: 10
};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * @param text String
 *  The text to normalize
 * @param replacement String
 *  Defaults to '_'. A string to replace one or more unacceptable characters.
 *  You can also change this default using the config Db/normalize/replacement
 * @param characters String
 *  Defaults to '/[^A-Za-z0-9]+/'. A regexp characters that are not acceptable.
 *  You can also change this default using the config Db/normalize/characters
 */
Q.normalize = function _Q_normalize(text, replacement, characters) {
	if (replacement === undefined) replacement = '_';
	characters = characters || new RegExp("[^A-Za-z0-9]+", "g");
	var result = text.toLowerCase().replace(characters, replacement);
	if (text.length > 233) {
		result = text.substr(0, 200) + '_' + Math.abs(text.substr(200).hashCode());
	}
	return result;
};

function _getProp (/*Array*/parts, /*Boolean*/create, /*Object*/context){
	var p, i = 0;
	if (context === null) return undefined;
	context = context || window;
	if(!parts.length) return context;
	while(context && (p = parts[i++]) !== undefined){
		try {
			context = (p in context) ? context[p] : (create ? context[p] = {} : undefined);
		} catch (e) {
			if (create) {
				throw "Q.setObject cannot set property of " + typeof(context) + " " + JSON.stringify(context);
			}
		}
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
			Q.extend(obj[p], Q.extendObject.options, value);
		} else {
			obj[p] = value;
		}
		return value;
	}
};

Q.extendObject.options = {
	levels: 10
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
	if (Q.isPlainObject(name)) {
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
 * Use this to ensure that a property exists before running some javascript code.
 * If something is undefined, loads a script or executes a function, calling the callback on success.
 * @param property
 *  The property to test for being undefined.
 * @param loader String|Function
 *  Something to execute if the property was undefined.
 *  If a string, this is interpreted as the URL of a javascript to load.
 *  If a function, this is called with the callback as the first argument.
 * @param callback Function
 *  The callback to call when the loader has been executed.
 *  This is where you would put the code that relies on the property being defined.
 */
Q.ensure = function _Q_ensure(property, loader, callback) {
	if (property !== undefined) {
		Q.handle(callback);
		return;
	}
	if (typeof loader === 'string') {
		Q.addScript(loader, callback);
		return;
	} else if (typeof loader === 'function') {
		loader(callback);
	}
};

/**
 * Wraps a callable in a Q.Event object
 * @class Event
 * @namespace Q
 * @param callable {callable}
 *  Optional. If not provided, the chain of handlers will start out empty.
 *  Any kind of callable which Q.handle can invoke
 * @param key=null {string}
 *  Optional key under which to add this, so you can remove it later if needed
 * @param prepend=false {boolean}
 *  If true, then prepends the callable to the chain of handlers
 */
Q.Event = function _Q_Event(callable, key, prepend) {
	if (this === Q) {
		throw "Q.Event: Missing new keyword";
	}
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

Q.Event.forTool = {};
Q.Event.forPage = [];
Q.Event.jQueryForTool = {};
Q.Event.jQueryForPage = [];

Q.Event.prototype.occurred = false;

/**
 * Calculates a string key by considering the parameter that was passed,
 * the tool being activated, and the page being activated
 * @param {String|Q.Tool} key
 * @param {Object} optional container in which the key will be used
 * @param {Number} optional number at which to start the loop for the default key generation
 * @return {String}
 */
Q.Event.calculateKey = function _Q_Event_calculateKe(key, container, start) {
	if (key === true) {
		return key;
	}
	var tool = undefined;
	if (key === undefined) {
		key = Q.Tool.beingActivated; // by default, use the current tool as the key, if any
	}
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = key.id;
	}
	if (container && key == undefined) { // key is undefined or null
		var i = (start === undefined) ? Q.Event.calculateKey.keys.length : start;
		key = 'AUTOKEY_' + i;
		while (container[key]) {
			key = 'AUTOKEY_' + (++i);
		}
	}
	return key;
};
Q.Event.calculateKey.keys = [];

/**
 * Adds a callable to a handler, or overwrites an existing one
 * @param callable Any kind of callable which Q.handle can invoke
 * @param key {String|Boolean|Q.Tool} Optional key to associate with the callable.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass true here to associate the handler to the current page,
 *  and it will be automatically removed when the current page is removed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param prepend Boolean
 *  If true, then prepends the handler to the chain
 */
Q.Event.prototype.set = function _Q_Event_prototype_set(callable, key, prepend) {
	var i, isTool = (Q.typeOf(key) === 'Q.Tool');
	if (key === true || (key === undefined && Q.Page.beingActivated)) {
		Q.Event.forPage.push(this);
	}
	key = Q.Event.calculateKey(key, this.handlers, this.keys.length);
	this.handlers[key] = callable; // can be a function, string, Q.Event, etc.
	if (this.keys.indexOf(key) < 0) {
		if (prepend) {
			this.keys.unshift(key);
		} else {
			this.keys.push(key);
		}
		if (isTool) {
			Q.Event.forTool[key] = Q.Event.forTool[key] || [];
			Q.Event.forTool[key].push(this);
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
 * Removes an event handler
 * @param key String
 *  The key of the callable to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Q.Event.prototype.remove = function _Q_Event_prototype_remove(key) {
	// Only available in the front-end Q.js: {
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = key.id;
	}
	if (key === true) {
		l = Q.Event.forPage.length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forPage[i] === this) {
				Q.Event.forPage.splice(i, 1);
				break;
			}
		}
	} else if (Q.Event.forTool[key]) {
		l = Q.Event.forTool[key].length;
		for (i=0; i<l; ++i) {
			if (Q.Event.forTool[key][i] === this) {
				Q.Event.forTool[key].splice(i, 1);
				break;
			}
		}
	}
	// }
	delete this.handlers[key];
	var l, i = this.keys.indexOf(key);
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
 * @param {String} key
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
 *  An optional callback that gets called when a new event is created.
 *  The "this" object is the Q.Event, and the parameters are the processed parameters
 *  passed to the returned factory function.
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

/**
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
 *  It is passed three arguments: (params, subjects, requires)
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
 * A convenience method for constructing Q.Pipe objects
 * and is really here just for backward compatibility.
 * @return {Q.Pipe}
 * @see Q.Pipe
 */
Q.pipe = function _Q_pipe(requires, maxTimes, callback) {
	return new Q.Pipe(requires, maxTimes, callback);
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
 *		 the batch function is run.
 *  "ms": Defaults to 50. When this many milliseconds elapse without another call to the
 *		 same batcher function, the batch function is run.
 * @return {Function} It returns a function that the client can use as usual, but which,
 * behind the scenes, queues up the calls and then runs a batch function that you write.
 */
Q.batcher = function _Q_batch(batch, options) {
	var o = Q.extend({}, Q.batcher.options, options);
	var result = function _Q_batch_result() {
		var requestArguments = arguments;
		function nextRequest() {
			var i, j;
			var callbacks = [], args = [], argmax = 0, cbmax = 0;

			// separate fields and callbacks
			for (i=0; i<requestArguments.length; ++i) {
				if (typeof requestArguments[i] === 'function') {
					callbacks.push(requestArguments[i]);
				} else {
					args.push(requestArguments[i]);
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
				try {
					batch.call(this, batch.subjects, batch.args, batch.callbacks);
					batch.subjects = batch.args = batch.callbacks = null;
					batch.count = 0;
					batch.argmax = 0;
					batch.cbmax = 0;
				} catch (e) {
					batch.count = 0;
					batch.argmax = 0;
					batch.cbmax = 0;
					throw e;
				}
			}
			if (batch.count == o.max) {
				runBatch();
			} else {
				batch.timeout = setTimeout(runBatch, o.ms);
			} 
		}
		// Make the batcher re-entrant. Without this technique, if 
		// something is requested while runBatch is calling its callback,
		// that request's information may be wiped out by runBatch.
		// The following statement schedules such requests after runBatch has completed.
		setTimeout(nextRequest, 0);
	};
	result.batch = batch;
	result.cancel = function () {
		clearTimeout(batch.timeout);
	};
	return result;
};

Q.batcher.options = {
	max: 10,
	ms: 50
};

/**
 * Used to create a basic batcher function, given only the url.
 * @param {Object} collection An object to contain all the batcher functions
 * @param {String} baseUrl The base url of the webservice built to support batch requests.
 * @param {String} baseUrl The rest of the url of the webservice built to support batch requests.
 * @param {String} slotName The name of the slot to request. Defaults to "batch".
 * @param {String} fieldName The name of the data field. Defaults to "batch".
 */
Q.batcher.factory = function _Q_batcher_factory(collection, baseUrl, tail, slotName, fieldName) {
    if (!collection) {
        collection = {};
    }
    if (slotName === undefined) {
        slotName = 'batch';
    }
    if (fieldName === undefined) {
        fieldName = 'batch';
    }
    if (tail && tail[0] !== '/') {
        tail = '/' + tail;
    }
    var delimiter = "\t", f;
    var name = [baseUrl, tail, slotName, fieldName].join(delimiter);
    if (f = Q.getObject(name, collection, delimiter)) {
        return f;
    }    
    f = Q.batcher(function _Q_batcher_factory_function(subjects, args, callbacks) {
		var data = JSON.stringify({args: args});
		var fields = {};
		fields[fieldName] = data;
		Q.req(baseUrl+tail, slotName, function (err, response) {
			var error = err || response.errors;
			if (error) {
				Q.each(callbacks, function (k, cb) {
					cb[0].call(this, error);
				});
				return;
			}
			Q.each(response.slots.batch, function (k, result) {
			    if (result.errors) {
                    callbacks[k][0].call(subjects[k], result.errors);
			    } else {
                    callbacks[k][0].call(subjects[k], null, (result && result.slots) || {});
			    }
			});
		}, {method: 'post', fields: {batch: data}});
	});
	Q.setObject(name, f, collection, delimiter);
	return f;
};

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
 * @param original Function
 *  The original getter function to be wrapped
 *  Can also be an array of [getter, execute] which you can use if
 *  your getter does "batching", and waits a tiny bit before sending the batch request,
 *  to see if any more will be requested. In this case, the execute function
 *  is supposed to execute the batched request without waiting any more.
 * @param options Object
 *  An optional hash of possible options, which include:
 *  "throttle" => a String id to throttle on, or an Object that supports the throttle interface:
 *	"throttle.throttleTry" => function(subject, getter, args) - applies or throttles getter with subject, args
 *	"throttle.throttleNext" => function (subject) - applies next getter with subject
 *	"throttleSize" => defaults to 100. Integer representing the size of the throttle, if it is enabled
 *	"cache" => pass false here to prevent caching, or an object which supports the cache interface
 * @return Number
 *  0 if found in cache,
 *  1 if throttled,
 *  2 if run,
 *  3 if waiting for other request to deliver data
 */
Q.getter = function _Q_getter(original, options) {

	function wrapper() {
		var i, j, key, that = this, arguments2 = Array.prototype.slice.call(arguments);
		var callbacks = [];

		// separate fields and callbacks
		key = Q.Cache.key(arguments2, callbacks);
		if (callbacks.length === 0) {
			// in case someone forgot to pass a callback
			// pretend they added a callback at the end
			var noop = function _noop() {} ;
			arguments2.push(noop);
			callbacks.push(noop);
		}
		
		var ret = {};
		wrapper.onCalled.handle.call(this, arguments2, ret);

		var cached, cbpos;

		// if caching required check the cache -- maybe the result is there
		if (wrapper.cache) {
			if (cached = wrapper.cache.get(key)) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					wrapper.onResult.handle(cached.subject, cached.params, arguments2, ret, original);
					callbacks[cbpos].apply(cached.subject, cached.params);
					ret.result = Q.getter.CACHED;
					wrapper.onExecuted.handle.call(this, arguments2, ret);
					return ret; // wrapper found in cache, callback and throttling have run
				}
			}
		}

		_waiting[key] = _waiting[key] || [];
		_waiting[key].push({
			callbacks: callbacks,
			ret: ret
		});
		if (_waiting[key].length > 1) {
			wrapper.onExecuted.handle.call(this, arguments2, ret);
			ret.result = Q.getter.WAITING;
			return ret; // the request is already in process - let's wait
		}

		// replace the callbacks with smarter functions
		var args = [];
		for (i=0, cbi=0; i<arguments2.length; i++) {

			// we only care about functions
			if (typeof arguments2[i] !== 'function') {
				args.push(arguments2[i]); // regular argument
				continue;
			}

			args.push((function(cb, cbpos) {
				// make a function specifically to call the
				// callbacks in position pos, and then decrement
				// the throttle
				return function _Q_getter_callback() {

					// save the results in the cache
					if (wrapper.cache) {
						wrapper.cache.set(key, cbpos, this, arguments);
					}

					// process waiting callbacks
					var wk = _waiting[key];
					for (i = 0; i < wk.length; i++) {
						wrapper.onResult.handle(this, arguments, arguments2, wk[i].ret, original);
						wk[i].callbacks[cbpos].apply(this, arguments);
					}
					delete _waiting[key]; // check if need to delete item by item ***

					// tell throttle to execute the next function, if any
					if (wrapper.throttle && wrapper.throttle.throttleNext) {
						wrapper.throttle.throttleNext(this);
					}
				};
			})(callbacks[cbi], cbi));
			++cbi; // the index in the array of callbacks
		}

		if (!wrapper.throttle) {
			// no throttling, just run the function
			original.apply(that, args);
			ret.result = Q.getter.REQUESTING;
			wrapper.onExecuted.handle.call(this, arguments2, ret);
			return ret;
		}

		if (!wrapper.throttle.throttleTry) {
			// the throttle object is probably not set up yet
			// so set it up
			var p = {
				size: wrapper.throttleSize,
				count: 0,
				queue: [],
				args: []
			};
			wrapper.throttle.throttleTry = function _throttleTry(that, getter, args) {
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
			wrapper.throttle.throttleNext = function _throttleNext(that) {
				if (--p.count < 0) {
					console.warn("Q.getter: throttle count is negative");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!wrapper.throttleSize) {
			wrapper.throttle.throttleSize = function _throttleSize(newSize) {
				if (typeof(newSize) === 'undefined') {
					return p.size;
				}
				p.size = newSize;
			};
		}

		// execute the throttle
		ret.result = wrapper.throttle.throttleTry(this, original, args)
			? Q.getter.REQUESTING
			: Q.getter.THROTTLING;
		wrapper.onExecuted.handle.call(this, arguments2, ret);
		return ret;
	}

	Q.extend(wrapper, Q.getter.options, options);
	wrapper.onCalled = new Q.Event();
	wrapper.onExecuted = new Q.Event();
	wrapper.onResult = new Q.Event();

	var _waiting = {};
	if (wrapper.cache === false) {
		// no cache
		wrapper.cache = null;
	} else if (wrapper.cache === true) {
		// create our own Object that will cache locally in the page
		wrapper.cache = Q.Cache.document(++_Q_getter_i);
	} else {
		// assume we were passed an Object that supports the cache interface
	}

	wrapper.throttle = wrapper.throttle || null;
	if (wrapper.throttle === true) {
		wrapper.throttle = '';
	}
	if (typeof wrapper.throttle === 'string') {
		// use our own objects
		if (!Q.getter.throttles[wrapper.throttle]) {
			Q.getter.throttles[wrapper.throttle] = {};
		}
		wrapper.throttle = Q.getter.throttles[wrapper.throttle];
	}

	wrapper.forget = function _forget() {
		var key = Q.Cache.key(arguments);
		if (key && wrapper.cache) {
	        wrapper.cache.remove(key);
	    }
	};

	if (original.batch) {
		wrapper.batch = original.batch;
	}
	return wrapper;
};
_Q_getter_i = 0;
Q.getter.options = {
	cache: true,
	throttle: null,
	throttleSize: 100
};
Q.getter.throttles = {};
Q.getter.cache = {};
Q.getter.waiting = {};
Q.getter.CACHED = 0;
Q.getter.REQUESTING = 1;
Q.getter.WAITING = 2;
Q.getter.THROTTLING = 3;

/**
 * Custom exception constructor
 * @constructor
 * @param [message=""] {string} The error message
 * @param {object} fields={}
 */
Q.Exception = function (message, fields) {
	this.fields = fields || {};
	this.message = message || "";
};

Q.Exception.prototype = Error;

/**
 * A constructor to create Q.Page objects
 */
Q.Page = function (uriString) {
	this.uriString = uriString;
};

Q.Page.beingLoaded = false;
Q.Page.beingActivated = false;

/**
 * The root mixin added to all tools.
 * @param [element] the element to activate into a tool
 * @param [options={}] an optional set of options that may contain ".Tool_name or #Some_exact_tool or #Some_child_tool"
 * @return {Q.Tool} if this tool is replacing an earlier one, returns existing tool that was removed.
 *	 Otherwise returns null, or false if the tool was already constructed.
 */
Q.Tool = function _Q_Tool(element, options) {
	if (this.constructed) {
		return false; // don't construct the same tool more than once
	}
	this.constructed = true;
	this.element = element;
	this.typename = 'Q.Tool';

	if (window.jQuery) {
		jQuery(element).data('Q_tool', this);
	}

	// ID and prefix
	if (!this.element.id) {
		var prefix = Q.Tool.beingActivated ? Q.Tool.beingActivated.prefix : '_';
		this.element.id = (prefix + (Q.Tool.nextDefaultId++) + '_' + this.name + "_tool").toLowerCase();
	}
	this.prefix = Q.Tool.prefixById(this.element.id);
	this.id = this.prefix.substr(0, this.prefix.length-1);

	// for later use
	var classes = (this.element.className && this.element.className.split(/\s+/) || []);

	// options
	var dataOptions = element.getAttribute('data-' + Q.normalize(this.name, '-'));
	if (dataOptions) {
		Q.extend(this.options, Q.Tool.options.levels, JSON.parse(dataOptions), 'Q.Tool');
	}

	// options cascade -- process option keys that start with '.' or '#'
	var partial, i;
	options = options || {};
	this.options = this.options || {};
	
	var pids = this.parentIds(),
	    len = pids.length,
	    o = options;
	
	for (i=len-1; i>=0; --i) {
		var pid = pids[i];
		if (Q.isEmpty(Q.tools[pid].options)) continue;
		o = Q.extend({}, Q.Tool.options.levels, Q.tools[pid].options);
	}
	
	// .Q_something
	for (i = 0, l = classes.length; i < l; i++) {
		var className = classes[i];
		if ((partial = o['.' + className])) {
			Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
		}
	}
	// #Q_parent_child_tool
	if ((partial = o['#' + this.element.id])) {
		Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
	}
	// #parent_child_tool, #child_tool
	var _idcomps = this.element.id.split('_');
	for (i = 0; i < _idcomps.length-1; ++i) {
		if ((partial = o['#' + _idcomps.slice(i).join('_')])) {
			Q.extend(this.options, Q.Tool.options.levels, partial, 'Q.Tool');
		}
	}

	// get options from options property on element
	if (element.options) {
		Q.extend(this.options, Q.Tool.options.levels, element.options, 'Q.Tool');
	}
	
	Q.setObject(['Q', 'tool'], this, element);
	
	this.beforeRemove = new Q.Event();

	if (!Q.tools[this.id]) {
		Q.tools[this.id] = this;
	}
	return this;
};

Q.Tool.options = {
	levels: 10
};

Q.Tool.beforeRemove = new Q.Event();

Q.Tool.prefixById = function _Q_Tool_prefixById(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-4);
	} else if (id.substr(-1) === '_') {
		return id;
	} else {
		return id + "_";
	}
};

/**
 * Reference a tool by its id
 */
Q.Tool.byId = function _Q_Tool_byId(id) {
	return Q.tools[id];
};

/**
 * Traverses elements in a particular container, including the container, and removes + destroys all tools.
 * @param elem HTMLElement
 *  The container to traverse
 * @param removeCached boolean
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-cache" attribute
 *  should be removed.
 */
Q.Tool.remove = function _Q_Tool_remove(elem, removeCached) {
	Q.find(elem, true, null, function _Q_Tool_remove_found(toolElement) {
		var tool = Q.Tool.from(toolElement);
		if (tool) {
			tool.remove(removeCached);
		}
	});
};

/**
 * Traverses children in a particular container and removes + destroys all tools.
 * @param elem HTMLElement
 *  The container to traverse
 * @param removeCached boolean
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-cache" attribute
 *  should be removed.
 */
Q.Tool.clear = function _Q_Tool_clear(elem, removeCached) {
	Q.find(elem.children || elem.childNodes, true, null, function _Q_Tool_remove_found(toolElement) {
		var tool = Q.Tool.from(toolElement);
		if (tool) {
			tool.remove(removeCached);
		}
	});
};

/**
 * Call this function to define a tool
 * @param name String|Object The name of the tool, e.g. "Q/foo". Also you can pass an object of name: filename here here.
 * @param ctor Function Your tool's constructor. You can also pass a filename here, in which case the other parameters are ignored.
 * @param defaultOptions Object An optional hash of default options for the tool
 * @param stateKeys Array An optional array of key names to copy from options to state
 * @param methods Object An optional hash of method functions to assign to the prototype
 */
Q.Tool.define = function (name, ctor, defaultOptions, stateKeys, methods) {
	if (typeof name === 'object') {
		for (var n in name) {
			Q.Tool.define(n, name[n]);
		}
		return;
	}
	name = Q.normalize(name);
	if (typeof ctor === 'string') {
		if (typeof Q.Tool.constructors[name] !== 'function') {
			_qtdo = _qtdo || {};
		    return Q.Tool.constructors[name] = ctor;
		}
		return ctor;
	}
	if (typeof(stateKeys) === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	ctor.options = defaultOptions || {};
	ctor.stateKeys = stateKeys;
	if (typeof ctor !== 'function') {
		throw "Q.Tool.define requires ctor to be a string or a function";
	}
	Q.extend(ctor.prototype, methods);
	Q.Tool.constructors[name] = ctor;
	Q.Tool.onLoadedConstructor(name).handle(name, ctor);
	Q.Tool.onLoadedConstructor("").handle(name, ctor);
	return ctor;
};

Q.Tool.beingActivated = undefined;

var _qtdo = {};
Q.Tool.define.options = function (toolName, setOptions) {
	toolName = Q.normalize(toolName);
	if (Q.Tool.constructors[name]) {
		options = Q.Tool.constructors[name].options;
	} else {
		options = _qtdo[toolName] = _qtdo[toolName] || {};
	}
	if (setOptions) {
		Q.extend(options, setOptions);
	}
	return options;
};

/**
 * Call this function to define a jQuery plugin, and a tool with the same name that uses it.
 * @param name String The name of the jQuery plugin and tool, e.g. "Q/foo"
 * @param ctor Function Your jQuery plugin's constructor
 * @param defaultOptions Object An optional hash of default options for the plugin
 * @param stateKeys Array An optional array of key names to copy from options to state
 * @param methods Object An optional hash of method functions to assign to the prototype
 */
Q.Tool.jQuery = function(name, ctor, defaultOptions, stateKeys, methods) {
	if (typeof name === 'object') {
		for (var n in name) {
			Q.Tool.jQuery(n, name[n]);
		}
		return;
	}
	name = Q.normalize(name);
	if (typeof ctor === 'string') {
		if (typeof window.jQuery.fn.plugin[name] !== 'function') {
			_qtjo[name] = _qtjo[name] = {};
		    return window.jQuery.fn.plugin[name] = ctor;
		}
		return ctor;
	}
	if (typeof(stateKeys) === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	Q.onJQuery.add(function ($) {
		function jQueryPluginConstructor(options /* or methodName, argument1, argument2, ... */) {
			if (typeof arguments[0] === 'string') {
				var method = arguments[0];
				if (jQueryPluginConstructor.methods[method]) {
					// invoke method on this with arguments
					return jQueryPluginConstructor.methods[method].apply(
						this, Array.prototype.slice.call(arguments, 1)
					);
				}
			} else {
				arguments[0] = Q.extend({}, 10, jQueryPluginConstructor.options, 10, arguments[0]);
				var args = arguments;
				$(this).each(function () {
					var key = name + ' state';
					var $this = $(this);
					if ($this.data(key)) {
						// plugin was constructed, so call destroy method if it's defined,
						// before calling constructor again
						$this.plugin(name, 'destroy');
					}
					$this.data(key, Q.copy(options, stateKeys));
					ctor.apply($this, args);
				});
			}
			return this;
		};
		jQueryPluginConstructor.options = defaultOptions || {};
		jQueryPluginConstructor.methods = methods || {};
		$.fn[name] = jQueryPluginConstructor;
		var ToolConstructor = Q.Tool.define(name, function _Q_Tool_jQuery_toolConstructor(options) {
			$(this.element).plugin(name, options, this);
			this.beforeRemove.set(function () {
				$(this.element).plugin(name, 'destroy', this);
			}, 'Q');
		});
		Q.each(methods, function (method, handler) {
			ToolConstructor.prototype[method] = function _Q_Tool_jQuery_method() {
				$(this.element).plugin(name, method, options, this);
			};
		});
	});
};

var _qtjo = {};
Q.Tool.jQuery.options = function (pluginName, setOptions) {
	pluginName = Q.normalize(pluginName);
	if (Q.Tool.constructors[name]) {
		options = window.jQuery.fn[pluginName].options;
	} else {
		options = _qtjo[pluginName] = _qtjo[pluginName] || {};
	}
	if (setOptions) {
		Q.extend(options, setOptions, 10);
	}
	return options;
};

Q.Tool.nextDefaultId = 1;
var _qtc = Q.Tool.constructors = Q.constructors;

/**
 * Gets child tools contained in the tool, as determined by their prefixes
 * based on the prefix of the tool.
 * @param append The string to append to the prefix to find the child tools
 * @return Object A hash of {prefix: Tool} pairs
 */
Q.Tool.prototype.children = function Q_Tool_prototype_children(append) {
	var result = {},
	    prefix2 = Q.normalize(append ? this.prefix + append : this.prefix),
		id, ni;
	for (id in Q.tools) {
		ni = Q.normalize(id);
		if (id.length > prefix2.length && ni.substr(0, prefix2.length) == prefix2) {
			result[id] = Q.tools[id];
		}
	}
	return result;
};

/**
 * Gets the first child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * @param append The string to append to the prefix to find the child tool
 * @return Tool|null
 */
Q.Tool.prototype.child = function Q_Tool_prototype_child(append) {
	var result = {};
	var prefix2 = Q.normalize(append ? this.prefix + append : this.prefix);
	var id;
	for (id in Q.tools) {
		if (id.length > this.prefix.length
		 && Q.normalize(id.substr(0, prefix2.length)) === prefix2) {
			return Q.tools[id];
		}
	}
	return null;
};

/**
 * Gets the first child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * @return Tool|null
 */
Q.Tool.prototype.parentIds = function Q_Tool_prototype_parentIds() {
	var prefix2 = Q.normalize(this.prefix), ids = [], id, ni;
	for (id in Q.tools) {
		ni = Q.normalize(id);
		if (ni.length < prefix2.length-1 && ni === prefix2.substr(0, ni.length)) {
			ids.push(id);
		}
	}
	// sort in reverse length order
	ids.sort(function (a, b) { return String(b).length - String(a).length } );
	return ids;
};

/**
 * Gets parents tools containing the tool, as determined by their prefixes
 * based on the prefix of the tool.
 * @return Object A hash of {prefix: Tool} pairs
 */
Q.Tool.prototype.parents = function Q_Tool_prototype_parents() {
	var ids = [], ids, i;
	ids = this.parentIds();
	var result = {}, len = ids.length;
	for (i=0; i<len; ++i) {
		id = ids[i];
		result[id] = Q.tools[id];
	}
	return result;
};

/**
 * Gets the first child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * @return Tool|null
 */
Q.Tool.prototype.parent = function Q_Tool_prototype_parent() {
	var ids = [], ids, i;
	ids = this.parentIds();
	return ids.length ? Q.tools[ids[0]] : null;
};

/**
 * Called when a tool instance is removed, possibly
 * being replaced by another.
 * Typically happens after an AJAX call which returns
 * markup for the new instance tool.
 * Also can be used for removing a tool instance
 * and all of its children.
 * @param removeCached boolean
 *  Defaults to false. Whether or not to remove the actual tool if its containing element
 *  has a "data-Q-cache" attribute.
 * @return {Q.Tool|null} Returns existing tool if it's being replaced, otherwise returns null.
 */
Q.Tool.prototype.remove = function _Q_Tool_prototype_remove(removeCached) {

	var shouldRemove = removeCached || !this.element.getAttribute('data-Q-cache');

	// give the tool a chance to clean up after itself
	if (shouldRemove) {
		Q.Tool.beforeRemove.handle(this);
		Q.handle(this.beforeRemove);
	}

	// removes the nodes from the DOM
	if (this.element.parentNode) {
		Q.removeElement(this.element);
	}

	// remove all the tool's events automatically
	if (shouldRemove) {
		var tool = this;
		while (Q.Event.forTool[this.id] && Q.Event.forTool[this.id].length) {
			// keep removing the first element of the array until it is empty
			Q.Event.forTool[this.id][0].remove(tool);
		}
		
		var p;
		if (p = Q.Event.jQueryForTool[this.id]) {
			for (i=p.length-1; i >= 0; --i) {
				var off = p[i][0];
				window.jQuery.fn[off].call(p[i][1], p[i][2]);
			}
			Q.Event.jQueryForTool[this.id] = [];
		}

		// finally, remove the tool from the array of tools on the page
		delete Q.tools[this.id];
	}

	return null;
};

/**
 * If jQuery is available, returns jQuery(selector, this.element).
 * Just a tiny Backbone.js-style convenience helper; this.$ is similar
 * to $, but scoped to the DOM tree of this tool.
 *
 * @param selector String
 *   jQuery selector
 * @return
 *   jQuery object matched by the given selector
 */
Q.Tool.prototype.$ = function _Q_Tool_prototype_$(selector) {
	if (window.jQuery) {
		return selector === undefined
			? window.jQuery(this.element)
			: window.jQuery(selector, this.element);
	} else {
		throw "Q.Tool.prototype.$ requires jQuery";
	}
};

/**
 * Returns all subelements with the given class name.
 *
 * @param className String
 *   the class name to look for
 * @return NodeList
 *   a list of nodes with the given class name.
 */
Q.Tool.prototype.getElementsByClassName = function _Q_Tool_prototype_getElementsByClasName(className) {
	return this.element.getElementsByClassName(className);
};

/**
 * Returns a string that is already properly encoded and can be set as the value of an options attribute
 * @param Object options
 *   the options to pass to a tool
 * @return String
 */
Q.Tool.encodeOptions = function _Q_Tool_stringFromOptions(options) {
	return JSON.stringify(options).encodeHTML().replaceAll({"&quot;": '"'});
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * @method Q.Tool.setUpElement
 * @param {String|HTMLElement} element
 *  The tag of the element, such as "div", or a reference to an existing HTMLElement
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return HTMLElement
 *  Returns an element you can append to things
 */
Q.Tool.setUpElement = function _Q_Tool_element(element, toolType, toolOptions, id, prefix) {
	if (typeof toolOptions === 'string') {
		id = toolOptions;
		toolOptions = undefined;
	}
	if (typeof element === 'string') {
		element = document.createElement(element);
	}
	var ntt = toolType.replace(new RegExp('/', 'g'), '_');
	element.setAttribute('class', 'Q_tool '+ntt+'_tool');
	if (!id) {
		var p1, p2;
		p1 = prefix ? prefix : (Q.Tool.beingActivated ? Q.Tool.beingActivated.prefix : '');
		do {
			p2 = p1 + '_' + (Q.Tool.nextDefaultId++) + '_' + ntt + '_';
		} while (Q.tools[p2]);
		id = p2 + 'tool';
	}
	element.setAttribute('id', id);
	if (toolOptions) {
		element.options = toolOptions;
	}
	return element;
};

/**
 * Returns HTML for an element that it can be used to activate a tool
 * @method Q.Tool.setUpElementHTML
 * @param {String|HTMLElement} element
 *  The tag of the element, such as "div", or a reference to an existing HTMLElement
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return String
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.setUpElementHTML = function _Q_Tool_elementHTML(element, toolType, toolOptions, id, prefix) {
	var e = Q.Tool.setUpElement(element, toolType, null, id, prefix);
	var ntt = toolType.replace(new RegExp('/', 'g'), '_');
	e.setAttribute('data-'+ntt.replace(new RegExp('_', 'g'), '-'), Q.Tool.encodeOptions(toolOptions));
	return e.outerHTML;
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * The prefix and id of the element are derived from the tool on which this method is called.
 * @method Q.Tool.setUpElement
 * @param {String|HTMLElement} element
 *  The tag of the element, such as "div", or a reference to an existing HTMLElement
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return HTMLElement
 *  Returns an element you can append to things
 */
Q.Tool.prototype.setUpElement = function (element, toolType, toolOptions, id) {
	return Q.Tool.setUpElement(element, toolType, toolOptions, id, this.prefix);
};

/**
 * Returns HTML for an element that it can be used to activate a tool.
 * The prefix and id of the element are derived from the tool on which this method is called.
 * For example: $('container').append(Q.Tool.make('Streams/chat')).activate(options);
 * @method Q.Tool.setUpElementHTML
 * @param {String|HTMLElement} element
 *  The tag of the element, such as "div", or a reference to an existing HTMLElement
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return String
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.prototype.setUpElementHTML = function (element, toolType, toolOptions, id) {
	return Q.Tool.setUpElementHTML(element, toolType, toolOptions, id, this.prefix);
};

/**
 * Returns a tool corresponding to the given DOM element, if such tool has already been constructed.
 *
 * @param toolElement HTMLElement
 *   the root element of the desired tool
 * @return Q.Tool|null
 *   the tool corresponding to the given element, otherwise null
 */
Q.Tool.from = function _Q_Tool_from(toolElement) {
	if (typeof toolElement === 'string') {
		toolElement = document.getElementById(toolElement);
	}
	return toolElement.Q ? toolElement.Q.tool : null;
};

/**
 * For debugging purposes only, allows to log tool names conveniently
 */
Q.Tool.prototype.toString = function _Q_Tool_prototype_toString() {
	return this.id.substr(0, this.id.length - 1);
};

/**
 * Loads the script corresponding to a tool
 * @param toolElement {DOMElement}
 * @param callback {Function} The callback to call when the corresponding script has been loaded and executed
 * @param shared pass this only when constructing a tool
 * @return {boolean} whether the script needed to be loaded
 */
function _loadToolScript(toolElement, callback, shared) {
	var id = toolElement.id;
	var classNames = toolElement.className.split(' ');
	Q.each(classNames, function (i, className) {
		if (className === 'Q_tool' || className.slice(-5) !== '_tool') {
			return;
		}
		var toolName = Q.normalize(className.substr(0, className.length-5));
		var toolFunc = _qtc[toolName];
		if (typeof toolFunc === 'undefined') {
			Q.Tool.onMissingConstructor.handle(_qtc, toolName);
			toolFunc = _qtc[toolName];
			if (typeof toolFunc !== 'function') {
				console.warn("Q.Tool.loadScript: Missing tool constructor for " + toolName);
			}
		}
		if (typeof toolFunc === 'function') {
			callback(toolElement, toolFunc, toolName);
		} else if (typeof toolFunc === 'string') {
			var existingOptions = _qtdo[toolName];
			if (shared) {
				var uniqueToolId = "tool " + (shared.waitingForTools.length+1);
				shared.waitingForTools.push(uniqueToolId);
			}
			Q.addScript(toolFunc, function _loadToolScript_loaded() {
				toolFunc = _qtc[toolName];
				if (typeof toolFunc !== 'function') {
					Q.Tool.onMissingConstructor.handle(_qtc, toolName);
					toolFunc = _qtc[toolName];
					if (typeof toolFunc !== 'function') {
						throw "Q.Tool.loadScript: Missing tool constructor for " + toolName;
					}
				}
				toolFunc.options = Q.extend(toolFunc.options, 10, existingOptions);
				callback(toolElement, toolFunc, toolName, uniqueToolId);
			});
		} else if (typeof toolFunc !== 'undefined') {
			throw "Q.Tool.loadScript: toolFunc cannot be " + typeof(toolFunc);
		}
	});
};

Q.Tool.onLoadedConstructor = Q.Event.factory({}, [""]);
Q.Tool.onMissingConstructor = new Q.Event();

Q.Session = function _Q_Session() {
	// TODO: Set a timer for when session expires?
	return {};
};

/**
 * Q.Cache constructor
 * @param options {Object} you can pass the following options:
 *  "localStorage": use local storage instead of page storage
 *  "sessionStorage": use session storage instead of page storage
 *  "name": the name of the cache, not really used for now
 *  "max": the maximum number of items the cache should hold. Defaults to 100.
 */
Q.Cache = function _Q_Cache(options) {
	options = options || {};
	this.localStorage = !!options.localStorage;
	this.sessionStorage = !!options.sessionStorage;
	this.name = options.name;
	this.data = {};
	this.special = {};
	var _earliest, _latest, _count;
	if (options.localStorage) {
		this.localStorage = true;
	} else if (options.sessionStorage) {
		this.sessionStorage = true;
	} else {
		this.documentStorage = true;
		_earliest = _latest = null;
		_count = 0;
	}
	this.max = options.max || 100;
	/**
	 * Returns the key corresponding to the entry that was touched the earliest
	 * @return {String}
	 */
	this.earliest = function _Q_Cache_earliest() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _earliest;
			} else {
				var result = Q_Cache_get(this, "earliest", true);
				return result === undefined ? null : result;
			}
		} else {
			if (this.documentStorage) {
				_earliest = newValue;
			} else {
				Q_Cache_set(this, "earliest", newValue, true);
			}
		}
	};
	/**
	 * Returns the key corresponding to the entry that was touched the latest
	 * @return {String}
	 */
	this.latest = function _Q_Cache_latest() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _latest;
			} else {
				var result = Q_Cache_get(this, "latest", true);
				return result === undefined ? null : result;
			}
		} else {
			if (this.documentStorage) {
				_latest = newValue;
			} else {
				Q_Cache_set(this, "latest", newValue, true);
			}
		}
	};
	/**
	 * Returns the number of entries in the cache
	 * @return {Number}
	 */
	this.count = function _Q_Cache_count() {
		var newValue = arguments[0]; // for internal use
		if (newValue === undefined) {
			if (this.documentStorage) {
				return _count;
			} else {
				var result = Q_Cache_get(this, "count", true);
				return result || 0;
			}
		} else {
			if (this.documentStorage) {
				_count = newValue;
			} else {
				Q_Cache_set(this, "count", newValue, true);
			}
		}
	};
};
function Q_Cache_get(cache, key, special) {
	if (cache.documentStorage) {
		return (special === true) ? cache.special[key] : cache.data[key];
	} else {
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		var item = storage.getItem(cache.name + (special===true ? "\t" : "\t\t") + key);
		return item ? JSON.parse(item) : undefined;
	}
}
function Q_Cache_set(cache, key, obj, special) {
	if (cache.documentStorage) {
		if (special === true) {
			cache.special[key] = obj;
		} else {
			cache.data[key] = obj;
		}
	} else {
		var k, f=1, json, value;
		try {
			json = JSON.stringify(obj);
		} catch (e) {
			// we only stuff Objects into the cache
			json = '{';
			for (k in obj) {
				if (!f) json += ',';
				try { value = JSON.stringify(obj[k]); json += JSON.stringify(k) + ':' + (value === undefined ? null : value); }
				catch (e) { json += JSON.stringify(k) + "null"; }
				f=0;
			}
			json += '}';
		}
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		storage.setItem(cache.name + (special===true ? "\t" : "\t\t") + key, json);
	}
}
function Q_Cache_remove(cache, key, special) {
	if (cache.documentStorage) {
		if (special === true) {
			delete cache.special[key];
		} else {
			delete cache.data[key];
		}
	} else {
		var storage = cache.localStorage ? localStorage : (cache.sessionStorage ? sessionStorage : null);
		storage.removeItem(cache.name + (special === true ? "\t" : "\t\t") + key);
	}
}
function Q_Cache_pluck(cache, existing) {
	var value;
	if (existing.prev) {
		value = Q_Cache_get(cache, existing.prev);
		if (!value) debugger;
		value.next = existing.next;
		Q_Cache_set(cache, existing.prev, value);
	} else {
		cache.earliest(existing.next);
	}
	if (existing.next) {
		value = Q_Cache_get(cache, existing.next);
		value.prev = existing.prev;
		Q_Cache_set(cache, existing.next, value);
	} else {
		cache.latest(existing.prev);
	}
}
/**
 * Generates the key under which things will be stored in a cache
 * @param args {Array} the arguments from which to generate the key
 * @param functions {Array} optional array to which all the functions found in the arguments will be pushed
 * @return String
 */
Q.Cache.key = function _Cache_key(args, functions) {
	var i, keys = [];
	for (i=0; i<args.length; ++i) {
		if (typeof args[i] !== 'function') {
			keys.push(args[i]);
		} else if (functions && functions.push) {
			functions.push(args[i]);
		}
	}
	return JSON.stringify(keys);
};
/**
 * Accesses the cache and sets an entry in it
 * @param key {String} the key to save the entry under, or an array of arguments
 * @param options {Options} supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
	var existing, previous, count;
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}
	if (!options || !options.dontTouch) {
		// marks the item as being recently used, if it existed in the cache already
		existing = this.get(key);
		if (!existing) {
			count = this.count() + 1;
			this.count(count);
		}
	}

	var value = {
		cbpos: cbpos,
		subject: subject,
		params: params,
		prev: (options && options.prev) ? options.prev : (existing ? existing.prev : this.latest()),
		next: (options && options.next) ? options.next : (existing ? existing.next : null)
	};
	Q_Cache_set(this, key, value);
	if (!existing || (!options || !options.dontTouch)) {
		if ((previous = Q_Cache_get(this, value.prev))) {
			previous.next = key;
			Q_Cache_set(this, value.prev, previous);
		}
		this.latest(key);
		if (count === 1) {
			this.earliest(key);
		}
	}

	if (count > this.max) {
		this.remove(this.earliest());
	}

	return existing ? true : false;
};
/**
 * Accesses the cache and gets an entry from it
 * @param key {String} the key to search for
 * @param options {Object} supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {mixed} whatever is stored there, or else returns undefined
 */
Q.Cache.prototype.get = function _Q_Cache_prototype_get(key, options) {
	var existing, previous;
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}
	existing = Q_Cache_get(this, key);
	if (!existing) {
		return undefined;
	}
	if ((!options || !options.dontTouch) && this.latest() !== key) {
		if (this.earliest() == key) {
			this.earliest(existing.next);
		}
		Q_Cache_pluck(this, existing);
		existing.prev = this.latest();
		existing.next = null;
		Q_Cache_set(this, key, existing);
		if ((previous = Q_Cache_get(this, existing.prev))) {
			previous.next = key;
			Q_Cache_set(this, existing.prev, previous);
		}
		this.latest(key);
	}
	return existing;
};
/**
 * Accesses the cache and removes an entry from it.
 * @param key {String} the key of the entry to remove
 * @return {Boolean} whether there was an existing entry under that key
 */
Q.Cache.prototype.remove = function _Q_Cache_prototype_remove(key) {
	if (typeof key !== 'string') {
		key = Q.Cache.key(key);
	}

	var existing, count;

	existing = this.get(key, true);
	if (!existing) {
		return false;
	}

	count = this.count()-1;
	this.count(count);


	if (this.latest() === key) {
		this.latest(existing.prev);
	}
	if (this.earliest() === key) {
		this.earliest(existing.next);
	}

	Q_Cache_pluck(this, existing);
	Q_Cache_remove(this, key);

	return true;
};
/**
 * Accesses the cache and clears all entries from it
 */
Q.Cache.prototype.clear = function _Q_Cache_prototype_clear() {
	if (this.documentStorage) {
		this.special = {};
		this.data = {};
	} else {
		var key = this.earliest(), lastkey, item;
		// delete the cached items one by one
		while (key) {
			item = Q_Cache_get(this, key);
			if (item === undefined) break;
			lastkey = key;
			key = item.next;
			Q_Cache_remove(this, lastkey);
		}
	}
	this.earliest(null);
	this.latest(null);
	this.count(0);
};
/**
 * Cycles through all the entries in the cache
 * @param args {Array} An array consisting of some or all the arguments that form the key
 * @param callback {Function} Is passed two parameters: key, value, with this = the cache
 */
Q.Cache.prototype.each = function _Q_Cache_prototype_clear(args, callback) {
    var prefix = null;
    if (typeof args === 'function') {
        callback = args;
        args = undefined;
    } else {
        var json = Q.Cache.key(args);
        prefix = json.substring(0, json.length-1);
    }
	if (this.documentStorage) {
	    var cache = this;
	    return Q.each(this.data, function (k, v) {
	        if (prefix && k.substring(0, prefix.length) !== prefix) {
	            return;
	        }
	        if (callback.call(cache, k, v) === false) {
	            return false;
	        }
	    });
	} else {
		var key = cache.earliest(), lastkey, item;
		while (key) {
			item = Q_Cache_get(this, key);
			if (item === undefined) {
			    break;
			}
			lastkey = key;
			key = item.next;
			if (prefix && key.substring(0, prefix.length) !== prefix) {
	            return;
	        }
			if (callback.call(this, lastkey, item) === false) {
			    return false;
			}
		}
	}
};
Q.Cache.document = function _Q_Cache_document(name, max) {
	if (!Q.Cache.document.caches[name]) {
		Q.Cache.document.caches[name] = new Q.Cache({name: name, max: max});
	}
	return Q.Cache.document.caches[name];
};
Q.Cache.local = function _Q_Cache_local(name, max) {
	if (!Q.Cache.local.caches[name]) {
		Q.Cache.local.caches[name] = new Q.Cache({name: name, localStorage: true, max: max});
	}
	return Q.Cache.local.caches[name];
};
Q.Cache.session = function _Q_Cache_session(name, max) {
	if (!Q.Cache.session.caches[name]) {
		Q.Cache.session.caches[name] = new Q.Cache({name: name, sessionStorage: true, max: max});
	}
	return Q.Cache.session.caches[name];
};
Q.Cache.document.caches = {};
Q.Cache.local.caches = {};
Q.Cache.session.caches = {};

/**
 * Use this function to set handlers for when the page is loaded or unloaded.
 * @method page
 * @param page {String} "$Module/$action" or a more specific URI string, or "" to handle all pages
 * @param handler {Function} A function to run after the page loaded.
 *  If the page is already currently loaded (i.e. it is the latest loaded page)
 *  then the handler is run right away.
 *  The handler can optionally returns another function, which will be run when the page is unloaded.
 *  After a page is unloaded, all the "unloading" handlers added in this way are removed, so that
 *  the next time the "loading" handlers run, they don't create duplicate "unlodaing" handlers.
 * @param key {String} Use this to identify the entity setting the handler, e.g. "Users/authorize".
 *  If the key is undefined, it will be automatically set to "Q". To force no key, pass null here.
 *  Since "loading" handlers are not automatically removed, they can accumulate if the key was null.
 *  For example, if an AJAX call returns Javascript such as Q.page(uri, handler), omitting the key can
 *  lead to frustrating bugs as event handlers are registered multiple times, etc.
 */
Q.page = function _Q_page(page, handler, key) {
	if (key === undefined) {
		key = 'Q';
	}
	if (typeof page === 'object') {
		for (var k in page) {
			Q.page(k, page[k], key);
		}
		return;
	}
	if (typeof handler !== 'function') {
		return;
	}
	Q.onPageActivate(page).add(function Q_onPageActivate_handler() {
		var unload = handler.call(Q, Q.beforePageUnload("Q\t"+page));
		if (unload && typeof unload === "function") {
			Q.beforePageUnload("Q\t"+page).set(unload, key);
		}
	}, key);
};

/**
 * Initialize the Q javascript platform
 * @method init
 * @param options
 *  Supports the following options:
 *  "isLocalFile": defaults to false. Set this to true if you are calling Q.init from local file:/// context.
 */
Q.init = function _Q_init(options) {

	Q.handle(Q.onInit); // Call all the onInit handlers

	Q.addEventListener(window, 'unload', Q.onUnload);

	var checks = ["ready"];
	if (window.cordova) {
		checks.push("device");
	}
	var p = Q.pipe(checks, 1, function _Q_init_pipe_callback() {
		if (!Q.info) Q.info = {};
		Q.info.isCordova = !!window.device && window.device.available;
		if (options && options.isLocalFile) {
			Q.info.isLocalFile = true;
			Q.handle.options.loadUsingAjax = true;
		}
		if (Q.info.isCordova && !Q.cookie('Q_cordova')) {
			Q.cookie('Q_cordova', 'yes');
		}

		function _ready() {
			Q.addEventListener(document, 'online', Q.onOnline);
			Q.addEventListener(document, 'offline', Q.onOffline);
			Q.handle(navigator.onLine ? Q.onOnline : Q.onOffline);
			Q.ready();
		}

		function _getJSON() {
				if (window.JSON) _ready();
				else Q.addScript(Q.init.jsonLibraryUrl, _ready);
		}

		if (options && options.isLocalFile) {
			Q.loadUrl(Q.info.baseUrl, {
				ignoreHistory: true,
				skipNonce: true,
				onActivate: _getJSON,
				handler: function () {},
				slotNames: ["cordova"]
			});
		} else {
			_getJSON();
		}
	});

	function _domReady() {
		p.fill("ready")();
	}

	function _waitForDeviceReady() {
		if (checks.indexOf("device") < 0) {
			return;
		}
		function _Q_init_deviceready_handler() {
			if (!Q.info) Q.info = {};
			if ((Q.info.isCordova = window.device && window.device.available)) {
				// avoid opening external urls in app window
				document.addEventListener("click", function (e) {
					var t = e.target, s, i;
					do {
						if (t && t.nodeName === "A" && t.href && !t.outerHTML.match(/\Whref=[',"]#[',"]\W/) && t.href.match(/^https?:\/\//)) {
							e.preventDefault();
							s = (t.target === "_blank") ? "_system" : "_blank";
							window.open(t.href, s, "location=no");
						}
					} while ((t = t.parentNode));
				});
			}
			p.fill("device")();
		}
		if (window.device) _Q_init_deviceready_handler();
		else document.addEventListener('deviceready', _Q_init_deviceready_handler, false);
	}

	// Bind document ready event
	if (window.jQuery) {
		Q.jQueryPluginPlugin();
		Q.onJQuery.handle(window.jQuery, [window.jQuery]);
		window.jQuery(document).ready(_domReady);
	} else {
		var _timer=setInterval(function(){
			if(/loaded|complete/.test(document.readyState)) {
				clearInterval(_timer);
				_domReady();
			}
		}, 10);
	}
	
	_waitForDeviceReady();
};
Q.init.jsonLibraryUrl = "http://cdnjs.cloudflare.com/ajax/libs/json3/3.2.4/json3.min.js";

/**
 * This is called when the DOM is ready
 * @method ready
 */
Q.ready = function _Q_ready() {
	function readyWithNonce() {

		m_isReady = true;

		if (Q.info.isLocalFile) {
			// This is an HTML file loaded from the local filesystem
			var url = location.hash.queryField('url');
			if (url === undefined) {
				Q.handle(Q.info.baseUrl);
			} else {
				Q.handle(url.indexOf(Q.info.baseUrl) == -1 ? Q.info.baseUrl+'/'+url : url);
			}
			return;
		}

		// Try to add the plugin thing again
		Q.jQueryPluginPlugin();

		var body = document.getElementsByTagName('body')[0];
		Q.activate(body, undefined, function _onReadyActivate() {
			// Hash changes -- will work only in browsers that support it natively
			// see http://caniuse.com/hashchange
			Q.addEventListener(window, 'hashchange', Q.onHashChange.handle);
			
			// History changes -- will work only in browsers that support it natively
			// see http://caniuse.com/history
			Q.addEventListener(window, 'popstate', Q.onPopState.handle);

			// To support tool layouting, trigger 'layout' event on browser resize and orientation change
			Q.addEventListener(window, 'resize', Q.layout);
			Q.addEventListener(window, 'orientationchange', Q.layout);

			// Call the functions meant to be called after ready() is done
			Q.onReady.handle.call(window, window.jQuery);

			if (Q.info.isCordova && navigator.splashscreen) {
				navigator.splashscreen.hide();
			}

			// This is an HTML document loaded from our server
			try {
				Q.Page.beingActivated = true;
				Q.onPageActivate('').handle();
				if (Q.info && Q.info.uri) {
					var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
					Q.onPageActivate(moduleSlashAction).handle();
					if (Q.info.uriString !== moduleSlashAction) {
						Q.onPageActivate(Q.info.uriString).handle();
					}
				}
				Q.Page.beingActivated = false;
			} catch (e) {
				Q.Page.beingActivated = false;
				throw e;
			}
			
			if (location.hash.toString()) {
				Q_hashChangeHandler();
			}
		});

		// This is an HTML document loaded from our server
		var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
		try {
			Q.Page.beingLoaded = true;
			Q.onPageLoad('').handle();
			Q.onPageLoad(moduleSlashAction).handle();
			if (Q.info.uriString !== moduleSlashAction) {
				Q.onPageLoad(Q.info.uriString).handle();
			}
			Q.Page.beingLoaded = false;
		} catch (e) {
			Q.Page.beingLoaded = false;
			throw e;
		}
		
	}
	Q.loadNonce(readyWithNonce);
};

/**
 * This function is called by Q to make sure that we've loaded the session nonce.
 * If you like, you can also call it yourself.
 * @param {Function} callback This function is called when the nonce is loaded
 * @param {Object} context The "this" to pass to the callback
 * @param {Array} args The arguments to pass to the callback
 */
Q.loadNonce = function _Q_loadNonce(callback, context, args) {
	Q.nonce = Q.cookie('Q_nonce');
	if (Q.nonce) {
		Q.handle(callback, context, args);
		return;
	}
	Q.req('Q/nonce', 'data', function _Q_loadNonce_nonceLoaded(err, res) {
		Q.nonce = Q.cookie('Q_nonce');
		if (Q.nonce) {
			Q.handle(callback, context, args);
		} else {
			// Cookie wasn't loaded. Perhaps because this is a 3rd party cookie.
			// IE should have been appeased with a P3P policy from the server.
			// Otherwise, let's appease Safari-like browsers with Q.formPost.
			var action = Q.ajaxExtend(Q.action('Q/nonce'), 'data');
			Q.formPost(action, {"just": "something"}, 'post', function afterFormPost() {
				// we are hoping this returns after the form post
				Q.nonce = Q.cookie('Q_nonce');
				if (!Q.nonce) alert("Our server couldn't set cookies in this browser.");
			});
		}
	}, {"method": "post", "skipNonce": true});
};

/**
 * Call this function to set a notice that is shown when the page is almost about to be unloaded
 * @param notice {String}
 *   Required. The notice to set. It should typically be worded so that "Cancel" cancels the unloading.
 */
Q.beforeUnload = function _Q_beforeUnload(notice) {
	window.onbeforeunload = function(e){
		if (!notice) return undefined;
		var e = e || window.event;
		if (e) { // For IE and Firefox (prior to 4)
			e.returnValue = notice;
		}
		return notice; // For Safari and Chrome
	};
};

/**
 * Remove an element from the DOM and try to clean up memory as much as possible
 * @param element HTMLElement
 */
Q.removeElement = function _Q_removeElement(element) {
	if (window.jQuery) {
		return window.jQuery(element).remove();
	}
	element.parentNode.removeChild(element);
	try {
		for (var prop in element) {
			delete element[prop];
		}
	} catch (e) {
		// Old IE doesn't like this
	}
};

/**
 * Add an event listener to an element
 * @param element HTMLElement
 * @param eventName String
 * @param eventHandler Function
 */
Q.addEventListener = function _Q_addEventListener(element, eventName, eventHandler) {
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener = function _Q_addEventListener_wrapper(e) { Q.handle(eventHandler, element, [e]); }
		: eventHandler);
	if (typeof eventName === 'string') {
		var split = eventName.split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (typeof eventName === 'function') {
		var params = {
			original: eventHandler
		};
		eventHandler = eventName ( params );
		if (!('eventName' in params)) {
			throw "Custom $.fn.on handler: need to set params.eventName";
		}
		eventName = params.eventName;
	}

	if (Q.typeOf(eventName) === 'array') {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.addEventListener(element, eventName[i], eventHandler);
		}
		return;
	}
	if (element.addEventListener) {
		element.addEventListener(eventName, handler, false);
	} else if (element.attachEvent) {
		element.attachEvent('on'+eventName, handler);
	} else {
		element["on" + type] = function () {
			if (element["on" + type]) {
				element["on" + type].apply(this, arguments);
			}
			eventHandler.apply(this, arguments);
		}; // best we can do
	}
};

/**
 * Remove an event listener from an element
 * @param element HTMLElement
 * @param eventName String
 * @param eventHandler Function
 */
Q.removeEventListener = function _Q_addEventListener(element, eventName, eventHandler) {
	var handler = (eventHandler.typename === "Q.Event"
		? eventHandler.eventListener
		: eventHandler);
	if (typeof eventName === 'string') {
		var split = eventName.split(' ');
		if (split.length > 1) {
			eventName = split;
		}
	}
	if (Q.typeOf(eventName) === 'array') {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.removeEventListener(element, eventName[i], eventHandler);
		}
		return;
	}
	if (element.removeEventListener) {
		element.removeEventListener(eventName, handler, false);
	} else if (element.detachEvent) {
		element.detachEvent('on'+eventName, handler);
	} else {
		element["on" + type] = null; // best we can do
	}
};

/**
 * Triggers a method or Q.Event on all the tools inside a particular element
 * @param eventName String Required, the name of the method or Q.Event to trigger
 * @param element HTMLElement Optional element to traverse from (defaults to document.body).
 * @param Array args Any additional arguments that would be passed to the triggered method or event
 */
Q.trigger = function _Q_trigger(eventName, element, args) {
	var parts = eventName.split('.');
	Q.find(element || document.body, true, function _Q_trigger_found(toolElement) {
		var obj = Q.Tool.from(toolElement);
		if (obj) {
			var len = parts.length, i;
			for (i=0; i < len; ++i) {
				obj = obj [ parts[i] ];
			}
		}
		if (obj) {
			Q.handle(obj, toolElement, args);
		}
	}, null);
};

Q.layout = function _Q_layout(element) {
	Q.trigger('onLayout', element || document.body, []);
};

Q.clientId = function () {
	if (!Q.clientId.value) {
		var info = Q.Browser.detect();
		Q.clientId.value = (info.device || "desktop").substr(0, 4)
			+ "\t" + info.OS.substr(0, 3)
			+ "\t" + info.name.substr(0, 3)
			+ "\t" + info.mainVersion + (info.isWebView ? "n" : "w")
			+ "\t" + Math.floor(Date.now()/1000).toString(36)
	}
	return Q.clientId.value;
};

/**
 * Call this function to get an rfc4122 version 4 compliant id for the current client
 * TODO: consider replacing with https://github.com/broofa/node-uuid/blob/master/uuid.js
 */
Q.uuid = function () {
	return Q.uuid.value = Q.uuid.value || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
};

/**
 * Returns whether Q.ready() has been called
 * @method isReady
 */
Q.isReady = function _Q_isReady() {
	return m_isReady;
};

/**
 * Returns whether the client is currently connected to the 'net
 * @method isOnline
 */
Q.isOnline = function _Q_isOnline() {
	return m_isOnline;
};

/**
 * Loads a plugin
 * @method load
 * @param {String|Array} plugins
 * @param {Function} callback
 * @param {Object} options
 */
Q.load = function _Q_load(plugins, callback, options) {
	var urls = [];
	if (typeof plugins === 'string') {
		plugins = [plugins];
	}
	Q.each(plugins, function (i, plugin) {
		if (Q.plugins[plugin]) {
			return;
		}
		urls.push(Q.info.baseUrl+'/plugins/'+plugin+'/js/'+plugin+'.js');
	});
	return Q.addScript(urls, callback, options);	
};

/**
 * Obtain a URL
 * @param {Object} what
 *  Usually the stuff that comes after the base URL
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param Object options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
 */
Q.url = function _Q_url(what, fields, options) {
	if (fields) {
		what += '?';
		for (var k in fields) {
			what += '&'+encodeURIComponent(k)+'='+encodeURIComponent(fields[k]);
		}
	}
	var parts = what.split('?');
	if (parts.length > 2) {
		what = parts.slice(0, 2).join('?') + '&' + parts.slice(2).join('&');
	}
	var result = '';
	var baseUrl = (options && options.baseUrl) || Q.info.proxyBaseUrl || Q.info.baseUrl;
	if (!what) {
		result = baseUrl;
	} else if (what.isUrl()) {
		result = what;
	} else {
		result = (what.substr(0, 1) == '/') ? baseUrl+what : baseUrl+'/'+what;
	}
	if (Q.url.options.beforeResult) {
		var params = {
			what: what,
			fields: fields,
			result: result
		};
		Q.url.options.beforeResult.handle(params);
		result = params.result;
	}
	return result;
};

Q.url.options = {
	beforeResult: null
};

/**
 * Extends a string or object to be used with AJAX
 * @param what
 *  If a string, then treats it as a URL and
 *  appends ajax fields to the end of the querystring.
 *  If an object, then adds properties to it.
 * @param slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object or array, converts it to a comma-separated list
 * @param Object options
 *  Optional. A hash of options, including:
 *  "echo": A string to echo back. Used to keep track of responses
 *  'method': if set, adds a &Q.method=$method to the querystring
 *  'callback': if a string, adds a '&Q.callback='+encodeURIComponent(callback) to the querystring.
 *  'loadExtras': if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 * @return String|Object
 *  Returns the extended string or object
 */
Q.ajaxExtend = function _Q_ajaxExtend(what, slotNames, options) {
	if (!what && what !== '') {
		if (console && ('warn' in console)) {
			console.warn('Q.ajaxExtend received empty url');
		}
		return '';
	}
	var slotNames2 = (typeof slotNames === 'string') ? slotNames : slotNames.join(',');
	var timestamp = Q.microtime(true);
	if (typeof(what) == 'string') {
		var what2 = what;
		if (Q.info && Q.info.baseUrl === what2) {
			what2 += '/'; // otherwise we will have 301 redirect with trailing slash on most servers
		}
		what2 += (what.indexOf('?') < 0) ? '?' : '&';
		what2 += encodeURI('Q.ajax='+(options && options.loadExtras ? 'loadExtras' : 'json'))+
			encodeURI('&Q.timestamp=')+encodeURIComponent(timestamp);
		if (slotNames2) what2 += encodeURI('&Q.slotNames=') + encodeURIComponent(slotNames2);
		if (options) {
			if (typeof options.callback === 'string') {
				what2 += encodeURI('&Q.callback=') + encodeURIComponent(options.callback);
			}
			if ('echo' in options) {
				what2 += encodeURI('&Q.echo=') + encodeURIComponent(options.echo);
			}
			if (options.method) {
				what2 += encodeURI('&Q.method=' + encodeURIComponent(options.method.toUpperCase()));
			}
		}
		if (Q.nonce !== undefined) {
			what2 += encodeURI('&Q.nonce=') + encodeURIComponent(Q.nonce);
		}
	} else {
		// assume it's an object
		what2 = {};
		for (var k in what) {
			what2[k] =  what[k];
		}
		what2.Q = {
			"ajax": "json",
			"timestamp": timestamp,
			"slotNames": slotNames2
		};
		if (options) {
			if (options.callback) {
				what2.Q.callback = callback;
			}
			if ('echo' in options) {
				what2.Q.echo = options.echo;
			}
			if (options.method) {
				what2.Q.method = options.method;
			}
		}
		if ('nonce' in Q) {
			what2.Q.nonce = Q.nonce;
		}
	}
	return what2;
};

/**
 * Get the URL for an action
 * @param String uri
 *  A string of the form "Module/action" or an absolute url, which is returned unmodified.
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param Object options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
 */
Q.action = function _Q_action(uri, fields, options) {
	if (uri.isUrl()) {
		return Q.url(uri, fields);
	}
	return Q.url("action.php/"+uri, fields, options);
};

/**
 * The easiest way to make direct web service requests in Q
 * @param String uri
 *  A string of the form "Module/action"
 * @param String|Array slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an array, converts it to a comma-separated list
 * @param Function callback
 *  The JSON will be passed to this callback function
 * @param Object options
 *  A hash of options, to be passed to Q.request
 */
Q.req = function _Q_req(uri, slotNames, callback, options) {
	if (typeof options === 'string') {
		options = {'method': options};
	}
	var args = arguments, index = (typeof arguments[0] === 'string') ? 0 : 1;
	args[index] = Q.action(args[index]);
	Q.request.apply(this, args);
};

/**
 * A way to make requests that is cross-domain. Typically used for requesting JSON or various templates.
 * It uses script tags and JSONP callbacks for remote domains, and prefers XHR for the local domain.
 * @param Object fields
 *  Optional object of fields to pass
 * @param String url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param String|Object slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object, converts it to a comma-separated list
 * @param Function callback
 *  The JSON will be passed to this callback function
 * @param Object options
 *  A hash of options, including:
 *  "post": if set, adds a &Q.method=post to the querystring
 *  "method": if set, adds a &Q.method= that value to the querystring, default "get"
 *  "fields": optional fields to pass with any method other than "get"
 *  "skipNonce": if true, skips loading of the nonce
 *  "xhr": if false, avoids XHR. If true, tries to make xhr based on "method" option.
 *     Or pass an object with properties to merge onto the xhr object, including a special "sync" property to make the call synchronous.
 *     Or pass a function which will be run before .send() is executed. First parameter is the xhr object, second is the options.
 *  "preprocess": an optional function that takes the xhr object before the .send() is invoked on it
 *  "parse": defaults to 'json'. If false, then just returns the requested string.
 *  "extend": defaults to true. If false, the URL is not extended with Q fields.
 *  "callbackName": if set, the URL is not extended with Q fields and the value is used to name the callback field in the request.
 *  "duplicate": defaults to true, but you can set it to false in order not to fetch the same url again
 *  "timeout": timeout to wait for response defaults to 1.5 sec. Set to false to disable
 *  "onTimeout": handler to call when timeout is reached. First argument is a function which can be called to cancel loading.
 *  "onLoad": handler to call when data is loaded but before it is processed - when called the argument of "onTimeout" does nothing
 *  "handleRedirects": if set and response data.redirect.url is not empty, automatically call this function. Defaults to Q.handle.
 *  "quiet": defaults to true. This option is just passed to your onLoadStart/onLoadEnd handlers in case they want to respect it.
 *  "query": if true simply returns the query url without issuing the request
 */
Q.request = function (url, slotNames, callback, options) {
	
	var fields, k, delim;
	if (typeof url === 'object') {
		fields = arguments[0];
		url = arguments[1];
		slotNames = arguments[2];
		callback = arguments[3];
		options = arguments[4];
		delim = (url.indexOf('?') < 0) ? '?' : '&';
		url += delim + Q.serializeFields(fields);
	}
	if (typeof slotNames === 'function') {
		options = callback;
		callback = slotNames;
		slotNames = [];
	}
	var o = Q.extend({}, Q.request.options, options);
	if (o.skipNonce) {
		return _Q_request_makeRequest.call(this, url, slotNames, callback, o);
	} else {
		Q.loadNonce(_Q_request_makeRequest, this, [url, slotNames, callback, o]);
	}
	function _Q_request_makeRequest (url, slotNames, callback, o) {

		var tout = false, t = {};
		if (o.timeout !== false) tout = o.timeout || 1500;
	
		if (o.parse !== false && callback) {
			var _callback = callback;
			callback = function _Q_request_callback(err, content) {
				if (err) {
					return _callback(err);
				}
				var data;
				try {
					data = (typeof content === 'string' ? JSON.parse(content) : content);
				} catch (e) {
					console.warn('Q.request(' + url + ',['+slotNames+']):' + e);
					return callback({"errors": [e]}, content);
				}
				if (data && data.redirect && data.redirect.url) {
					o.handleRedirects && o.handleRedirects.call(Q, data.redirect.url);
				}
				_callback.call(this, err, data);
			};
		}

		function _onStart () {
			Q.handle(o.onLoadStart, this, [o]);
			if (tout !== false) {
				t.timeout = setTimeout(_onTimeout, tout);
			}
		}

		function _onTimeout () {
			if (!t.loaded) {
				Q.handle(o.onShowCancel, this, [_onCancel, o]);
				if (o.onTimeout) {
					o.onTimeout(_onCancel);
				}
			}
		}

		function _onLoad (data) {
			t.loaded = true;
			if (t.timeout) {
				clearTimeout(t.timeout);
			}
			Q.handle(o.onLoadEnd, this, [o]);
			if (!t.cancelled) {
				if (o.onLoad) {
					o.onLoad(data);
				}
				Q.handle(callback, this, [null, data]);
			}
		}
		
		function _onCancel (status, msg) {
			var msg = msg || Q.text.Q.request[status] || Q.text.Q.request.error;
			msg = msg.interpolate({'status': status, 'url': url})
			t.cancelled = true;
			_onLoad();
			var errors = {
				errors: [{message: msg || "Request was canceled", code: status}]
			};
			o.onCancel.handle.call(this, errors, o);
			Q.handle(callback, this, [errors, errors]);
		}

		if (!o.query && o.xhr !== false
		&& url.search(Q.info.baseUrl) === 0) {
			
			function xhr(url, slotNames, onSuccess, onCancel, options) {					
				var xmlhttp;
			    if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
			        xmlhttp = new XMLHttpRequest();
			    } else { // code for IE6, IE5
			        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
			    }
			    xmlhttp.onreadystatechange = function() {
			        if (xmlhttp.readyState == 4) {
						if (xmlhttp.status == 200) {
							onSuccess.call(xmlhttp, xmlhttp.responseText);
						} else {
							console.log("Q.request xhr: " + xmlhttp.status + ' ' + xmlhttp.responseText.substr(1000));
							onCancel.call(xmlhttp, xmlhttp.status);
						}
			        }
			    }
				var method = options.method || 'GET';
				var verb = method.toUpperCase();
				var overrides = {
					loadExtras: !!options.loadExtras
				};
				if (verb !== 'GET') {
					verb = 'POST'; // browsers don't always support other HTTP verbs;
					overrides.method = options.method;
				}
				if (typeof options.xhr === 'function') {
					options.xhr.call(xmlhttp, xmlhttp, options);
				}
				var sync = (options.xhr === 'sync');
				if (Q.isPlainObject(options.xhr)) {
					Q.extend(xmlhttp, options.xhr);
					sync = sync || xmlhttp.sync;
				}
				if (o.extend !== false) {
					url = Q.ajaxExtend(url, slotNames, overrides);
				}
				var content = Q.serializeFields(options.fields);
				if (verb === 'GET') {
					xmlhttp.open('GET', url + (content ? '&' + content : ''), sync);
					xmlhttp.send();
				} else {
			    	xmlhttp.open(verb, url, sync);
					xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					//xmlhttp.setRequestHeader("Content-length", content.length);
					//xmlhttp.setRequestHeader("Connection", "close");
					xmlhttp.send(content);
				}
			}

			_onStart();
			return xhr(url, slotNames, _onLoad, _onCancel, o);
		}

		var i = Q.request.callbacks.length;
		var url2 = url;
		if (callback) {
			Q.request.callbacks[i] = function _Q_request_JSONP(data) {
				delete Q.request.callbacks[i];
				Q.removeElement(script);
				_onLoad(data, callback);
			};
			if (o.callbackName) {
				url2 = url + (url.indexOf('?') < 0 ? '?' : '&')
					+ encodeURIComponent(o.callbackName) + '='
					+ encodeURIComponent('Q.request.callbacks['+i+']');
			} else {
				url2 = (o.extend === false)
					? url
					: Q.ajaxExtend(url, slotNames, Q.extend(o, {callback: 'Q.request.callbacks['+i+']'}));
			}
		} else {
			url2 = (o.extend === false) ? url : Q.ajaxExtend(url, slotNames, o);
		}
		if (options && options.fields) {
			delim = (url.indexOf('?') < 0) ? '?' : '&';
			url2 += delim + Q.serializeFields(options.fields);
		}
		if (o.query) {
			return url2;
		} else {
			_onStart();
			var script = Q.addScript(url2, null, {'duplicate': o.duplicate});
		}
	}
};

Q.request.callbacks = []; // used by Q.request

/**
 * Try to find an error message assuming typical error data structures for the arguments
 * @param {Object} data an object where the errors may be found
 * @return {String|null} The first error message found, or null
 */
Q.firstErrorMessage = function _Q_firstErrorMessage(data) {
	var error = null;
	if (Q.isEmpty(data)) {
		return;
	}
	if (data.errors && data.errors[0]) {
		error = data.errors[0];
	} else if (data.error) {
		error = data.error;
	} else if (Q.typeOf(data) === 'array') {
		error = data[0];
	} else {
		error = data;
	}
	if (!error) {
		return null;
	}
	return (typeof error === 'string')
		? error
		: (error.message ? error.message : JSON.stringify(error));
};

/**
 * Turns AJAX errors returned by Q to a hash that might be
 * useful for validating a form.
 * @param Object errors
 *  A hash of errors
 * @params Array fields
 *  Optional. An array of field names to restrict ourselves to.
 *  For each error, if none of the fields apply, then the error
 *  is assigned to the field named first in this array.
 * @return Object
 */
Q.ajaxErrors = function _Q_ajaxErrors(errors, fields) {
	var result = {};
	var f, e;
	if (fields && typeof fields === 'string') {
		fields = [fields];
	}
	for (i=0; i<errors.length; ++i) {
		e = false;
		if ((f = errors[i].fields)) {
			for (j=0; j<f.length; ++j) {
				if (fields && fields.indexOf(f[j]) < 0) {
					continue;
				}
				result[f[j]] = errors[i].message;
				e = true;
			}
		}
		if (!e && fields) {
			result[fields[0]] = errors[i].message;
		}
	}
	return result;
};


/**
 * A way to get JSON that is cross-domain.
 * It uses script tags and JSONP callbacks.
 * But may also use XHR if we have CORS enabled.
 * Now this function is just an alias for Q.request
 * @param Object fields
 *  Optional object of fields to pass
 * @param String url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param String|Object slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object, converts it to a comma-separated list
 * @param Function callback
 *  The JSON will be passed to this callback function
 * @param Object options
 *  A hash of options, to be passed to Q.request
 */
Q.jsonRequest = Q.request;

Q.parseUrl = function _Q_parseUrl (str, component) {
	// http://kevin.vanzonneveld.net
	// modified by N.I for 'php' parse mode
	var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
		parser = /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var m = parser.exec(str), uri = {}, i = 14;
	while (i--) {
		if (m[i]) uri[key[i]] = m[i];
	}
	if (component) return uri[component.replace('PHP_URL_', '').toLowerCase()];
	delete uri.source;
	return uri;
};

Q.sameDomain = function _Q_sameDomain (url1, url2, options) {
    var parsed1 = Q.parseUrl(url1),
        parsed2 = Q.parseUrl(url2);
    var same = (parsed1.host === parsed2.host)
        && (parsed1.user === parsed2.user)
        && (parsed1.pass === parsed2.pass)
        && (parsed1.port === parsed2.port);
    return options && options.compareScheme
        ? same && (parsed1.scheme === parsed2.scheme)
        : same;
};

/**
 * Serialize an object of fields into a shallow object of key/value pairs
 * @param fields
 *  The object to serialize
 * @return Object
 *  A shallow object of key/value pairs
 */
Q.serializeFields = function _Q_serializeFields(fields) {
	if (Q.isEmpty(fields)) {
		return '';
	}
    var parts = [];
	function _params(prefix, obj) {
		if (Q.typeOf(obj) === "array") {
			// Serialize array item.
			Q.each(obj, function _Q_param_each(i, value) {
				if (/\[\]$/.test(prefix)) {
					// Treat each array item as a scalar.
					_add(prefix, value);
				} else {
					_params(prefix + "[" + (Q.typeOf(value) === "object" || Q.typeOf(value) === "array" ? i : "") + "]", value, _add);
				}
			});
		} else if (obj && Q.typeOf(obj) === "object") {
			// Serialize object item.
			for (var name in obj) {
				_params(prefix + "[" + name + "]", obj[name], _add);
			}
		} else {
			// Serialize scalar item.
			_add(prefix, obj);
		}
	}
	function _add(key, value) {
		if (value === undefined) return;
		// If value is a function, invoke it and return its value
		value = Q.typeOf(value) === "function" ? value() : value;
		parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
	};

	Q.each(fields, function _Q_param_each(field) {
		_params(field, fields[field]);
	});

	// Return the resulting serialization
	return parts.join("&").replace(/%20/g, "+");
};

/**
 * Uses a form to do a real POST, but doesn't have a callback
 * Useful for convincing Safari to stop blocking third-party cookies
 * Technically we could use AJAX and CORS instead, and then we could have a callback.
 *
 * @param action {String}
 * @param params {Object}
 * @param method {String}
 * @param options {Object|Boolean}
 *  You can pass true here to just submit the form and load the results in a new page in this window.
 *  Or provide an optional object which can contain the following:
 *  "target": the name of a window or iframe to use as the target.
 *  "iframe": the iframe to use. If not provided, this is filled to point to a newly created iframe object.
 *  "onLoad": callback to call when iframe is loaded. Ignored if "target" is specified.
 *  "form": the form to use. In this case, the action, params and method are ignored.
 */
Q.formPost = function _Q_formPost(action, params, method, options) {
	if (typeof options === 'function') {
		options = {onLoad: options};
	} else if (options === true) {
		options = {straight: true};
	} else {
		options = options || {};
	}
	options = Q.copy(options);
	if (action && typeof action.action === 'string') {
		options.form = action;
	} else {
		method = method || "post"; // Set method to post by default, if not specified.
	}
	var onload;
	if (options.onLoad) {
		onload = (options.onLoad.typename === 'Q.Event') ? options.onLoad.handle : options.onLoad;
	}
	var name = options.target, iframe;
	if (!name) {
		iframe = options.iframe;
		if (iframe) {
			name = iframe.getAttribute('name');
		}
		if (!name) {
			name = 'Q_formPost_iframe_' + (++Q.formPost.counter % 1000);
			// we only need 1000 because we remove iframes after they successfully load
		}
		if (!options.iframe) {
			try {
				iframe = document.createElement('<iframe name="'+name.encodeHTML()+'">');
			} catch (ex) {
				iframe = document.createElement('iframe');
				iframe.width = iframe.height = iframe.marginWidth = iframe.marginHeight = 0;
			}
		}
		iframe.setAttribute("name", name);
		iframe.setAttribute("id", name);
	}
	var form = options.form;
	if (!form) {
		form = document.createElement('form');
		form.setAttribute("method", method);
		form.setAttribute("action", action);
	}

	for(var key in params) {
		if(params.hasOwnProperty(key)) {
			var hiddenField = document.createElement("input");
			hiddenField.setAttribute("type", "hidden");
			hiddenField.setAttribute("name", key);
			hiddenField.setAttribute("value", params[key]);

			form.appendChild(hiddenField);
		 }
	}

	if (iframe && !options.iframe) {
		document.body.appendChild(iframe);
	}
	if (iframe && options.onLoad) {
		Q.addEventListener(iframe, 'load', function _Q_formPost_loaded() {
			Q.handle(onload, this, [iframe]);
			if (!options.iframe && iframe.parentNode) {
				// iframe has loaded everything, and onload callback completed
				// time to remove it from the DOM
				// if someone still needs it, they should have saved a reference to it.
				Q.removeElement(iframe);
			}
		});
	}

	if (!options.form) document.body.appendChild(form);
	if (!options.straight) {
		form.setAttribute("target", name);
	}
	form.submit();
	if (!options.form) {
		Q.removeElement(form);
	}
};
Q.formPost.counter = 0;

/**
 * Adds a reference to a javascript, if it's not already there
 * @param {String|Array} src
 * @param {Function} onload
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  'duplicate': if true, adds script even if one with that src was already loaded
 *  'onError': optional function that may be called in newer browsers if the script fails to load. Its this object is the script tag.
 *  'ignoreLoadingErrors': If true, ignores any errors in loading scripts.
 *  'container': An element to which the stylesheet should be appended (unless it already exists in the document)
 *  'returnAll': If true, returns all the script elements instead of just the new ones
 */
Q.addScript = function _Q_addScript(src, onload, options) {
	
	if (Q.typeOf(src) === 'array') {
		var srcs = [], ret = [];
		Q.each(src, function (i, src) {
			if (!src) return;
			srcs.push((src && src.src) ? src.src : src);
		});
		var p = new Q.Pipe(srcs, onload);
		Q.each(srcs, function (i, src) {
			ret.push(Q.addScript(src, p.fill(src), options));
		});
		return ret;
	}

	var o = Q.extend({}, Q.addScript.options, options),
		ret = [],
		arr = src,
		firstScript = document.scripts[0],
        container = o.container || document.head  || document.getElementsByTagName('head')[0];
		
	if (!onload) {
		onload = function() { };
	}
	
	var script, i;
	_onload.loaded = {};
	var src = (src && src.src) ? src.src : src;
	if (!src) {
		return null;
	}
	src = Q.url(src);
	
	if (!o || !o.duplicate) {
		var scripts = document.getElementsByTagName('script');
		for (i=0; i<scripts.length; ++i) {
			var script = scripts[i];
			if (script.getAttribute('src') !== src) {
				continue;
			}
            // move the element to the right container if necessary
            // hopefully, moving the script element won't change the order of execution
            var p = scripts[i], outside = true;
            while (p = p.parentNode) {
                if (p === container) {
                    outside = false;
                    break;
                }
            }
            if (outside) {
                container.appendChild(scripts[i]);
            }
			// the script already exists in the document
			if (Q.addScript.loaded[src]) {
				// the script was already loaded successfully
				_onload();
				return o.returnAll ? script : false;
			}
			if (Q.addScript.loaded[src] === false) {
				// the script had an error when loading
				if (o.ignoreLoadingErrors) {
					_onload();
				} else if (o.onError) {
					o.onError.call(scripts[i]);
				}
				return o.returnAll ? script : false;
			}
			if (!Q.addScript.added[src]
			&& (!('readyState' in script) || (script.readyState !== 'complete' || script.readyState !== 'loaded'))) {
				// the script was added by someone else (and hopefully loaded)
				// we can't always know whether to call the error handler
				// if we got here, we might as well call onload
				_onload();
				return o.returnAll ? script : false;
			}
			// this is our script, the script hasn't yet loaded, so register onload2 and onerror2 callbacks
			if (!Q.addScript.onLoadCallbacks[src]) {
				Q.addScript.onLoadCallbacks[src] = [];
			}
			if (!Q.addScript.onErrorCallbacks[src]) {
				Q.addScript.onErrorCallbacks[src] = [];
			}
			Q.addScript.onLoadCallbacks[src].push(onload);
			if (o.onError) {
				Q.addScript.onErrorCallbacks[src].push(o.onError);
			}
			if (!scripts[i].wasProcessedByQ) {
				scripts[i].onload = onload2;
				scripts[i].onreadystatechange = onload2; // for IE
				Q.addEventListener(script, 'error', onerror2);
				scripts[i].wasProcessedByQ = true;
			}
			return o.returnAll ? script : false; // don't add this script to the DOM
		}
	}

	// Create the script tag and insert it into the document
	var script = document.createElement('script');
	script.setAttribute('type', 'text/javascript');
	Q.addScript.added[src] = true;
	Q.addScript.onLoadCallbacks[src] = [_onload];
	Q.addScript.onErrorCallbacks[src] = [];
	if (o.onError) {
		Q.addScript.onErrorCallbacks[src].push(o.onError);
	}
	script.onload = onload2;
	script.wasProcessedByQ = true;
	Q.addEventListener(script, 'error', onerror2);
	
	if ('async' in firstScript) { // modern browsers
		script.setAttribute('src', src);
		script.async = false;
		container.appendChild(script);
	} else if (firstScript.readyState) { // IE<10
		// create a script and add it to our todo pile
		if (!Q.addScript.pendingScripts) {
			Q.addScript.pendingScripts = [];
		}
		Q.addScript.pendingScripts.push(script);
		script.onreadystatechange = stateChangeInIE; // listen for state changes
		script.setAttribute('src', src); // setting src after onreadystatechange listener is necessary for cached scripts
	} else { // fall back to defer
		script.setAttribute('defer', 'defer');
		script.setAttribute('src', src);
		container.appendChild(script);
	}
	return script;
	
	function stateChangeInIE(e) { // function to watch scripts load in IE
		// Execute as many scripts in order as we can
		var script, pendingScripts = Q.addScript.pendingScripts;
		while (pendingScripts[0]
		&& (pendingScripts[0].readyState == 'loaded' || pendingScripts[0].readyState == 'complete')) {
			script = pendingScripts.shift();
			script.onreadystatechange = null; // avoid future loading events from this script (eg, if src changes)
			container.appendChild(script);
			onload2(null, script, script.getAttribute('src'));
		}
	}
	
	function onload2(e, s, u) {
		var cb;
		if (('readyState' in this) && (this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;	
		}
		if (s) {
		    script = s;
		    src = u;
		} else if (onload2.executed) {
            return;
    	}
		Q.addScript.loaded[src] = true;
		while ((cb = Q.addScript.onLoadCallbacks[src].shift())) {
			Q.nonce = Q.nonce || Q.cookie('Q_nonce');
			cb.call(this);
		}
		script.onload = script.onreadystatechange = null; // Handle memory leak in IE
		onload2.executed = true;
	}

	function onerror2(e) {
		if (o.ignoreLoadingErrors) {
			return onload2(e);
		}
		if (onerror2.executed) {
			return;
		}
		Q.addScript.loaded[src] = false;
		if (Q.addScript.onErrorCallbacks[src]) {
			while ((cb = Q.addScript.onErrorCallbacks[src].shift())) {
				cb.call(this);
			}
		}
		onerror2.executed = true;
	}

	function _onload() {
		Q.addScript.loaded[src] = true;
		if (window.jQuery && !Q.onJQuery.occurred) {
			Q.onJQuery.handle(window.jQuery, [window.jQuery]);
		}
		Q.jQueryPluginPlugin();
		onload();
	}
};

Q.addScript.onLoadCallbacks = {};
Q.addScript.onErrorCallbacks = {};
Q.addScript.added = {};
Q.addScript.loaded = {};

Q.addScript.options = {
	duplicate: false,
	ignoreLoadingErrors: false
};

Q.findScript = function (src) {
	var scripts = document.getElementsByTagName('script');
	src = Q.url(src);
	for (var i=0; i<scripts.length; ++i) {
		if (scripts[i].getAttribute('src') === src) {
			return scripts[i];
		}
	}
	return null;
};

/**
 * Adds a reference to a stylesheet, if it's not already there
 * @param {String} href
 * @param {String} media
 * @param {Function} onload
 * @param {Object} options
 *  An optional hash of options, which can include:
 *  "container": An element to which the stylesheet should be appended (unless it already exists in the document)
 *  'returnAll': If true, returns all the link elements instead of just the new ones
 */
Q.addStylesheet = function _Q_addStylesheet(href, media, onload, options) {
	var i;
	options = options || {};
	if (typeof(media) === 'function') {
		onload = media; media = undefined;
	}
	if (!onload) {
		onload = function _onload() { };
	}
	if (Q.typeOf(href) === 'array') {
		var ret = [];
		var len = href.length;
		for (var i=0; i<len; ++i) {
			ret.push(Q.addStylesheet(href[i].href, href[i].media));
		}
		return ret;
	}
	var container = options.container || document.getElementsByTagName('head')[0];

	if (!href) {
		onload(false);
		return false;
	}
	href = Q.url(href);
	if (!media) media = 'screen, print';
	var links = document.getElementsByTagName('link');
	for (i=0; i<links.length; ++i) {
		if (links[i].getAttribute('href') !== href) continue;
        // move the element to the right container if necessary
        // hopefully, moving the link element won't change the order of applying the styles
	    var p = links[i], outside = true;
        while (p = p.parentNode) {
            if (p === container) {
                outside = false;
                break;
            }
        }
        if (outside) {
            container.appendChild(links[i]);
        }
		if (Q.addStylesheet.loaded[href] || !Q.addStylesheet.added[href]) {
			onload();
			return options.returnAll ? links[i] : false;
		}
		if (Q.addStylesheet.onLoadCallbacks[href]) {
			Q.addStylesheet.onLoadCallbacks[href].push(onload);
		} else {
			Q.addStylesheet.onLoadCallbacks[href] = [onload];
		}
		var links = document.getElementsByTagName('link');
		for (var j=0; j<links.length; ++j) {
			if (links[j].href !== href) continue;
			links[j].onload = onload2;
			links[j].onreadystatechange = onload2; // for IE6
			break;
		}
		return options.returnAll ? links[i] : false; // don't add
	}

	function onload2(e) {
		if (onload2.executed) {
			return;
		}
		if (('readyState' in this) &&
		(this.readyState !== 'complete' && this.readyState !== 'loaded')) {
			return;
		}
		Q.addStylesheet.loaded[href] = true;
		var cb;
		while ((cb = Q.addStylesheet.onLoadCallbacks[href].shift())) {
			cb.call(this);
		}
		onload2.executed = true;
	}

	// Create the stylesheet's tag and insert it into the document
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('type', 'text/css');
	link.setAttribute('media', media);
	Q.addStylesheet.added[href] = true;
	Q.addStylesheet.onLoadCallbacks[href] = [onload];
	link.onload = onload2;
	link.onreadystatechange = onload2; // for IE
	link.setAttribute('href', href);
	container.appendChild(link);
	return link;
};


Q.addStylesheet.onLoadCallbacks = {};
Q.addStylesheet.added = {};
Q.addStylesheet.loaded = {};

Q.findStylesheet = function (href) {
	var links = document.getElementsByTagName('link');
	href = Q.url(href);
	for (var i=0; i<links.length; ++i) {
		if (links[i].getAttribute('rel').toLowerCase() !== 'stylesheet') {
			continue;
		}
		if (links[i].getAttribute('href') === href) {
			return links[i];
		}
	}
	return null;
};

/**
 * Gets, sets or a deletes a cookie
 * @param name
 *   The name of the cookie
 * @param value
 *   Optional. If passed, this is the new value of the cookie.
 *   If null is passed here, the cookie is "deleted".
 * @param options
 *   Optional hash of options, including:
 *   "expires": number of milliseconds until expiration. Defaults to session cookie.
 *   "domain": the domain to set cookie
 *   "path": path to set cookie. Defaults to location.pathname
 * @return String
 *   If only name was passed, returns the stored value of the cookie, or null.
 */
Q.cookie = function _Q_cookie(name, value, options) {
	var parts;
	if (typeof value != 'undefined') {
		var path, domain = '';
		parts = Q.info.baseUrl.split('://');
		if (options && ('path' in options)) {
			path = ';path='+options.path;
		} else {
			path = ';path=/' + parts[1].split('/').slice(1).join('/');
		}
		if (options && ('domain' in options)) {
			domain = ';domain='+options.domain;
		} else {
			domain = ';domain=.' + parts[1].split('/').slice(0, 1);
		}
		if (value === null) {
			document.cookie = encodeURIComponent(name)+'=;expires=Thu, 01-Jan-1970 00:00:01 GMT'+path+domain;
			return null;
		}
		var expires = '';
		if (options && options.expires) {
			expires = new Date();
			expires.setTime((new Date()).getTime() + options.expires);
			expires = ';expires='+expires.toGMTString();
		}
		document.cookie = encodeURIComponent(name)+'='+encodeURIComponent(value)+expires+path+domain;
		return null;
	}

	// Otherwise, return the value
	var cookies = document.cookie.split(';'), result;
	for (var i=0; i<cookies.length; ++i) {
		parts = cookies[i].split('=');
		result = parts.splice(0, 1);
		result.push(parts.join('='));
		if (decodeURIComponent(result[0].trim()) === name) {
			return result.length < 2 ? null : decodeURIComponent(result[1]);
		}
	}
	return null;
};

/**
 * Finds all elements that contain a class matching the filter,
 * and calls the callback for each of them.
 *
 * @param HTMLElement|Array elem
 *  An element, or an array of elements, within which to search
 * @param String|RegExp|true filter
 *  The name of the class or attribute to match
 * @param Function callbackBefore
 *  A function to run when a match is found (before the children).
 *  If it returns 0, the Q.find function doesn't search further inside that element.
 *  If it returns false, the Q.find function stops searching.
 * @param Function callbackAfter
 *  A function to run when a match is found (after the children)
 *  If it returns false, the Q.find function stops searching.
 * @param options
 *  Any options to pass to the callbacks as the second argument
 * @param shared
 *  An optional object that will be passed to each callbackBefore and callbackAfter
 */
Q.find = function _Q_find(elem, filter, callbackBefore, callbackAfter, options, shared, parent, i) {
	var i;
	if (!elem) {
		return;
	}
	if (filter === true) {
		filter = 'q_tool';
	}
	// Arrays are accepted
	if (Q.typeOf(elem) === 'array' ||
		(typeof(HTMLCollection) !== 'undefined' && (elem instanceof HTMLCollection)) ||
		(window.jQuery && (elem instanceof jQuery))) {

		for (i=0; i<elem.length; ++i) {
			if (false === Q.find(elem[i], filter, callbackBefore, callbackAfter, options, shared, parent, i)) {
				return false;
			}
		}
		return;
	}
	// Do a depth-first search and call the constructors
	var found = (filter === null);
	if (!found && ('className' in elem) && typeof elem.className === "string" && elem.className) {
		var classNames = elem.className.split(' ');
		for (i=classNames.length-1; i>=0; --i) {
			var className = Q.normalize(classNames[i]);
			if (((typeof(filter) === 'string') && (filter === className))
			|| ((filter instanceof RegExp) && filter.test(className))
			|| ((typeof(filter) === 'function' && filter(className)))) {
				found = true;
				break;
			}
		}
	}
	if (!found && elem.attributes) {
		for (i=elem.attributes.length-1; i>=0; --i) {
			var attribute = elem.attributes[i].name;
			if (((typeof(filter) === 'string') && (filter === attribute))
			|| ((filter instanceof RegExp) && filter.test(attribute))
			|| ((typeof(filter) === 'function' && filter(attribute)))) {
				found = true;
				break;
			}
		}
	}
	if (found && typeof(callbackBefore) == 'function') {
		var ret = callbackBefore(elem, options, shared, parent, i);
		if (ret === 0) {
			return;
		}
		if (ret === false) {
			return false;
		}
	}
	var children;
	if ('children' in elem) {
		children = elem.children;
	} else {
		children = elem.childNodes; // more tedious search
	}
	var c = [];
	if (children) {
		for (i=0; i<children.length; ++i) {
			c[i] = children[i];
		}
	}
	var ret = Q.find(c, filter, callbackBefore, callbackAfter, options, shared, elem);
	if (ret === false) {
		return false;
	}
	if (found && typeof(callbackAfter) == 'function') {
		if (false ===  callbackAfter(elem, options, shared, parent, i)) {
			return false;
		}
	}
};
Q.find.skipSubtree = "Q:skipSubtree";

/**
 * Unleash this on an element to activate all the tools within it.
 * If the element is itself an outer div of a tool, that tool is activated too.
 * @param {HTMLElement|Q.Tool}
 *  HTML element or existing tool to traverse and activate
 * @param {Object} options
 *  Optional options to provide to tools and their children.
 * @param {Function} callback
 *  Optional callback to call after the activation was complete
 */
Q.activate = function _Q_activate(elem, options, callback) {
	
	var ba, tool;
	if (Q.typeOf(elem) === 'Q.Tool') {
		tool = elem;
		ba = Q.Tool.beingActivated;
		Q.Tool.beingActivated = tool;
		elem = tool.element;
	}
	
	Q.beforeActivate.handle.call(window, elem); // things to do before things are activated
	
	var shared = {
		waitingForTools: [],
		pipe: Q.pipe()
	};
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	Q.find(elem, true, Q.activate.onConstruct.handle, Q.activate.onInit.handle, options, shared);
	shared.pipe.add(shared.waitingForTools, _activated).run();
	
	Q.Tool.beingActivated = ba;
	
	function _activated() {
		Q.trigger('onLayout', elem, []);
		if (callback) callback(elem, options);
		Q.onActivate.handle(elem, options);
	}
};

/**
 * Replaces a particular HTMLElement and does the right thing with all the tools in it
 * @param {HTMLElement} existing
 *  A HTMLElement representing the slot whose contents are to be replaced
 * @param {HTMLElement|String} source
 *  An HTML string or a HTMLElement which is not part of the DOM
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  "animation": To animate the transition, pass an object here with optional "duration", "ease" and "callback" properties.
 * @return HTMLElement
 *  Returns the slot element if successful
 */
Q.replace = function _Q_replace(existing, source, options) {
	if (!source) {
		Q.Tool.remove(existing); // Remove all the tools remaining in the container, with their events etc.
		existing.innerHTML = '';
		return existing;
	}
	var options = Q.extend({}, Q.replace.options, options);
	if (Q.typeOf(source) === 'string') {
		var s = document.createElement('div'); // temporary container
		s.innerHTML = source;
		source = s;
	}
	
	Q.find(source, true, function (toolElement, options, shared) {
		var tool = Q.Tool.byId(toolElement.id);
		if (tool && tool.element.getAttribute('data-Q-cache')
		&& !toolElement.getAttribute('data-Q-replace')) {
			// If a tool exists with this exact id and has "data-Q-cache",
			// then re-use it and all its HTML elements, unless
			// the new tool HTML has data-Q-replace.
			// This way tools can avoid doing expensive operations each time
			// they are replaced and reactivated.
			var attrName = 'data-' + Q.normalize(tool.name, '-'),
				newOptions = toolElement.getAttribute(attrName);
			toolElement.parentNode.replaceChild(tool.element, toolElement);
			toolElement.setAttribute(attrName, newOptions);
			
			// The tool's constructor will be called again with the new options.
			// However, from the tool we decided to cache, we still have
			// all the DOM elements, attached jQuery data and events,
			// as well as the Q.Tool object with its properties, such as options or state.
			Q.handle(tool.onUseCached);
		}
	});
	
	Q.Tool.remove(existing); // Remove all the tools remaining in the container, with their events etc.
	existing.innerHTML = ''; // Clear the container
	
	// Move the actual nodes from the source to existing container
	var c;
	while (c = source.childNodes[0]) {
		existing.appendChild(c);
	}
	
	return existing;
}


/**
 * @param url String
 * @param slotNames Array|String Optional, defaults to all application slots
 * @param callback Function Callback which is called when response returned and scripts,
 * stylesheets and inline styles added, but before inline scripts executed.
 * Receives response as its first agrument. May return DOM element or array of them which need to be Q.activate'ed.
 * By default place slot content to DOM element with id "{slotName}_slot"
 * @param options Object Optional.
 * An hash of options to pass to the loader, that can also include:
 *   "loader": the actual function to load the URL, defaults to Q.request. See Q.request documentation for more options.
 *   "handler": the function to handle the returned data. Defaults to a function that fills the corresponding slot containers correctly.
 *   "ignoreHistory": if true, does not push the url onto the history stack
 *   "loadExtras": if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 *   "onError": custom error function, defaults to alert
 *   "onActivate": callback which is called when all Q.activate's processed and all script lines executed
 *   "timeout": timeout to wait for response defaults to 1.5 sec. Set to false to disable
 *   "onTimeout": handler to call when timeout is reached. Receives function as argument -
 *		the function might be called to cancel loading.
 *   "onLoad": handler to call when data is loaded but before it is processed -
 *		when called the argument of "onTimeout" does nothing
 *   "ignoreLoadingErrors": If true, ignores any errors in loading scripts.
 *   "quiet": defaults to false. If true, allows visual indications that the request is going to take place.
 *   "slotNames": an array of slot names to request and process (default is all slots in Q.info.slotNames)
 *   "cacheSlots": an object of {slotName: whetherToCache} pairs
 * See Q.request for more info.
 * Also it is passed to loader function so any additional options can be passed
 */
Q.loadUrl = function _Q_loadUrl(url, options)
{
	var o = Q.extend({}, Q.loadUrl.options, options);
	Q.handle(o.onLoadStart, this, [o]);

	var handler = o.handler || Q.loadUrl.defaultHandler;
	var slotNames = o.slotNames || Q.info.slotNames;
	if (typeof(slotNames) === 'string') {
		slotNames = slotNames.split(',');
	}
	if (o.cacheSlots) {
		var arr = [], i, l = slotNames.length;
		for (i=0; i<l; ++i) {
			var slotName = slotNames[i];
			if (!o.cacheSlots[slotName]
			|| !Q.loadUrl.cachedSlots[slotName]) {
				arr.push(slotName);
			}
		}
		slotNames = arr;
	}

	var parts = url.split('#');
	var hashUrl = parts[1] ? parts[1].queryField('url') : undefined;
	url = (hashUrl !== undefined) ? hashUrl : parts[0];

	var loader = Q.request,
		onError = window.alert,
		onActivate;
	if (o.loader) {
		loader = o.loader;
	}
	if (o.onError) {
		onError = o.onError;
	}
	if (o.onActivate) {
		onActivate = o.onActivate;
	}
	loader(url, slotNames, loadResponse, o);

	function loadResponse(err, response) {
		if (!response) {
			onError("Response is empty", response);
			return;
		}   
		if (response.errors) {
			onError(response.errors[0].message);
			return;
		}
		
		loadTemplates();
		var newScripts = loadScripts(afterScripts);
		
		function afterScripts () {
			
			// WARNING: This function may not be called if one of the scripts is missing or returns an error
			// So the existing page will not be unloaded and the new page will not be loaded, in this case,
			// but some of the new scripts will be added.

			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // old page going out
			var i;
			
			function _doEvents(prefix, moduleSlashAction) {
				var event, f = Q[prefix+'PageUnload'];
				Q.handle(o.onLoadEnd, this, [o]);
				if (Q.info && Q.info.uri) {
					event = f("Q\t"+moduleSlashAction);
					event.handle();
					event.removeAllHandlers();
					event = f(moduleSlashAction);
					event.handle();
					if (Q.info.uriString !== moduleSlashAction) {
						event = f("Q\t"+Q.info.uriString);
						event.handle();
						event.removeAllHandlers();
						event = f(Q.info.uriString);
						event.handle();
					}
				}
				event = f("Q\t");
				event.handle();
				event.removeAllHandlers();
				event = f('');
				event.handle();
			}

			function _activatedSlot() {
				if (_activatedSlot.remaining !== undefined && --_activatedSlot.remaining > 0) {
					return;
				}
				Q.each([newStylesheets, newStyles, newScripts], function (i, collection) {
					Q.each(collection, function (slotName, arr) {
						if (!slotName) return;
						Q.each(arr, function (i, element) {
							if (!element) return;
							// domElements[slotName].appendChild(element);
							element.setAttribute('data-slot', slotName);
							
							// save some info before prefixfree mangles stuff
							if (element.tagName.toUpperCase() === 'LINK') {
								processStylesheets.slots[element.getAttribute('href')] = slotName;
							}
						});
					});
				});
				try {
					Q.Page.beingActivated = true;
					Q.onPageActivate('').handle();
					if (Q.info && Q.info.uri) {
						var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
						Q.onPageActivate(moduleSlashAction).handle();
						if (Q.info.uriString !== moduleSlashAction) {
							Q.onPageActivate(Q.info.uriString).handle();
						}
					}
					Q.Page.beingActivated = false;
				} catch (e) {
					Q.Page.beingActivated = false;
					throw e;
				}
				// Invoke prefixfree again if it was loaded
				if (window.StyleFix) {
					StyleFix.process();
				}
				Q.handle(onActivate, this, arguments);
			}
			
			function afterStyles() {
			
				if (Q.info && Q.info.uri) {
					Q.beforePageLoad(moduleSlashAction).occurred = false;
					Q.onPageLoad(moduleSlashAction).occurred = false;
					Q.onPageActivate(moduleSlashAction).occurred = false;
					if (Q.info.uriString !== Q.moduleSlashAction) {
						Q.beforePageLoad(Q.info.uriString).occurred = false;
						Q.onPageLoad(Q.info.uriString).occurred = false;
						Q.onPageActivate(Q.info.uriString).occurred = false;
					}
				}

				if (response.scriptData) {
					Q.each(response.scriptData, function _Q_loadUrl_scriptData_each(slot, data) {
						Q.each(data, function _Q_loadUrl_scriptData_assign(k, v) {
							Q.extendObject(k, v);
						});
					});
				}
				if (response.scriptLines) {
					for (i in response.scriptLines) {
						if (response.scriptLines[i]) {
							eval(response.scriptLines[i]);
						}
					}
				}

				try {
					Q.Page.beingLoaded = true;
					Q.onPageLoad('').handle();
					if (Q.info && Q.info.uri) {
						moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // new page coming in
						Q.onPageLoad(moduleSlashAction).handle();
						if (Q.info.uriString !== moduleSlashAction) {
							Q.onPageLoad(Q.info.uriString).handle();
						}
					}
					Q.Page.beingLoaded = false;
				} catch (e) {
					Q.Page.beingLoaded = false;
					throw e;
				}
			
				if (Q.isEmpty(domElements)) {
					_activatedSlot();
				} else if (Q.isPlainObject(domElements)) { // is a plain object with elements
					_activatedSlot.remaining = Object.keys(domElements).length;
					for (var slotName in domElements) {
						Q.activate(domElements[slotName], undefined, _activatedSlot);
					}
				} else { // it's an element
					Q.activate(domElements, undefined, _activatedSlot);
				}
			}

			_doEvents('before', moduleSlashAction);
			while (Q.Event.forPage && Q.Event.forPage.length) {
				// keep removing the first element of the array until it is empty
				Q.Event.forPage[0].remove(true);
			}
			var p = Q.Event.jQueryForPage;
			for (i=p.length-1; i >= 0; --i) {
				var off = p[i][0];
				window.jQuery.fn[off].call(p[i][1], p[i][2]);
			}

			if (!o.ignoreHistory) {
				if (url.substr(0, Q.info.baseUrl.length) === Q.info.baseUrl) {
					var path = url.substr(Q.info.baseUrl.length+1);
					if (!path)
						path = '';
					if (history.pushState) {
						history.pushState({}, null, url);
						Q_hashChangeHandler.currentUrl = url.substr(Q.info.baseUrl.length + 1);
					} else {
						var hash = '#!url=' + encodeURIComponent(path) +
							location.hash.replace(new RegExp("#!url=[^&]*"), '')
								.replace(new RegExp("&!url=[^&]*"), '')
								.replace(new RegExp("&column=[^&]+"), '')
								.replace(new RegExp("#column=[^&]+"), '');
						if (parts[1]) {
							hash += ('&'+parts[1])
								.replace(new RegExp("&!url=[^&]*"), '')
								.replace(new RegExp("&column=[^&]+"), '');
						}
						if (location.hash !== hash) {
							Q_hashChangeHandler.ignore = true;
							location.hash = hash;
						}
					}
				}
			}
			
			// Remove various tags belonging to the slots that are being reloaded
	        Q.each(['link', 'style', 'script'], function (i, tag) {
				Q.each(document.getElementsByTagName(tag), function (k, e) {
					if (tag === 'link' && e.getAttribute('rel').toLowerCase() != 'stylesheet') {
						return;
					}
					
			        var slot = e.getAttribute('data-slot');
					if (slot && slotNames.indexOf(slot) >= 0) {
						Q.removeElement(e);
					}
					
					// now let's deal with style tags inserted by prefixfree
					if (tag === 'style') {
						var href = e.getAttribute('data-href');
						if (slotNames.indexOf(processStylesheets.slots[href]) >= 0) {
							Q.removeElement(e);
							delete processStylesheets.slots[href];
						}
					}
				});
	        });
			
			Q.Event.jQueryForPage = [];
			var domElements = handler(response); // this is where we fill all the slots
			_doEvents('on', moduleSlashAction);
			
            var newStylesheets = loadStylesheets(),
                newStyles = loadStyles();
			
			afterStyles(); // Synchronous to allow additional scripts to change the styles before allowing the browser reflow.
		}
		
		function loadStylesheets() {
			if (!response.stylesheets) {
				return null;
			}
			var newStylesheets = {};
			for (var slotName in response.stylesheets) {
				var stylesheets = [];
				for (var j in response.stylesheets[slotName]) {
					var stylesheet = response.stylesheets[slotName][j];
					if (window.StyleFix && (stylesheet.href in processStylesheets.slots)) {
						continue; // if prefixfree is loaded, we will not even try to load these processed stylesheets
					}
					var elem = Q.addStylesheet(stylesheet.href, stylesheet.media, null, {returnAll: false});
					if (elem) {
						stylesheets.push(elem);
					}
				}
				newStylesheets[slotName] = stylesheets;
			}
			return newStylesheets;
		}
		
		function loadStyles() {
			if (!response.stylesInline) {
				return null;
			}
			var newStyles = {},
				head = document.head || document.getElementsByTagName('head')[0];
			for (var slotName in response.stylesInline) {
				var styles = response.stylesInline[slotName];
				if (!styles) continue;
				var style = document.createElement('style');
				style.setAttribute('type', 'text/css');
				style.setAttribute('data-slot', slotName);
				if (style.styleSheet){
					style.styleSheet.cssText = styles;
				} else {
					style.appendChild(document.createTextNode(styles));
				}
				head.appendChild(style);
				newStyles[slotName] = [style];
			}
			return newStyles;
		}
		
		function loadTemplates() {
			if (!response.templates) {
				return null;
			}
			var slotName, newTemplates = {};
			for (slotName in response.templates) {
				Q.each(response.templates, function (slotName) {
					newTemplates[slotName] = Q.Template.set(this.name, this.content, this.type);
				});
			}
			return newTemplates;
		}
		
		function loadScripts(callback) {
			if (!response.scripts) {
				callback();
				return null;
			}
			var slotPipe = Q.pipe(Object.keys(response.scripts), function _Q_loadUrl_pipe_slotNames() {
				callback();
			});
			var slotName, newScripts = {};
			for (slotName in response.scripts) {
				var elem = Q.addScript(response.scripts[slotName], slotPipe.fill(slotName), {
					ignoreLoadingErrors: (o.ignoreLoadingErrors !== undefined) ? o.ignoreLoadingErrors : undefined,
					returnAll: false
				});
				if (elem) {
					newScripts[slotName] = elem;
				}
			};
			return newScripts;
		}
	}
};

Q.loadUrl.cachedSlots = {};

Q.loadUrl.defaultHandler = function _Q_loadUrl_fillSlots (res) {
	var elements = {}, slot, name, elem;
	for (name in res.slots) {
		// res.slots will simply not contain the slots that have
		// already been "cached"
		if (name.toUpperCase() === 'TITLE') {
			window.document.title = res.slots[name];
		} else if (elem = document.getElementById(name+"_slot")) {
			try {
				Q.replace(elem, res.slots[name]);
			} catch (e) {
				console.warn('slot ' + name + ' could not be filled');
				console.warn(e);
			}
			elements[name] = elem;
		}
	}
	return elements;
};

/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * @param callables
 *  The callables to call
 *  Can be a function, array of functions, object of functions, Q.Event or URL
 *  If it is a url, simply follow it with options, callback
 * @param callback
 *  You can pass a function here if callables is a URL
 * @param context
 *  The context in which to call them
 * @param args
 *  An array of arguments to pass to them
 * @param options
 *  If callables is a url, these are the options to pass to Q.request, if any. Also can include:
 *  "dontReload": defaults to false. If this is true and callback is a url matching current url, it is not reloaded
 *  "loadUsingAjax": defaults to false. If this is true and callback is a url, it is loaded using Q.loadUrl
 *  "externalLoader": when using loadUsingAjax, you can set this to a function to suppress loading of external websites with Q.handle
 *	Note: this will still not supress loading of external websites done with other means, such as window.location
 *  'fields': optional fields to pass with any method other than "get"
 *  'callback': if a string, adds a '&Q.callback='+encodeURIComponent(callback) to the querystring. If a function, this is the callback.
 *  'loadExtras': if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 *  "target": the name of a window or iframe to use as the target. In this case callables is treated as a url.
 *  "slotNames": a comma-separated list of slot names, or an array of slot names
 *  "quiet": defaults to false. If true, allows visual indications that the request is going to take place.
 * @return Number
 *  The number of handlers executed
 */
Q.handle = function _Q_handle(callables, /* callback, */ context, args, options) {
	if (!callables) {
		return 0;
	}
	var i=0, count=0, k, result;
	if (callables === location) callables = location.href;
	switch (Q.typeOf(callables)) {
		case 'function':
			result = callables.apply(
				context ? context : window,
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
		case 'object':
			for (k in callables) {
				result = Q.handle(callables[k], context, args);
				if (result === false) return false;
				count += result;
			}
			return count;
		case 'string':
			var o = Q.extend({}, Q.handle.options, options);
			if (!o.target && !callables.isUrl()) {
				// Assume this is not a URL.
				// Try to evaluate the expression, and execute the resulting function
				var c = Q.getObject(callables, context) || Q.getObject(callables);
				return Q.handle(c, context, args);
			}
			// Assume callables is a URL
			if (o.dontReload) {
				if (Q.info && Q.info.url === callables) {
					return 0;
				}
			}
			var callback = null;
			if (typeof arguments[1] === 'function') {
				// Some syntactic sugar: (url, callback) omitting context, args, options
				callback = arguments[1];
				o = Q.handle.options;
			} else if (arguments[1] && (arguments[3] === undefined)) {
				// Some more syntactic sugar: (url, options, callback) omitting context, args, options
				o = Q.extend({}, Q.handle.options, arguments[1]);
				if (typeof arguments[2] === 'function') {
					callback = arguments[2];
				}
			} else {
				o = Q.extend({}, Q.handle.options, options);
				if (o.callback) {
					callback = o.callback;
				}
			}
			var handled = false;
            var sameDomain = Q.sameDomain(callables, Q.info.baseUrl);
			if (!o.target && o.loadUsingAjax && sameDomain) {
				if (callables.search(Q.info.baseUrl) === 0) {
					// Use AJAX to refresh the page whenever the request is for a local page
					Q.loadUrl(callables, Q.extend({
						loadExtras: true,
						ignoreHistory: false,
						onActivate: function () {
							if (callback) callback();
						}
					}, o));
					handled = true;
				} else if (o.externalLoader) {
					o.externalLoader.apply(this, arguments);
					handled = true;
				}
			} else {
				if (Q.typeOf(o.fields) === 'object') {
					var method = 'POST';
					if (o.method) {
						switch (o.method.toUpperCase()) {
							case "GET":
							case "POST":
								method = o.method;
								break;
							default:
								method = 'POST'; // sadly HTML forms don't support other methods
								break;
						}
					}
					Q.formPost(callables, o.fields, method, {onLoad: o.callback, target: o.target});
				} else {
					if (Q.info && (callables === Q.info.baseUrl || callables === Q.info.proxyBaseUrl)) {
						callables+= '/';
					}
					if (!o.target || o.target === true || o.target === '_self') {
						if (window.location.href == callables) {
							window.location.reload(true);
						} else {
							window.location = callables;
						}
					} else {
						window.open(callables, o.target);
					}
				}
			}
			Q.handle.onUrl.handle(callables, o);
			return 1;
		default:
			return 0;
	}
};
Q.handle.options = {
	loadUsingAjax: false,
	externalLoader: null,
	dontReload: false
};
Q.handle.onUrl = new Q.Event();

/**
 * Parses a querystring
 * @param queryString {String} The string to parse
 * @param keys {Array} Optional array onto which the keys are pushed
 * @return {Object} an object with the resulting {key: value} pairs
 */
Q.parseQueryString = function Q_parseQueryString(queryString, keys) {
	if (!queryString) return {};
	if (queryString[0] === '?' || queryString[0] === '#') {
		queryString = queryString.substr(1);
	}
	var result = {};
	Q.each(queryString.split('&'), function (i, clause) {
		var parts = clause.split('='),
			key = decodeURIComponent(parts[0]),
			value = decodeURIComponent(parts[1]);
		if (!key) return;
		if (keys) keys.push(key);
		result[key] = value;
	});
	return result;
};

/**
 * Builds a querystring from an object
 * @param from {Object} An object containing {key: value} pairs
 * @param keys {Array} An array of keys in the object, in the order in which the querystring should be built
 * @return {String} the resulting querystring
 */
Q.buildQueryString = function Q_buildQueryString(from, keys) {
	var clauses = [];
	for (var i=0; i<keys.length; ++i) {
		if (!(keys[i] in from)) continue;
		clauses.push(encodeURIComponent(keys[i]) + '=' + encodeURIComponent(from[ keys[i] ]));
	}
	return clauses.join('&');
};

function Q_hashChangeHandler() {
	var url = location.hash.queryField('url'), result = null;
	if (url === undefined) {
		url = window.location.href.split('#')[0].substr(Q.info.baseUrl.length + 1);
	}
	if (Q_hashChangeHandler.ignore) {
		Q_hashChangeHandler.ignore = false;
	} else if (url != Q_hashChangeHandler.currentUrl) {
		Q.handle(url.indexOf(Q.info.baseUrl) == -1 ? Q.info.baseUrl + '/' + url : url);
		result = true;
	}
	Q_hashChangeHandler.currentUrl = url;
	return result;
}

function Q_popStateHandler() {
	var url = window.location.href.split('#')[0], result = null;
	if (Q.info.url === url) {
		return; // we are already at this url
	}
	url = url.substr(Q.info.baseUrl.length + 1);
	if (url != Q_hashChangeHandler.currentUrl) {
		Q.handle(
			url.indexOf(Q.info.baseUrl) === 0 ? url : Q.info.baseUrl + '/' + url,
			{
				ignoreHistory: true,
				quiet: true
			}
		);
		result = true;
	}
	Q_hashChangeHandler.currentUrl = url;
	return result;
}

// private methods

/**
 * Given a tool's generated container div, constructs the
 * corresponding JS tool object. Used internally.
 * This basically calls the tool's constructor, passing it
 * the correct prefix.
 * Note: to communicate with the constructor, you can use
 * attributes and hidden fields.
 * Note: don't forget to add the entry to Q.Tool.constructors
 * when you define your tool's constructor.
 *
 * @param toolElement
 *  A tool's generated container div.
 * @param options
 *  Options that should be passed onto the tool
 * @param shared
 *  A shared pipe which we can use to fill
 */
function _constructTool(toolElement, options, shared) {
	_loadToolScript(toolElement, function _constructTool_doConstruct(toolElement, toolFunc, toolName, uniqueToolId) {
		if (!toolFunc.toolConstructor) {
			toolFunc.toolConstructor = function Q_Tool(element, options) {
				if (this.constructed) {
					return; // support re-entrancy of Q.activate
				}
				this.constructed = false;
				try {
    				this.options = Q.extend({}, toolFunc.options, options);
    				this.name = toolName;
					if (Q.getObject(['Q', 'tools', toolName], element)) {
						return; // support re-entrancy of Q.activate
					}
					Q.setObject(['Q', 'tools', toolName], true, element);
    				var existingTool = Q.Tool.call(this, element, options);
    				this.state = Q.copy(this.options, toolFunc.stateKeys);
					var prevTool = Q.Tool.beingActivated;
					Q.Tool.beingActivated = this;
					toolFunc.call(this, this.options, existingTool);
					Q.Tool.beingActivated = prevTool;
				} catch (e) {
					console.warn(e);
					throw e;
					Q.Tool.beingActivated = prevTool;
				}
				this.constructed = true;
			};
			Q.mixin(toolFunc.toolConstructor, Q.Tool, toolFunc);
		}
		var result = new toolFunc.toolConstructor(toolElement, options);
		if (uniqueToolId) {
			shared.pipe.fill(uniqueToolId)();
		}
		return result;
	}, shared);
}

/**
 * Calls the init method of a tool. Used internally.
 * @param toolElement
 *  A tool's generated container div
 */
function _initTool(toolElement) {
	_loadToolScript(toolElement, function _initTool_doConstruct() {
		var tool = Q.Tool.from(toolElement);
		if (!tool) {
			return;
		}
		// WARNING: the order in which Q_init fires is not guaranteed
		if (tool.Q_init) Q.handle(tool.Q_init, tool);
		if (tool.Q_ready) Q.handle(tool.Q_ready, tool);
	});
}

/**
 * Given a hash of values, returns the hostname and port for connecting to PHP server running Q
 * @param where Object
 *  An object of field: value pairs
 * @return {String} Something of the form "scheme://hostname:port" or "scheme://hostname:port/subpath"
 */
Q.baseUrl = function _Q_host(where) {
    var result, parts;
	for (var i=0; i<Q.baseUrl.routers.length; ++i) {
		if (result = Q.baseUrl.routers[i](where)) {
		    return result;
		}
	}
	return Q.info.baseUrl; // By default, return the base url of the app
};
Q.baseUrl.routers = []; // functions returning a custom url

/**
 * Given an index and field values, returns the hostname and port for connecting to a Node.js server running Q
 * @param where Object
 *  An object of field: value pairs
 * @return {String} "scheme://hostname:port"
 */
Q.nodeUrl = function _Q_node(where) {
	for (var i=0; i<Q.nodeUrl.routers.length; ++i) {
		var result = Q.nodeUrl.routers[i](where);
		if (result) {
		    return result;
		}
	}
	return Q.info.socketUrl;
};
Q.nodeUrl.routers = []; // functions returning a custom url

/**
 * Module for templates functionality
 * @constructor
 */
Q.Template = function () {

};

Q.Template.collection = {};


/**
 * Sets the content of a template in the document's collection.
 * This is usually called by Q.loadUrl when the server sends over some templates,
 * so they won't have to be requested later.
 * @param {String} name The template's name under which it will be found
 * @param {String} content The content of the template that will be processed by the template engine
 * @param {String} type The type of template. Defaults to "mustache"
 */
Q.Template.set = function (name, content, type) {
	type = type || 'mustache';
	if (!Q.Template.collection[type]) {
		Q.Template.collection[type] = {};
	}
	Q.Template.collection[type][Q.normalize(name)] = content;
};

/**
 * Load template from server and store to cache
 * @param name {String} The template name
 * @param callback {Function} Receives two parameters: (err, templateText)
 * @param options {Object?} Options.
 *   "type" - the type and extension of the template, defaults to 'mustache'
 *   "dir" - the subpath of the app url under which to look for the template if it needs to be loaded
 * @return {String|undefined}
 */
Q.Template.load = function _Q_Template_load(name, callback, options) {
	if (typeof callback === "object") {
		options = callback;
		callback = undefined;
	}
	if (options.name) {
		name = options.name;
	}
	if (!name) {
		console.error('Q.Template.load: name is empty');
	}
	// defaults to mustache templates
	var o = Q.extend({}, Q.Template.load.options, options);
	if (!Q.Template.collection[o.type]) {
		Q.Template.collection[o.type] = {};
	}
	var tpl = Q.Template.collection[o.type];

	
	// Now attempt to load the template.
	// First, search the DOM for templates loaded inside script tag with type "text/theType",
	// e.g. "text/mustache" and id matching the template name.
	var i, scripts = document.getElementsByTagName('script'), script, trash = [];
	for (i = 0, l = scripts.length; i < l; i++) {
		script = scripts[i];
		if (script && script.id && script.innerHTML
		&& script.getAttribute('type') === 'text/'+ o.type) {
			tpl[Q.normalize(script.id)] = script.innerHTML.trim();
			trash.unshift(script);
		}
	}
	// For efficiency process all found scripts and remove them from DOM
	for (i = 0, l = trash.length; i < l; i++) {
		Q.removeElement(trash[i]);
	}
	
	// TODO: REMOVE THE ABOVE BLOCK SO IT DOESNT EXECUTE EVERY TIME A TEMPLATE IS RENDERED
	
	// check if template is cached
	var n = Q.normalize(name);
	if (tpl && tpl[n]) {
		var result = tpl[n];
		callback(null, result);
		return true;
	}
	// now try to load template from server
	function _callback(err, content) {
		if (err) {
			return callback(err, null);
		}
		tpl[n] = content.trim();
		callback(null, tpl[n]);
	}
	function _fail () {
		var err = 'Failed to load template "'+o.dir+'/'+name+'.'+o.type+'"';
		console.warn(err);
		callback(err);
	}
	var url = Q.url(o.dir+'/'+name+'.'+ o.type);

	Q.request(url, _callback, {parse: false, extend: false});
	return true;
};

Q.Template.load.options = {
	type: "mustache",
	dir: "views"
};

/**
 * Render template taken from DOM or from file on server with partials
 * @param name {string} The name of template. Either treated as ID of script tag containing the template
 *		or as name of the file on server. File on server is searched in web views dir first and then
 *		if name is namespaced - e.g. Plugin/viewname.type, it is also searched in 'plugins/Plugin/views/Plugin/viewname.type'.
 * @param fields {object?} Rendering params - to be substituted to template
 * @param partials {array?} An array of partials to be used with template
 * @param callback {function} a callback - receives the rendering result or nothing
 * @param options {object?} Options.
 *   "type" - the type and extension of the template, defaults to 'mustache'
 *   "dir" - the folder under project web folder where templates are located
 */
Q.Template.render = function _Q_Template_render(name, fields, partials, callback, options) {
	if (typeof fields === "function") {
		options = partials;
		callback = fields;
		partials = undefined;
		fields = {};
	} else if (typeof partials === "function") {
		options = callback;
		callback = partials;
		partials = undefined;
	}
	if (!callback) {
		throw "Q.Template.render: callback is missing";
	}
	Q.addScript(Q.url('plugins/Q/js/mustache.js'), function () {
		// load the template and partials
		var p = Q.pipe(['template', 'partials'], function (params) {
			if (params.template[0]) {
				return callback(null);
			}
			callback(null, Mustache.render(params.template[1], fields, params.partials[0]));
		});
		Q.Template.load(name, p.fill('template'), options);
		// pipe for partials
		if (partials && partials.length) {
			var pp = Q.pipe(partials, function (params) {
				var i, partial, results = {};
				for (i=0; i<partials.length; i++) {
					partial = partials[i];
					results[partial] = params[partial][0] ? null : params[partial][1];
				}
				p.fill('partials')(results);
			});
			for (var i=0; i<partials.length; i++) {
				Q.Template.load(partials[i], pp.fill(partials[i]), options);
			}
		} else {
			p.fill('partials')();
		}
	});
};

var _sockets = {}, _ioSockets = {}, _eventHandlers = {}, _connectHandlers = {}, _ioCleanup = [];
var _socketRegister = [];

function _ioOn(obj, evt, callback) {
	// don't worry, this function is idempotent
	// so we're not being super careful about calling it only once with the same exact arguments
	obj.on(evt, callback);
 	_ioCleanup.push(function () { 
 	    obj.removeListener(evt, callback);
 	});
}

Q.Socket = function (params) {
    this.namespace = params.namespace;
    this.url = params.url;
    this.ns = params.ns;
};

/**
 * Returns a socket, if it was already connected, or returns undefined
 * @param ns {String} The socket.io namespace
 * @param url {String} The url where socket.io is listening. If it's empty, then returns all matching sockets.
 * @return Q.Socket
 */
Q.Socket.get = function _Q_Socket_get(ns, url) {
    ns = ns || "";
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!url) {
	    return _sockets[ns];
	}
	return _sockets[ns] && _sockets[ns][url];
};

function _connectSocketNS(ns, url, callback, force) {
    // load socket.io script and connect socket
	function _connectNS(ns, url, callback) {
    	// connect to (ns, url)
		if (!window.io) return;
		var socket = _sockets[ns][url];
		if (!socket || !socket.namespace) {
			_sockets[ns][url] = socket = new Q.Socket({
			    namespace: io.connect(url+ns, force ? { 'force new connection': true } : {}),
			    url: url,
			    ns: ns
			});
            function _Q_Socket_register(socket) {
                Q.each(_socketRegister, function (i, item) {
                    if (item[0] !== ns) return;
                    var name = item[1];
        			_ioOn(socket.namespace, name, Q.Socket.onEvent(ns, url, name).handle); // may overwrite again, but it's ok
        			_ioOn(socket.namespace, name, Q.Socket.onEvent(ns, '', name).handle);
                });
            }
            Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
			// remember actual socket - for disconnecting
			if (!_ioSockets[url]) {
				_ioSockets[url] = socket.namespace.socket;
				_ioOn(_ioSockets[url], 'connect', function () {
					setTimeout(function () { // TODO: TAKE AWAY THIS ARTIFICIAL DELAY
						socket.namespace.emit('session', Q.cookie(Q.info.sessionName || 'sessionId'));
        				Q.Socket.onConnect(ns).handle(socket);
                        Q.Socket.onConnect(ns, url).handle(socket);
						console.log('Socket connected to '+url);
					}, 500);
				});
				_ioOn(_ioSockets[url], 'connect_failed', function () {
					console.log('Failed to connect to '+url);
				});
				_ioOn(_ioSockets[url], 'disconnect', function () {
					console.log('Socket disconnected from '+url);
				});
				_ioOn(_ioSockets[url], 'error', function () {
				    console.log('Error on connection '+url);
				});
			}
		}
		callback && callback(_sockets[ns][url]);
		Q.Socket.reconnect();
	}
	
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	
	if (window.io && io.Socket) {
	    _connectNS(ns, url, callback);
	} else {
		Q.addScript(url+'/socket.io/socket.io.js', function () {
			_connectNS(ns, url, callback);
		});
	}
}

/**
 * Connects a socket, and stores it in the list of connected sockets
 * @param ns {String}
 * @param url {String}
 * @param callback {Function}
 */
Q.Socket.connect = function _Q_Socket_prototype_connect(ns, url, callback) {
	if (typeof ns === 'function') {
		callback = ns;
		ns = '';
	} else if (!ns) {
		ns = '';
	} else if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!_sockets[ns]) _sockets[ns] = {};
	if (!_sockets[ns][url]) {
	    _sockets[ns][url] = null; // pending
	}
	_connectSocketNS(ns, url, callback); // check if socket already connected and try to restore it
};

/**
 * Disconnects a socket (not just a namespace) corresponding to a Q.Socket
 */
Q.Socket.prototype.disconnect = function _Q_Socket_prototype_disconnect() {
	if (!this.url) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect socket with empty url");
		return;
	}
	if (!_ioSockets[this.url]) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect nonexistent socket: ", url);
		return;
	}
	_ioSockets[url].disconnect();
};

/**
 * Disconnects all sockets that have been connected
 */
Q.Socket.disconnectAll = function _Q_Socket_disconnectAll() {
	for (var url in _ioSockets) {
		_ioSockets[url].disconnect();
	}
};

/**
 * Reconnect all sockets that have been connected
 */
Q.Socket.reconnect = function _Q_Socket_reconnect() {
	var ns, url;
	for (ns in _sockets) {
		for (url in _sockets[ns]) {
			if (!_sockets[ns][url]) {
			    _connectSocketNS(ns, url);
			} else if (!_sockets[ns][url].namespace.socket.connected) {
			    _sockets[ns][url].namespace.socket.reconnect();
			}
		}
	}
};

/**
 * Completely remove all sockets, de-register events and forget socket.io
 */
Q.Socket.destroyAll = function _Q_Socket_destroyAll() {
	Q.Socket.disconnectAll();
	setTimeout(function () {
		for (var i=0; i<_ioCleanup.length; i++) {
		    _ioCleanup[i]();
		}
		_ioCleanup = [];
		_ioSockets = {};
		_sockets = {};
		window.io = undefined;
	}, 500);
};

Q.Socket.onEvent = Q.Event.factory(
    _eventHandlers, 
    ["", "", "", function (ns, url, name) { 
        if (ns[0] !== '/') {
            return ['/'+ns, url, name];
        }
    }],
    function _Q_Socket_SetupEvent(ns, url, name) {
        // url may be empty, in which case we'll affect multiple sockets
        var event = this;
        event.onFirst().set(function () {
            // The first handler was added to the event
            Q.each(Q.Socket.get(ns, url), function (url, socket) {
                function _Q_Socket_register(socket) {
					// this occurs when socket is connected
                    _ioOn(socket.namespace, name, event.handle);
                }
				if (socket) { // add listeners on sockets which are already constructed
                	Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
				}
            });
			// add pending listeners on sockets that may constructed later
            _socketRegister.push([ns, name]);
        });
        event.onEmpty().set(function () {
            // Every handler was removed from the event
            Q.each(Q.Socket.get(ns, url), function (url, socket) {
				if (socket) { // remove listeners on sockets which are already constructed
                	socket.namespace.removeListener(name, event.handle);
				}
            });
            Q.each(_socketRegister, function (i, item) {
				// remove pending listeners on sockets that may be constructed later
                if (item[0] === ns && item[1] === name) {
                    _socketRegister.splice(i, 1);
                }
            });
        });
    }
);

Q.Socket.onConnect = Q.Event.factory(
    _connectHandlers, 
    ["", "", "", function (ns, url, name) { 
        if (ns[0] !== '/') {
            return ['/'+ns, url, name];
        }
    }]
);

/**
 * Returns Q.Event which occurs on a message post event coming from socket.io
 * Generic callbacks can be assigend by setting messageType to ""
 * @method Q.Socket.prototype.onEvent
 * @param name {String} name of the event to listen for
 * @return {Q.Event}
 */
Q.Socket.prototype.onEvent = function(name) {
	return Q.Socket.onEvent(this.url, this.ns, name);
};

/**
 * Repeatedly calls a function in order to animate something
 * @param callback Function
 *  The function to call. It is passed the following parameters:
 *  x = the fraction of the time that has elapsed
 *  y = the output of the ease function after plugging in x
 *  params = the fourth parameter passed to the run function
 * @param duration Number
 *  The number of milliseconds the animation should run
 * @param ease String|Function
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param params Object
 *  Optional parameters to pass to the callback
 */
Q.Animation = function _Q_Animation(callback, duration, ease, params) {
	if (!duration) {
		duration = 1000;
	}
	if (typeof ease == "string") {
		ease = Q.Animation.ease[ease];
	}
	if (typeof ease !== 'function') {
		ease = Q.Animation.ease.smooth;
	}
	var f = (1000/Q.Animation.fps);
	var max = duration / f;
	var ival;
	var anim = this;
	anim.fraction = 0;
	this.play = function _Q_Animation_instance_play() {
		ival = setInterval(function _Q_Animation_intervalCallback() {
			if (anim.fraction >= max) {
				clearInterval(ival);
				callback(1, ease(1), params);
				return;
			}
			callback(anim.fraction/max, ease(anim.fraction/max), params);
			++anim.fraction;
		}, f);
		return this;
	};
	this.pause = function _Q_Animation_instance_pause() {
		if (ival) {
			clearInterval(ival);
		}
		return this;
	};
	this.rewind = function _Q_Animation_instance_rewind() {
		this.pause();
		this.fraction = 0;
		return this;
	};
};
Q.Animation.play = function _Q_Animation_play(callback, duration, ease, params) {
	var result = new Q.Animation(callback, duration, ease, params);
	return result.play();
};
Q.Animation.fps = 50;
Q.Animation.ease = {
	linear: function(fraction) {
		return fraction;
	},
	bounce: function(fraction) {
		return Math.sin(Math.PI * 1.2 * (fraction - 0.5)) / 1.7 + 0.5;
	},
	smooth: function(fraction) {
		return Math.sin(Math.PI * (fraction - 0.5)) / 2 + 0.5;
	},
	inOutQuintic: function(t) {
		var ts = t * t;
		var tc = ts * t;
		return 6 * tc * ts + -15 * ts * ts + 10 * tc;
	}
};

Q.jQueryPluginPlugin = function _Q_jQueryPluginPlugin() {
	var $ = window.jQuery;
	if (!$ || $.fn.plugin) {
		return;
	}
	/**
	 * Loads a jQuery plugin if it is not there, then calls the callback
	 * @params {String} pluginName
	 * @param {Array|Mixed} options
	 * @param {Function} callback
	 */
	$.fn.plugin = function _jQuery_fn_plugin(pluginName, options, callback) {
		var args;
		switch (Q.typeOf(options)) {
			case 'array': // passing a bunch of parameters to a plugin
				args = options;
				break;
			case 'string': // calling the method of a plugin
				args = Array.prototype.slice.call(arguments, 1);
				break;
			default:
				args = [options]; // assume there is one option and we will pass it as the first parameter
		}
		var name = Q.normalize(pluginName);
		var result = $.fn[name];
		if (typeof result === 'function') {
			result.apply(this, args);
			Q.handle(callback, this, args);
		} else {
			var that = this;
			$.fn.plugin.load(pluginName, function _jQuery_plugin_load_completed() {
				var result = $.fn[name];
				if (!result) {
					throw "jQuery.fn.plugin: "+pluginName+" not defined";
				}
				result.apply(that, args);
				Q.handle(callback, that, args);
			});
		}
		return this;
	};
	/**
	 * The function used by the "plugin" plugin to load other plugins
	 * @param {String|Array} pluginNames
	 * @param {Function} callback
	 * @param {Object} options
	 *  Optional. A hash of options for Q.addScript
	 */
	$.fn.plugin.load = function _jQuery_fn_load(pluginNames, callback, options) {
		var srcs = [];
		if (typeof pluginNames === 'string') {
			pluginNames = [pluginNames];
		}
		var existingOptions = {};
		Q.each(pluginNames, function _jQuery_plugin_loaded(i, pluginName) {
			pluginName = Q.normalize(pluginName);
			existingOptions[pluginName] = _qtjo[pluginName];
			var src = ($.fn.plugin[pluginName] || 'plugins/jQuery/'+pluginName+'.js');
			if (typeof src === 'string') {
				srcs.push(src);
			}
		});
		Q.addScript(srcs, function _jQuery_plugin_script_loaded() {
			for (var pluginName in existingOptions) {
				$.fn[pluginName].options = Q.extend($.fn[pluginName].options, 10, existingOptions[pluginName]);
			}
			Q.handle(callback);
		}, options);
	};
	/**
	 * Used to access the state of a plugin, e.g. $('#foo').state('Q/something').foo
	 */
	$.fn.state = function _jQuery_fn_state(pluginName) {
		var key = Q.normalize(pluginName) + ' state';
		var state = jQuery(this).data(key);
		if (!state) {
			jQuery(this).data(key + ' state', state = {});
		}
		return state;
	};
	/**
	 * Calls Q.activate on all the elements in the jQuery
	 */
	$.fn.activate = function _jQuery_fn_activate(options) {
		jQuery(this).each(function _jQuery_fn_activate_each(index, element) {
			if (!jQuery(element).closest('html').length) {
				throw "jQuery.fn.activate: element to activate must be in the DOM";
			}
			Q.activate(element, options, options && options.callback);
		});
	};
	
	Q.each({
		'on': 'off',
		'live': 'die',
		'bind': 'unbind'
	}, function (on, off) {
		var _jQuery_fn_on = $.fn[on];
		$.fn[on] = function _jQuery_on() {
			for (var f = arguments.length-1; f >= 0; --f) {
				if (typeof arguments[f] === 'function') {
					break;
				}
			} // assume f >= 1
			var namespace = '';
			if (Q.typeOf(arguments[0]) === 'array') {
				namespace = arguments[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				arguments[0] = arguments[0][0];
			}
			if (typeof arguments[0] === 'function') {
				var params = {
					original: arguments[f]
				};
				arguments[f] = arguments[0] ( params );
				if (!('eventName' in params)) {
					throw "Custom $.fn.on handler: need to set params.eventName";
				}
				arguments[0] = params.eventName;
			}
			if (namespace) {
				var parts = arguments[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				arguments[0] = parts.join(' ');
			}
			var added;
			if (arguments[f-1] === true) {
				Q.Event.jQueryForPage.push([off, this, arguments[0]]);
				added = 'page';
			} else if (Q.typeOf(arguments[f-1]) === 'Q.Tool') {
				var tool = arguments[f-1], key = tool.id;
				if (!Q.Event.jQueryForTool[key]) {
					Q.Event.jQueryForTool[key] = [];
				}
				Q.Event.jQueryForTool[key].push([off, this, arguments[0]]);
				added = 'tool';
			}
			if (added) {
				var args = Array.prototype.slice.call(arguments, 0);
				args.splice(f-1, 1);
				return _jQuery_fn_on.apply(this, args);
			} else {
				return _jQuery_fn_on.apply(this, arguments);
			}
		};
		
		var _jQuery_fn_off = $.fn[off];
		$.fn[off] = function () {
			var namespace = '';
			if (Q.typeOf(arguments[0]) === 'array') {
				namespace = arguments[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				arguments[0] = arguments[0][0];
			}
			if (typeof arguments[0] === 'function') {
				var params = {
					original: arguments[f]
				};
				arguments[f] = arguments[0] ( params );
				if (!('eventName' in params)) {
					throw "Custom $.fn.on handler: need to set params.eventName";
				}
				arguments[0] = params.eventName;
			}
			if (namespace) {
				var parts = arguments[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				arguments[0] = parts.join(' ');
			}
			return _jQuery_fn_off.apply(this, arguments);
		}
	});
};
Q.jQueryPluginPlugin();

/**
 * Class (or namespace, more correct) for setting repeatedly called callbacks, which usually set by setInterval().
 * Using this class has several benefits:
 * you may assign memorable key to an interval instead of just integer id and later manage it using this key,
 * you can pause and resume individual interval or all the intervals,
 * you can access intervals collection to inspect it, particularly you may find which are currently running and which are not.
 */
Q.Interval = {

	/**
	 * An object for saving all the intervals. You may inspect it to find all the information about an interval.
	 */
	collection: {},

	/**
	 * Sets an interval.
	 * Syntax is very same to original setInterval()
	 * @param callback Function
	 *   Required. Callback to provide to setInterval() which will be called every milliseconds equal to 'interval' parameter.
	 * @param interval Number
	 *   Required. A number of milliseconds after which next call of function provided by 'callback' parameter will occur.
	 * @param key String
	 *   Optional. A string key for later identifying this interval. May be omitted and then default key with incremented
	 *   number will be generated.
	 * @return Number
	 *   An id of newly created interval which setInterval() returns.
	 */
	set: function(callback, interval, key)
	{
		if (typeof(callback) != 'function')
		{
			throw "Q.Interval.set: 'callback' must be a function";
		}
		if (typeof(interval) != 'number' || interval < 0)
		{
			throw "Q.Interval.set: 'interval' must be a positive number";
		}
		if (key === undefined)
		{
			if (!Q.Interval.increment)
				Q.Interval.increment = 0;
			key = 'interval_' + (Q.Interval.increment - 1);
			Q.Interval.increment++;
		}
		else if (key in Q.Interval.collection)
		{
			return Q.Interval.collection[key].id;
		}
		var id = setInterval(callback, interval);
		Q.Interval.collection[key] = { 'id': id, 'callback': callback, 'interval': interval, 'running': true };
		return id;
	},

	/**
	 * Checks if an interval with given key is already in the collection.
	 * @param key Number
	 *   Required. Key of the interval
	 * @return boolean. True if an interval exists, false otherwise.
	 */
	exists: function(key)
	{
		return (key in Q.Interval.collection);
	},

	/**
	 * Pauses and interval.
	 * @param keyOrId String or Number
	 *   A key or id of the interval to pause. Please note that id changes every time interval is resumed,
	 *   that's why resume() returns new id. And actually using the key is better practice because of that.
	 */
	pause: function(keyOrId)
	{
		var col = Q.Interval.collection;
		if (typeof(keyOrId) == 'string')
		{
			if (keyOrId in col)
			{
				clearInterval(col[keyOrId].id);
				col[keyOrId].running = false;
			}
			else
			{
				throw "Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist";
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId == col[i].id)
				{
					clearInterval(col[i].id);
					col[keyOrId].running = false;
					return;
				}
			}
			throw "Q.Interval.set: Interval with id " + keyOrId + " doesn't exist";
		}
	},

	/**
	 * Resumes the paused interval.
	 * @param keyOrId String or Number
	 *   A key or id of the interval to resume. Please note that id changes every time interval is resumed,
	 *   that's why resume() returns new id. And actually using the key is better practice because of that.
	 *   Also note that it's safe to call resume() on the interval which is not
	 *   paused - resume() simpy doesn't do anything in this case.
	 * @return id Number
	 *   A new id the resumed interval.
	 */
	resume: function(keyOrId)
	{
		var col = Q.Interval.collection, interval;
		if (typeof(keyOrId) == 'string')
		{
			if (keyOrId in col)
			{
				interval = col[keyOrId];
				if (!interval.running)
				{
					interval.id = setInterval(interval.callback, interval.interval);
					interval.running = true;
					return interval.id;
				}
			}
			else
			{
				throw "Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist";
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId == col[i].id)
				{
					interval = col[keyOrId];
					if (!interval.running)
					{
						interval.id = setInterval(interval.callback, interval.interval);
						interval.running = true;
					}
					return interval.id;
				}
			}
			throw "Q.Interval.set: Interval with id " + keyOrId + " doesn't exist";
		}
	},

	/**
	 * Clears the interval.
	 * @param keyOrId String or Number
	 *   A key or id of the interval to clear.
	 */
	clear: function(keyOrId)
	{
		var col = Q.Interval.collection;
		if (typeof(keyOrId) == 'string')
		{
			if (keyOrId in col)
			{
				clearInterval(col[keyOrId].id);
				delete col[keyOrId];
			}
			else
			{
				throw "Q.Interval.set: Interval with key '" + keyOrId + "' doesn't exist";
			}
		}
		else
		{
			for (var i in col)
			{
				if (keyOrId == col[i].id)
				{
					clearInterval(col[i].id);
					delete col[i];
					break;
				}
			}
			throw "Q.Interval.set: Interval with id " + keyOrId + " doesn't exist";
		}
	},

	/**
	 * Pauses all the intervals.
	 */
	pauseAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			clearInterval(col[i].id);
			col[i].running = false;
		}
	},

	/**
	 * Resumes all the intervals.
	 */
	resumeAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			var interval = col[i];
			if (!interval.running)
			{
				interval.id = setInterval(interval.callback, interval.interval);
				interval.running = true;
			}
		}
	},

	/**
	 * Clears all the intervals.
	 */
	clearAll: function()
	{
		var col = Q.Interval.collection;
		for (var i in col)
		{
			clearInterval(col[i].id);
		}
		Q.Interval.collection = {};
	}

};

/**
 * A tool for detecting user browser parameters.
 */
Q.Browser = {

	/**
	 * The only public method, detect() returns a hash consisting of these elements:
	 * "name": Name of the browser, can be 'mozilla' for example.
	 * "mainVersion": Major version of the browser, digit like '9' for example.
	 * "OS": Browser's operating system. For example 'windows'.
	 * "engine": Suggested engine of the browser, can be 'gecko', 'webkit' or some other.
	 */
	detect: function() {
		var data = this.searchData(this.dataBrowser);
		var browser = data.identity || "An unknown browser";
		
		var version = (this.searchVersion(navigator.userAgent) || this.searchVersion(navigator.appVersion)
				|| "an unknown version").toString();
		var dotIndex = version.indexOf('.');
		mainVersion = version.substring(0, dotIndex != -1 ? dotIndex : version.length);
		
		var OSdata = this.searchData(this.dataOS);
		var OS = OSdata.identity || "an unknown OS";
		
		var engine = '', ua = navigator.userAgent.toLowerCase();

		if (ua.indexOf('webkit') != -1)
			engine = 'webkit';
		else if (ua.indexOf('gecko') != -1)
			engine = 'gecko';
		else if (ua.indexOf('presto') != -1)
			engine = 'presto';
		
		var isWebView = (new RegExp("(.*)QWebView(.*)").test(navigator.userAgent))
			|| (new RegExp("(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)", "i").test(navigator.userAgent));
		
		return {
			'name': browser.toLowerCase(),
			'mainVersion': mainVersion,
			'OS': OS.toLowerCase(),
			'engine': engine,
			'device': OSdata.device,
			'isWebView': isWebView
		};
	},
	
	searchData: function(data) {
		for (var i = 0; i < data.length; i++)
		{
			var dataString = data[i].string;
			this.versionSearchString = data[i].versionSearch || data[i].identity;
			if (dataString) {
				if (navigator.userAgent.indexOf(data[i].subString) != -1)
					return data[i];
			}
		}
	},
	
	searchVersion : function(dataString) {
		var index = dataString.indexOf(this.versionSearchString);
		if (index == -1)
			return;
		return parseFloat(dataString.substring(index + this.versionSearchString.length + 1));
	},
	
	dataBrowser : [
		{
			string : navigator.userAgent,
			subString : "Chrome",
			identity : "Chrome"
		},
		{
			string : navigator.userAgent,
			subString : "OmniWeb",
			versionSearch : "OmniWeb/",
			identity : "OmniWeb"
		},
		{
			string : navigator.vendor,
			subString : "Apple",
			identity : "Safari",
			versionSearch : "Version"
		},
		{
			prop : window.opera,
			identity : "Opera",
			versionSearch : "Version"
		},
		{
			string : navigator.vendor,
			subString : "iCab",
			identity : "iCab"
		},
		{
			string : navigator.vendor,
			subString : "KDE",
			identity : "Konqueror"
		},
		{
			string : navigator.userAgent,
			subString : "Firefox",
			identity : "Firefox"
		},
		{
			string : navigator.vendor,
			subString : "Camino",
			identity : "Camino"
		},
		{ // for newer Netscapes (6+)
			string : navigator.userAgent,
			subString : "Netscape",
			identity : "Netscape"
		},
		{
			string : navigator.userAgent,
			subString : "MSIE",
			identity : "Explorer",
			versionSearch : "MSIE"
		},
		{
			string : navigator.userAgent,
			subString : "Gecko",
			identity : "Mozilla",
			versionSearch : "rv"
		},
		{ // for older Netscapes (4-)
			string : navigator.userAgent,
			subString : "Mozilla",
			identity : "Netscape",
			versionSearch : "Mozilla"
		}
	],

	dataOS : [
		{
			string : navigator.userAgent,
			subString : "iPhone",
			identity : "iOS",
			device: "iPhone"
		},
		{
			string : navigator.userAgent,
			subString : "iPod",
			identity : "iOS",
			device: "iPod"
		},
		{
			string : navigator.userAgent,
			subString : "iPad",
			identity : "iOS",
			device: "iPad"
		},
		{
			string : navigator.userAgent,
			subString : "Android",
			identity : "Android"
		},
		{
			string : navigator.platform,
			subString : "Win",
			identity : "Windows"
		},
		{
			string : navigator.platform,
			subString : "Mac",
			identity : "Mac"
		},
		{
			string : navigator.platform,
			subString : "Linux",
			identity : "Linux"
		}
	],
	
	getScrollbarWidth: function() {
		if (Q.Browser.scrollbarWidth) {
			return Q.Browser.scrollbarWidth;
		}
		var inner = document.createElement('p');
		inner.style.width = '100%';
		inner.style.height = '200px';
		
		var outer = document.createElement('div');
		Q.each({
			'position': 'absolute',
			'top': '0px',
			'left': '0px',
			'visibility': 'hidden',
			'width': '200px',
			'height': '150px',
			'overflow': 'hidden'
		}, function (k, v) {
			outer.style[k] = v;
		});
		outer.appendChild(inner);
		document.body.appendChild(outer);

		var w1 = parseInt(inner.offsetWidth);
		outer.style.overflow = 'scroll';
		var w2 = parseInt(inner.offsetWidth);
		if (w1 == w2) {
			w2 = outer.clientWidth;
		}

		Q.removeElement(outer);
		
		Q.Browser.scrollbarWidth = w1 - w2;
	}
	
};

var detected = Q.Browser.detect();
Q.info = {
	isTouchscreen: ('ontouchstart' in window || !!window.navigator.msMaxTouchPoints), // works on ie10
	isTablet: navigator.userAgent.match(new RegExp('tablet|ipad', 'i'))
		|| navigator.userAgent.match(new RegExp('android', 'i'))
		&& !navigator.userAgent.match(new RegExp('mobile', 'i'))
		? true : false,
	platform: detected.OS
};
Q.info.isMobile = Q.info.isTouchscreen && !Q.info.isTablet;
Q.info.formFactor = Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop');
document.documentElement.className += Q.info.isTouchscreen ? ' Q_touchscreen' : ' Q_notTouchscreen';
document.documentElement.className += Q.info.isMobile ? ' Q_mobile' : ' Q_notMobile';

// universal pointer events
Q.Pointer = {
	'start': (Q.info.isTouchscreen ? 'touchstart' : 'mousedown'),
	'move': (Q.info.isTouchscreen ? 'touchmove' : 'mousemove'),
	'end': (Q.info.isTouchscreen ? 'touchend' : 'mouseup'),
	'event': (Q.info.isTouchscreen ? 'touchenter' : 'mouseleave'),
	'leave': (Q.info.isTouchscreen ? 'touchleave' : 'mouseleave'),
	'cancel': (Q.info.isTouchscreen ? 'touchcancel' : 'mousecancel'), // mousecancel can be a custom event
	'click': function _Q_click(params) {
		params.eventName = 'click';
		return function _Q_click_on_wrapper (e) {
			if (Q.Pointer.canceledClick) {
				e.preventDefault ? e.preventDefault() : event.returnValue = false;
				return;
			}
			params.original.apply(this, arguments);
		};
	},
	'fastclick': function _Q_fastclick (params) {
		params.eventName = Q.Pointer.end;
		return function _Q_fastclick_on_wrapper (e) {
			if (Q.Pointer.canceledClick || !this.isOrContains(Q.Pointer.started)) {
				e.preventDefault ? e.preventDefault() : event.returnValue = false;
				return;
			}
			params.original.apply(this, arguments);
		};
	},
	'canceledClick': false,
	'window': true, // (true - clientX/Y, false - pageX/Y)
	'getX': function(e) {
		var oe = e.originalEvent || e;
		e = oe.changedTouches ? oe.changedTouches[0] : (oe.touches ? oe.touches[0] : e);
		return Math.max(0, ('pageX' in e) ? e.pageX : e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft);
	},
	'getY': function(e) {
		var oe = e.originalEvent || e;
		e = oe.changedTouches ? oe.changedTouches[0] : (oe.touches ? oe.touches[0] : e);
		return Math.max(0, ('pageY' in e) ? e.pageY : e.clientY + document.body.scrollTop + document.documentElement.scrollTop);
	},
	'touchCount': function (e) {
		var oe = e.originalEvent || e;
 		return oe.touches ? oe.touches.length : (Q.Pointer.which(e) > 0 ? 1 : 0);
	},
	'which': function (e) {
		var button = e.which || e.button;
		return button || -1; // -1 means non-button interaction
	},
	'target': function (e) {
		var target = e.target || e.srcElement;
	    if (target.nodeType === 3) { // Safari bug
			target = target.parentNode;
		}
		return target;
	},
	'relatedTarget': function (e) {
		e.relatedTarget = e.relatedTarget || (e.type == 'mouseover' ? e.fromElement : e.toElement);	
	},
	cancelClick: function (event, extraInfo) {
		Q.Pointer.onCancelClick.handle(event, extraInfo);
		Q.Pointer.canceledClick = true;	
	},
	onCancelClick: new Q.Event(),
	options: {
		cancelClickDistance: 10
	}
};

function _Q_PointerStartHandler(e) {
	Q.Pointer.started = Q.Pointer.target(e);
	Q.Pointer.canceledClick = false;
	Q.addEventListener(window, Q.Pointer.move, _onPointerMove);
	Q.addEventListener(window, Q.Pointer.end, _onPointerEnd);

	var pos;
	function _onPointerMove(evt) { // see http://stackoverflow.com/a/2553717/467460
		var screenX, screenY;
		if (evt.changedTouches) {
			screenX = evt.changedTouches[0].screenX;
			screenY = evt.changedTouches[0].screenY;
		} else {
			screenX = evt.screenX,
			screenY = evt.screenY;
			if (!screenX || !screenY) {
				return;
			}
		}
		if (!pos) {
			// first movement
			pos = {
				x: screenX,
				y: screenY
			};
		} else if ((pos.x && Math.abs(pos.x - screenX) > Q.Pointer.options.cancelClickDistance)
		|| (pos.y && Math.abs(pos.y - screenY) > Q.Pointer.options.cancelClickDistance)) {
			// finger moved more than the threshhold
			Q.Pointer.cancelClick(evt, {
				fromX: pos.x,
				fromY: pos.y,
				toX: screenX,
				toY: screenY
			});
			Q.removeEventListener(window, Q.Pointer.move, _onPointerMove);
			pos = {};
		}
	}

	function _onPointerEnd() {
		setTimeout(function () {
			Q.Pointer.started = null;
		}, 0);
		Q.removeEventListener(window, Q.Pointer.move, _onPointerMove);
		Q.removeEventListener(window, Q.Pointer.end, _onPointerEnd);
	}
}

/**
 * Operates with dialogs.
 */
Q.Dialogs = {

    options: {
    	topMargin: '10%', // in percentage	
    	bottomMargin: '10%' // or in absolute pixel values
    },
	dialogs: [], // internal dialogs collection
	
	/**
	 * Shows the dialog and pushes it on top of internal dialog stack.
	 * @param options Object
	 *	 A hash of options, that can include:
	 * "dialog": Optional. If provided, may be DOM element or jQuery object containing already prepared dialog html
	 *           structure with 'title_slot', 'dialog_slot' and appropriated content in them. If it's provided, then
	 *           'title' and 'content' options given below are ignored.
	 *	 "url": Optional. If provided, this url will be used to fetch the "title" and "dialog" slots, to display in the dialog.
	 *        Thus the default content provided by 'title' and 'content' options given below will be overridden.
	 *	 "title": Optional. Dialog title, defaults to 'Dialog'.
	 *	 "content": Optional. Dialog content, initially defaults to loading throbber.
	 * "className": Optional. Maybe a CSS class name or space-separated list of classes to append to the dialog element.
	 * "mask": Defaults to false. If true, adds a mask to cover the screen behind the dialog.
	 *	 "fullscreen": Defaults to true only on Android and false on all other platforms. If true, dialog will be shown not as overlay
	 *								 but instead will be prepended to document.body and all other child elements of the body will be hidden.
	 *								 Thus dialog will occupy all window space, but still will behave like regular dialog, i.e. it can be closed
	 *								 by clicking / tapping close icon.
	 *	 "appendTo": Optional. Can be DOM element, jQuery object or jQuery selector matching element where dialog should be appended.
	 *							 Moreover, dialog is centered relatively to this element. By default it's document body.
	 * "alignByParent": Defaults to false. If true, the dialog will be aligned to the center of not the entire window,
	 *                  but to the center of containing element instead.
	 * "noClose": Defaults to false. If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
	 * "closeOnEsc": Defaults to true. Indicates whether to close overlay on 'Esc' key press. Has sense only if 'noClose' is false.
	 * "destroyOnClose": Defaults to false. If true, dialog DOM element will be removed from the document on close.
	 * "beforeLoad": Optional. Q.Event or function which is called before dialog is loaded.
	 * "onActivate": Optional. Q.Event or function which is called when dialog is activated
	 *               (all inner tools, if any, are activated and dialog is fully loaded and shown).
	 * "beforeClose": Optional. Q.Event or function which is called when dialog closing initiated but it's still visible and exists in DOM.
	 * "onClose": Optional. Q.Event or function which is called when dialog is closed and hidden and probably removed from DOM (if 'destroyOnClose' is 'true').
	 * @return Object. jQuery object resresenting DOM element of the dialog that was just pushed.
	 */
	push: function(options) {
		var maskDefault = true;
		for (var i = 0; i < this.dialogs.length; i++) {
			if (!this.dialogs[i].isFullscreen) maskDefault = false;
		}
		var o = Q.extend({mask: maskDefault}, Q.Dialogs.push.options, options);
		if (o.fullscreen) o.mask = false;
		var dialog = $(o.dialog);
		if (dialog.length == 0) {
			// create this dialog element
			dialog = $('<div />').append(
				$('<div class="title_slot" />').append($('<h2 class="Q_dialog_title" />').append(o.title))
			).append(
				$('<div class="dialog_slot Q_dialog_content" />').append(o.content)
			);
			if (o.className) dialog.addClass(o.className);
			if (o.destroyOnClose !== false) o.destroyOnClose = true;
		}
		dialog.hide();
		if (dialog.parent().length == 0) {
			$(o.appendTo).append(dialog);
		}
		var _onClose = o.onClose;
		o.onClose = new Q.Event(function() {
			Q.handle(o.onClose.original, dialog, [dialog]);
			if (!Q.Dialogs.dontPopOnClose)
				Q.Dialogs.pop(true);
			Q.Dialogs.dontPopOnClose = false;
		}, 'Q.Dialogs');
		o.onClose.original = _onClose;
		dialog.plugin('Q/dialog', o);
		topDialog = null;
		dialog.isFullscreen = o.fullscreen;
		if (this.dialogs.length) {
			topDialog = this.dialogs[this.dialogs.length - 1];
		}
		if (!topDialog || topDialog[0] !== dialog[0]) {
			this.dialogs.push(dialog);
			if (o.hidePrevious && topDialog) {
				topDialog.hide();
			}
		}
		return dialog;
	},
	
	/**
	 * Closes dialog and removes it from top of internal dialog stack.
	 * @return Object. jQuery object resresenting DOM element of the dialog that was just popped.
	 */
	pop: function(dontTriggerClose) {
		if (dontTriggerClose === undefined) {
			dontTriggerClose = false;
		}
		
		dialog = this.dialogs.pop();
		if (this.dialogs.length) {
			this.dialogs[this.dialogs.length - 1].show();
		}
		if (!dontTriggerClose && dialog) {
			Q.Dialogs.dontPopOnClose = true;
			if (dialog.data('Q/overlay')) {
				dialog.data('Q/overlay').close();
			} else if (dialog.data('Q/dialog')) {
				dialog.data('Q/dialog').close();
			}
		}
		if (this.dialogs.length == 0) {
			Q.Mask.hide('Q.screenMask');
		}
		return dialog;
	}

};

Q.Dialogs.push.options = {
	'dialog': null,
	'url': null,
	'title': 'Dialog',
	'content': '',
	'className': null,
	'fullscreen': Q.info.platform == 'android' ? true : false,
	'appendTo': document.body,
	'alignByParent': false,
	'beforeLoad': new Q.Event(),
	'onActivate': new Q.Event(),
	'beforeClose': new Q.Event(),
	'onClose': null,
	'closeOnEsc': true,
	'destroyOnClose': false,
	'hidePrevious': true
};

/**
 * @class Q
 * @namespace Q
 * Provides replacement for default javascript alert() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message and button label.
 * @method alert
 * @param {String} message The only required parameter, this specifies text of the alert.
 * @param {Object} [options] An optiopnal hash of options which can include:
 *   "title": Optional parameter to override alert dialog title. Defaults to 'Alert'.
 *   "onClose": Optional
 */
Q.alert = function(message, options) {
	if (options === undefined) options = {};
	if (options.title === undefined) options.title = 'Alert';
	var dialog = Q.Dialogs.push({
		'title': options.title,
		'content': '<div class="Q_messagebox"><p>' + message + '</p></div>',
		'onClose': options.onClose || undefined,
		'fullscreen': false,
		'hidePrevious': false
	});
};

/**
 * Provides replacement for default javascript confirm() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, conrirmation message and buttons.
 * The only major difference from regular confirm is that this implementation doesn't stop JS execution
 * and thus it's impossible to synchronously return true | false when user presses 'Ok' or 'Cancel' and
 * thereby callback is used to pass the user decision result.
 * @method confirm
 * @param {String} message The only required parameter, this specifies confirmation text.
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing true | false depending on whether user clicked (tapped) 'Ok' or 'Cancel' button, respectively
 * @param {Object} [options] An optiopnal hash of options which can include:
 *   "title": Optional string parameter to override confirm dialog title. Defaults to 'Confirm'.
 *   "ok": Optional string parameter to override confirm dialog 'Ok' button label, e.g. 'Yes'. Defaults to 'Ok'.
 *   "cancel": Optional string parameter to override confirm dialog 'Cancel' button label, e.g. 'No'. Defaults to 'Cancel'.
 *   "noClose": Defaults to true. Set to false to show a close button
 */
Q.confirm = function(message, callback, options) {
	var o = Q.extend({
		title: 'Confirm',
		ok: 'OK',
		cancel: 'Cancel',
		noClose: true
	}, options);
	var buttonClicked = false;
	var dialog = Q.Dialogs.push({
		'title': o.title,
		'content': $('<div class="Q_messagebox" />').append(
			$('<p />').html(message),
			$('<button />').html(o.ok),
			$('<button />').html(o.cancel)
		),
		'noClose': o.noClose,
		'onClose': {'Q.confirm': function() {
			if (!buttonClicked) Q.handle(callback, this, [null]);
		}},
		'fullscreen': false,
		'hidePrevious': false
	});
	dialog.find('button:first').on(Q.Pointer.end, function()
	{
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, window, [true]);
	});
	dialog.find('button:last').on(Q.Pointer.end, function()
	{
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, window, [false]);
	});
};

/**
 * @class Q
 * @namespace Q
 * Provides replacement for default javascript prompt() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message, input field placeholder and button label.
 * Unlike a regular JS prompt, the entered value is passed asynchronously using callback.
 * @method prompt
 * @param {String} [message='Enter a value'] Optional, specifies text before input field useful to ask
 *   user to enter something (e.g. 'Enter your name').
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing the entered value as a string, or null if the dialog was dismissed with the close button
 * @param {Object} [options] An optional hash of options which can include:
 *   "title": Optional parameter to override confirm dialog title. Defaults to 'Prompt'.
 *   "placeholder": Optional, used as a placeholder text in the input field. Defaults to 'Enter value'.
 *   "ok": Optional parameter to override confirm dialog 'Ok' button label, e.g. 'Yes'. Defaults to 'Done'.
 *   "noClose": Defaults to true. Set to false to show a close button.
 */
Q.prompt = function(message, callback, options) {
	if (options === undefined) options = {};
	var o = Q.extend({
		title: 'Prompt',
		ok: 'Done',
		message: message,
		placeholder: '',
		noClose: true
	}, options);
	if (!o.message) o.message = 'Enter value:';
	var buttonClicked = false;
	var dialog = Q.Dialogs.push({
		'title': o.title,
		'content': $('<div class="Q_messagebox" />').append(
			$('<p />').html(o.message),
			$('<input type="text" />').attr('placeholder', o.placeholder),
			$('<button class="Q_messagebox_done" />').html(o.ok)
		),
		'onActivate': function(dialog) {
			var field = dialog.find('input');
			var fieldWidth = field.parent().width() - parseInt(field.css('padding-left')) - parseInt(field.css('padding-right'))
			               - field.next().outerWidth(true) - 5;
			field.css({ 'width': fieldWidth + 'px' })
				.plugin('Q/placeholders')
				.plugin('Q/clickfocus').on('keydown', function (event) {
					if (event.keyCode === 13) {
						_done();
					}
				});
		},
		'onClose': {'Q.prompt': function() {
			if (!buttonClicked) Q.handle(callback, this, [null]);
		}},
		'fullscreen': false,
		'hidePrevious': false
	});
	dialog.find('button').on(Q.Pointer.click, _done);
	function _done() {
		buttonClicked = true;
		var value = dialog.find('input').val();
		Q.Dialogs.pop();
		Q.handle(callback, this, [value]);
	}
};

/**
 * Operates a collection of masks, covering screen for some purposes or providing some splash screens.
 * @class Mask
 * @namespace Q
 * @static
 */
Q.Mask = {
	
	/**
	 * Property to store masks in hash indexed by mask key.
	 * @property collection
	 * @type Object
	 * @private
	 */
	collection: {},

	/**
	 * Creates new mask with given key and options.
	 * @method create
	 * @param {String} key A string key to identify mask in subsequent Q.Mask calls.
	 * @param {Object} options A hash of additioal options which may include:
	 *   'className': Optional. String that provide CSS class name for the mask to stylize it properly.
	 *   'fadeTime': Defaults to '0'. Fade-in / fade-out time for mask showing / hiding.
	 *   'sizeMatcher': Optional. If provided, should be DOM element, jQuery object or jQuery selector of the element which will be used
	 *                  to calculated mask width and height, i.e. mask size will match element size. 'window' object is used by default,
	 *                  particularly its 'innerWidth' and 'innerHeight' properties.
	 */
	create: function(key, options)
	{
		if (key in Q.Mask.collection) {
			throw new Error("Mask with key '" + key + "' already exists.");
		}
		if (!options) {
			throw new Error("'options' is required when creating new mask.");
		}
		if (!options.className) {
			throw new Error("'options.className' is required when creating new mask.");
		}
		Q.Mask.collection[key] = Q.extend({
			'fadeTime': 0
		}, options);
		var width = options.sizeMatcher && $(options.sizeMatcher).width() ? $(options.sizeMatcher).width() : window.innerWidth;
		var height = options.sizeMatcher && $(options.sizeMatcher).height() ? $(options.sizeMatcher).height() : window.innerHeight;
		mask = $('<div class="' + options.className + '" />');
		mask.css({ 'width': width + 'px', 'height': height + 'px', 'line-height': height + 'px' });
		if (options.html) {
			mask.html(options.html);
		}
		$(document.body).append(mask);
		Q.Mask.collection[key].element = mask;
		Q.Mask.collection[key].shows = 0;
	},

	/**
	 * Shows the mask by given key. Additional options maybe provided to override default mask options.
	 * Mask shows is counted and in case of multiple show() calls on the same mask, mask will be shown only one time and then
	 * the counter is just incremented. Similar is for hide() calls - mask will be really hidden only if counter is equal zero.
	 * Also note, that there may be predefined options for the mask in Q.Mask.options[key] and in case if mask doesn't exist, it will be created
	 * with these options. Otherwise, the mask at first must be created with explicit create() call and if it's not the case, exception will be thrown.
	 * @method show
	 * @param {String} key A string key to of the mask to show.
	 * @param {Object} [options] A hash of additional options which are same as for create and used to override initial mask options.
	 *                           but only for one show() call (they are restored back after mask is hidden).
	 */
	show: function(key, options)
	{
		if (!(key in Q.Mask.collection))
		{
			if (key in Q.Mask.options)
			{
				Q.Mask.create(key, Q.Mask.options[key]);
			}
			else
			{
				throw new Error("Mask with key '" + key + "' doesn't exist");
			}
		}
		if (options === undefined) options = {};
		var mask = Q.Mask.collection[key];
		if (mask.shows == 0) {
			if (options.className) { // temporary class name which is applied only until mask is hidden
				mask.tmpClassName = options.className;
				mask.element.addClass(mask.tmpClassName);
			}
			if (options.fadeTime) { // temporary fadeTime also to overwrite default
				if (mask.fadeTime) {
					mask.oldFadeTime = mask.fadeTime;
				}
				mask.fadeTime = options.fadeTime;
			}
			if (mask.fadeTime) {
				mask.element.fadeIn(mask.fadeTime);
			} else {
				mask.element.show();
			}
		}
		mask.shows++;
	},
	
	/**
	 * Hides the mask by given key. If mask with given key doesn't exist, fails silently.
	 * @method hide
	 * @param {String} key A key of the mask to hide.
	 */
	hide: function(key)
	{
		if (!(key in Q.Mask.collection)) return;
		
		var mask = Q.Mask.collection[key];
		if (mask.shows > 0) {
			mask.shows--;
		}
		if (mask.shows == 0) {
			if (mask.button) {
				mask.button.remove();
				delete mask.button;
			}
			if (mask.fadeTime) {
				mask.element.fadeOut(mask.fadeTime, function()
				{
					if (mask.oldFadeTime !== undefined)
					{
						mask.fadeTime = mask.oldFadeTime;
						delete mask.oldFadeTime;
					}
					if (mask.tmpClassName !== undefined)
					{
						mask.element.removeClass(mask.tmpClassName);
						delete mask.tmpClassName;
					}
				});
			} else {
				mask.element.hide();
				if (mask.tmpClassName !== undefined)
				{
					mask.element.removeClass(mask.tmpClassName);
					delete mask.tmpClassName;
				}
			}
		}
	},
	
	/**
	 * Returns mask object by given key. This object is an extension of the mask options used during creation
	 * plus some additional fields, most important of which is mask.element - jQuery object representing
	 * mask element in the DOM. If the mask with given key is not found in the collection, get() tries to
	 * create it from predefined options (if there are ones), otherwise it throws an error.
	 * @method get
	 * @param {String} key A key of the mask to get.
	 */
	get: function(key)
	{
		if (key in Q.Mask.collection)
		{
			return Q.Mask.collection[key];
		}
		else if (key in Q.Mask.options)
		{
			Q.Mask.create(key, Q.Mask.options[key]);
			return Q.Mask.collection[key];
		}
		else
		{
			throw new Error("Mask with key '" + key + "' doesn't exist");
		}
	},
	
	/**
	 * Updates all masks. This particularly measn it adjusts mask DOM element size, useful when window size changes.
	 * @method update
	 */
	update: function()
	{
		for (var i in Q.Mask.collection)
		{
			var mask = Q.Mask.collection[i];
			var width = mask.sizeMatcher && $(mask.sizeMatcher).width() ? $(mask.sizeMatcher).width() : window.innerWidth;
			var height = mask.sizeMatcher && $(mask.sizeMatcher).height() ? $(mask.sizeMatcher).height() : window.innerHeight;
			mask.element.css({ 'width': width + 'px', 'height': height + 'px', 'line-height': height + 'px' });
		}
	},
	
	/**
	 * Checks if mask with given key is currently shown. If mask with given key is not found, fails silently.
	 * @method isVisible
	 * @param {String} key A key of the mask to check whether it's visible. 
	 */
	isVisible: function(key)
	{
		if (!(key in Q.Mask.collection)) return false;
		return (Q.Mask.collection[key].shows != 0);
	},
	
	/**
	 * Checks if the mask with given key is already created and exists in the collection.
	 * @method exists
	 * @param {String} key A key of the mask to check whether it exists. 
	 */
	exists: function(key)
	{
		return (key in Q.Mask.collection);
	}
};

Q.Mask.options = {
    'Q.screenMask': { 'className': 'Q_screen_mask' },
    'Q.loadDataMask': { 'className': 'Q_load_data_mask', 'fadeTime': 200 },
    'Q.cancelMask': { 'className': 'Q_cancel_mask', 'fadeTime': 200 }
};

Q.addEventListener(window, Q.Pointer.start, _Q_PointerStartHandler);

if (!window.console) {
	// for browsers like IE8 and below
	function noop() {}
	window.console = {
		debug: noop,
		dir: noop,
		error: noop,
		group: noop,
		groupCollapsed: noop,
		groupEnd: noop,
		info: noop,
		log: noop,
		time: noop,
		timeEnd: noop,
		trace: noop,
		warn: noop
	};
}

/**
 * This function is just here in case prefixfree.js is included
 * because that library removes the <link> elements and puts <style> instead of them.
 * We don't know if prefixfree will be included but we have to save some information
 * about the stylesheets before it arrives on the scene.
 */
function processStylesheets() {
	// Complain about some other libraries if necessary
	if (Q.findScript('plugins/Q/js/prefixfree.min.js')) {
		var warning = "Q.js must be included before prefixfree in order to work properly";
		alert(warning);
		console.warn(warning);
	}
	var links = document.getElementsByTagName('link');
	var slots = processStylesheets.slots;
	for (var i=0; i<links.length; ++i) {
		if (links[i].getAttribute('rel').toLowerCase() !== 'stylesheet') {
			continue;
		}
		var href = links[i].getAttribute('href');
		processStylesheets.slots[href] = links[i].getAttribute('data-slot') || null;
	}
}
processStylesheets.slots = {};
processStylesheets(); // NOTE: the above works only for stylesheets included before Q.js and prefixfree.js

Q.onInit = new Q.Event();
Q.onLoad = new Q.Event();
Q.onUnload = new Q.Event(function _Q_onUnload_callback() {
	// This helps the developer with debugging.
	// It occurs when actual document is being unloaded, as opposed to AJAX-based page loading
	console.log("Leaving page "+window.location.href);
}, 'Q');
var onPageLoad = {}, onPageUnload = {}, 
	beforePageLoad = {}, beforePageUnload = {},
	onPageActivate = {};
Q.onPageLoad = function _Q_onPageLoad(page) {
	if (!onPageLoad[page]) onPageLoad[page] = new Q.Event();
	return onPageLoad[page];
};
Q.onPageActivate = function _Q_onPageActivate(page) {
	if (!onPageActivate[page]) onPageActivate[page] = new Q.Event();
	return onPageActivate[page];
};
Q.onPageUnload = function _Q_onPageUnload(page) {
	if (!onPageUnload[page]) onPageUnload[page] = new Q.Event();
	return onPageUnload[page];
};
Q.beforePageLoad = function _Q_beforePageLoad(page) {
	if (!beforePageLoad[page]) beforePageLoad[page] = new Q.Event();
	return beforePageLoad[page];
};
Q.beforePageUnload = function _Q_beforePageUnload(page) {
	if (!beforePageUnload[page]) beforePageUnload[page] = new Q.Event();
	return beforePageUnload[page];
};
Q.onHashChange = new Q.Event();
Q.onPopState = new Q.Event();
Q.onOnline = new Q.Event(function () {
	m_isOnline = true;
}, 'Q');
Q.onOffline = new Q.Event(function () {
	m_isOnline = false;
}, 'Q');
Q.beforeActivate = new Q.Event();
Q.onActivate = new Q.Event();
Q.onReady = new Q.Event();
Q.onJQuery = new Q.Event();

Q.addEventListener(window, 'load', Q.onLoad.handle);
Q.onInit.add(function () {
	Q_hashChangeHandler.currentUrl = window.location.href.split('#')[0].substr(Q.info.baseUrl.length + 1);
	if (window.history.pushState) {
		Q.onPopState.set(Q_popStateHandler, 'Q.loadUrl');
	} else {
		Q.onHashChange.set(Q_hashChangeHandler, 'Q.loadUrl');
	}
	Q.onOnline.set(Q.Socket.reconnect, 'Q.Socket'); // renew sockets when reverting to online
	
}, 'Q');

Q.onJQuery.add(function ($) {
	
	Q.Tool.define({
		"Q/inplace": "plugins/Q/js/tools/inplace.js",
		"Q/tabs": "plugins/Q/js/tools/tabs.js",
		"Q/form": "plugins/Q/js/tools/form.js",
		"Q/panel": "plugins/Q/js/tools/panel.js",
		"Q/ticker": "plugins/Q/js/tools/ticker.js",
		"Q/timestamp": "plugins/Q/js/tools/timestamp.js",
		"Q/bookmarklet": "plugins/Q/js/tools/bookmarklet.js"
	});
	
	Q.Tool.jQuery({
		"Q/placeholders": "plugins/Q/js/fn/placeholders.js",
		"Q/autogrow": "plugins/Q/js/fn/autogrow.js",
		"Q/columns": "plugins/Q/js/fn/columns.js",
		"Q/dialog": "plugins/Q/js/fn/dialog.js",
		"Q/flip": "plugins/Q/js/fn/flip.js",
		"Q/gallery": "plugins/Q/js/fn/gallery.js",
		"Q/zoomer": "plugins/Q/js/fn/zoo.js",
		"Q/listing": "plugins/Q/js/fn/listing.js",
		"Q/hautoscroll": "plugins/Q/js/fn/hautoscroll.js",
		"Q/imagepicker": "plugins/Q/js/fn/imagepicker.js",
		"Q/actions": "plugins/Q/js/fn/actions.js",
		"Q/clickable": "plugins/Q/js/fn/clickable.js",
		"Q/clickfocus": "plugins/Q/js/fn/clickfocus.js",
		"Q/contextual": "plugins/Q/js/fn/contextual.js",
		"Q/scrollIndicators": "plugins/Q/js/fn/scrollIndicators.js",
		"Q/iScroll": "plugins/Q/js/fn/iScroll.js",
		"Q/scroller": "plugins/Q/js/fn/scroller.js",
		"Q/touchscroll": "plugins/Q/js/fn/touchscroll.js",
		"Q/scrollbarsAutoHide": "plugins/Q/js/fn/scrollbarsAutoHide.js",
		"Q/sortable": "plugins/Q/js/fn/sortable.js"
	});
	
	Q.onLoad.add(function () {
		// Start loading some plugins asynchronously after document loads.
		// We may need them later.
		$.fn.plugin.load([
			'Q/clickfocus', 
			'Q/contextual', 
			'Q/scrollIndicators', 
			'Q/iScroll', 
			'Q/scroller', 
			'Q/touchscroll'
		]);
	});
	
	if ($ && $.tools && $.tools.validator && $.tools.validator.conf) {
		$.tools.validator.conf.formEvent = null; // form validator's handler irresponsibly sets event.target to a jquery!
	}
		
}, 'Q');

Q.loadUrl.options = {
	quiet: false,
	onLoadStart: new Q.Event(),
	onLoadEnd: new Q.Event(),
	onActivate: new Q.Event()
};

Q.request.options = {
	duplicate: true,
	quiet: true,
	handleRedirects: function (url) {
		Q.handle(url, {
			target: '_self'
		});
	},
	onLoadStart: new Q.Event(),
	onShowCancel: new Q.Event(),
	onLoadEnd: new Q.Event(),
	onCancel: new Q.Event(function (error, response) {
		var msg;
		if (msg = Q.firstErrorMessage(error)) {
			console.warn(msg);
			alert(msg);
		}
	}, 'Q')
};

Q.activate.onConstruct = new Q.Event(function () {
	_constructTool.apply(this, arguments);
}, 'Q.Tool');

Q.activate.onInit = new Q.Event(function () {
	_initTool.apply(this, arguments);
}, 'Q.Tool');

if (typeof module !== 'undefined') {
	// Assume we are in a Node.js environment, e.g. running tests
	module.exports = Q;
} else {
	// We are in a browser environment
	window.Q = Q;
}

})();
