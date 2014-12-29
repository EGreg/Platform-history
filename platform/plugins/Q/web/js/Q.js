/**
 * You'll find all your Q related functionality right here.
 *
 * @module Q
 * @main Q
 */
(function (window) {
	
/* jshint -W014 */

// private properties
var _isReady = false;
var _isOnline = null;

/**
 * @class Q
 * @constructor
 */
function Q () {
	// not called right now
}

/**
 * @module Q
 */

// public properties:
Q.plugins = {};

/**
 * Store and customize your text strings under Q.text
 * @property {Object} text
 */
Q.text = {
	Q: {
		"request": {
			"error": "Error {{status}} during request",
			"500": "Internal server error",
			"404": "Not found: {{url}}",
			"0": "Request interrupted"
		}
	}
}; // put all your text strings here e.g. Q.text.Users.foo

Q.Error = Error;

/*
 * Extend some built-in prototypes
 */

/**
 * @class String
 * @description Q extended methods for Objects
 */

/**
 * Returns the prototype of an object, if one can be found
 * @method getPrototypeOf
 * @return {Object}
 */
if (!Object.getPrototypeOf)
Object.getPrototypeOf = function (obj) {
	if (obj.__proto__) return obj.__proto__;
	if (obj.constructor && obj.constructor.prototype) {
		return obj.constructor.prototype;
	}
	return null;
};

/**
 * Returns an array containing the object's keys, in a cross-browser way
 * @method keys
 * @return {Array}
 */
if (!Object.keys)
Object.keys = (function () {
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
			if (hasOwnProperty.call(o, name)) {
				result.push(name);
			}
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

/**
 * @class String
 * @description Q extended methods for Strings
 */

/**
 * Returns a copy of the string with Every Word Capitalized
 * @method toCapitalized
 * @return {String}
 */
var Sp = String.prototype;
Sp.toCapitalized = function _String_prototype_toCapitalized() {
	return this.replace(/^([a-z])|\s+([a-z])/g, function (found) {
		return found.toUpperCase();
	});
};

/**
 * Determins whether the string's contents are a URL
 * @method isUrl
 * @return {Boolean}
 */
Sp.isUrl = function _String_prototype_isUrl () {
	return this.match(/^[A-Za-z]*:\/\//);
};

/**
 * Returns a copy of the string with special HTML characters escaped
 * @method encodeHTML
 * @return {String}
 */
Sp.encodeHTML = function _String_prototype_encodeHTML() {
	return this.replaceAll({
		'&': '&amp;',
		'<': '&lt;',
		'>': '&gt;',
		'"': '&quot;',
		"'": '&apos;',
		"\n": '<br>'
	});
};

/**
 * Reverses what encodeHTML does
 * @method decodeHTML
 * @return {String}
 */
Sp.decodeHTML = function _String_prototype_decodeHTML() {
	return this.replaceAll({
		'&amp;': '&',
		'&lt;': '<',
		'&gt;': '>',
		'&quot;': '"',
		'&apos;': "'",
		"<br>": "\n",
		"<br />": "\n"
	});
};

/**
 * Interpolates some fields into the string wherever "{{fieldName}}" appears
 * @method interpolate
 * @param {Object} fields The field names and values
 * @return {String}
 */
Sp.interpolate = function _String_prototype_interpolate(fields) {
	return this.replace(/\{\{([^{}]*)\}\}/g,
		function (a, b) {
			var r = fields[b];
			return typeof r === 'string' || typeof r === 'number' ? r : a;
		}
	);
};

/**
 * Similar to String.prototype.replace, but replaces globally
 * @method replaceAll
 * @return {String}
 */
Sp.replaceAll = function _String_prototype_replaceAll(pairs) {
	var result = this;
	for (var k in pairs) {
		result = result.replace(new RegExp(k, 'g'), pairs[k]);
	}
	return result;
};

/**
 * Gets a param from a string, which is usually the location.search or location.hash
 * @method queryField
 * @param {String} name The name of the field
 * @param value {String} Optional, provide a value to set in the querystring, or null to delete any fields that match name as a RegExp
 * @return {String} the value of the field in the string, or if value was not undefined, the resulting querystring
 */
Sp.queryField = function Q_queryField(name, value) {
	var what = this;
	var prefixes = ['#!', '#', '?', '!'];
	var count = prefixes.length;
	var prefix = '';
	var i, l, p, keys, parsed;
	for (i=0; i<count; ++i) {
		l = prefixes[i].length;
		p = this.substring(0, l);
		if (p == prefixes[i]) {
			prefix = p;
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
		var reg = new RegExp(name);
		for (var k in parsed) {
			if (reg.test(k)) {
				delete parsed[k];
			}
		}
		return prefix + Q.serializeFields(parsed, keys);
	} else {
		keys = [];
		parsed = Q.parseQueryString(what, keys);
		if (!(name in parsed)) {
			keys.push(name);
		}
		parsed[name] = value;
		return prefix + Q.serializeFields(parsed, keys);
	}
};

/**
 * Obtain some unique hash from a string, analogous to Q_Utils::hashCode
 * @method hashCode
 * @return {number}
 */
Sp.hashCode = function() {
	var hash = 0;
	if (!this.length) return hash;
	for (var i = 0; i < this.length; i++) {
		var c = this.charCodeAt(i);
		hash = hash % 16777216;
		hash = ((hash<<5)-hash)+c;
		hash = hash & 0xffffffff; // Convert to 32bit integer
	}
	return hash;
};

/**
 * @method trim
 * @return {String}
 */
Sp.trim = String.prototype.trim || function _String_prototype_trim() {
	return this.replace(/^\s+|\s+$/g, "");
};

/**
 * Analogous to PHP's parse_url function
 * @method parseUrl
 * @param {String} component Optional name of component to return
 * @return {String}
 */
Sp.parseUrl = function _String_prototype_parseUrl (component) {
	// http://kevin.vanzonneveld.net
	// modified by N.I for 'php' parse mode
	var key = ['source', 'scheme', 'authority', 'userInfo', 'user', 'pass', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
		parser = /^(?:([^:\/?#]+):)?(?:\/\/()(?:(?:()(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?()(?:(()(?:(?:[^?#\/]*\/)*)()(?:[^?#]*))(?:\?([^#]*))?(?:#(.*))?)/;
	var m = parser.exec(this), uri = {}, i = 14;
	while (i--) {
		if (m[i]) uri[key[i]] = m[i];
	}
	if (component) {
		return uri[component.replace('PHP_URL_', '').toLowerCase()];
	}
	delete uri.source;
	return uri;
};

/**
 * @method sameDomain
 * @param {String} url2 The url to compare against
 * @param {Object} options can include the following:<br>
 *  "compareScheme": boolean for whether the url scheme should be compared also
 * @return {boolean}
 * @private
 */
Sp.sameDomain = function _String_prototype_sameDomain (url2, options) {
	var parsed1 = this.parseUrl(),
		parsed2 = url2.parseUrl();
	var same = (parsed1.host === parsed2.host)
		&& (parsed1.user === parsed2.user)
		&& (parsed1.pass === parsed2.pass)
		&& (parsed1.port === parsed2.port);
	return options && options.compareScheme
		? same && (parsed1.scheme === parsed2.scheme)
		: same;
};

/**
 * @class Function
 * @description Q extended methods for Functions
 */

/**
 * Binds a method to an object, so "this" inside the method
 * refers to that object when it is called.
 * @method bind
 * @param {Function} method A reference to the function to call
 * @param {Object} obj The object to bind to
 * @param {object} options If supplied, binds these options and passes them during invocation. Optional.
 */
if (!Function.prototype.bind)
Function.prototype.bind = function _Function_prototype_bind(obj, options) {
	var method = this;
	if (!options) {
		return function _Q_bind_result() {
			return method.apply(obj, arguments);
		};
	}
	return function _Q_bind_result_withOptions() {
		var args = Array.prototype.slice.call(arguments);
		if (options) args.push(options);
		return method.apply(obj, args);
	};
};

if (!Array.prototype.indexOf)
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

/**
 * @class Date
 * @description Q methods for Date
 */

/**
 * Returns total number of milliseconds since the UNIX epoch
 * @method now
 * @return {Number}
 */

if (!Date.now)
Date.now = function _Date_now() {
	return new Date().getTime();
};

Date.fromDateTime = function _Date_fromDateTime(dateTimeString) {
	return new Date(dateTimeString.replace(/-/g,"/"));
};

if (window.Element) { // only IE7 and lower, which we don't support, wouldn't have this

var Elp = Element.prototype;

/**
 * @class Element
 * @description Q extended methods for DOM Elements
 */

/**
 * Call this on an element to access tools attached to it.
 * The tools are like "view models".
 * this method is overridden by the tool constructor on specific elements
 * @method Q
 * @param {String} toolName
 * @return {Q.Tool|null}
 */
if (!Elp.Q)
Elp.Q = function (toolName) {
	// this method is overridden by the tool constructor on specific elements
	return null;
};

/**
 * Check whether this element contains the given element
 * @method contains
 * @param {Element} child
 * @return {Boolean}
 */
if (!Elp.contains)
Elp.contains = function (child) {
	if (!child) return false;
	var node = child.parentNode;
	while (node) {
		if (node == this) {
			return true;
		}
		node = node.parentNode;
	}
	return false;
};

/**
 * Check whether this element is the given element or contains it
 * @method isOrContains
 * @param {Element} child
 * @return {Boolean}
 */
Elp.isOrContains = function (child) {
	if (!child) return false;
	return this === child || this.contains(child);
};

/**
 * Returns the computed style of an element
 * @method computedStyle
 * @param {Element} name Optional. If provided, the value of a property is returned instead of the whole style object.
 * @return {Object|String}
 */
Elp.computedStyle = function(name) {
	var computedStyle = window.getComputedStyle
		? window.getComputedStyle(this, null)
		: this.currentStyle;
	return name
		? (computedStyle ? computedStyle[name] : null)
		: computedStyle;
};

/**
 * Copies the computed style from another Element, and assigns it to this Element.
 * @method copyComputedStyle
 * @param {Element} src
 * @return {Element} returns this, for chaining
 */
Elp.copyComputedStyle = function(src) {
	var s = src.computedStyle();
	for ( var i in s ) {
		// Do not use `hasOwnProperty`, nothing will get copied
		if ( typeof i == "string" && i != "cssText" && !(/\d/).test(i) ) {
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

/**
 * Returns the first element in the chain of parent elements which supports scrolling
 * @method scrollingParent
 * @param {Element} element
 */
Elp.scrollingParent = function() {
	var p = this;
	while (p = p.parentNode) {
		if (typeof p.computedStyle !== 'function') {
			continue;
		}
		var overflow = p.computedStyle().overflow;
		if (['hidden', 'visible'].indexOf(overflow) < 0) {
			return p;
		}
	}
	return document.documentElement;
};

/**
 * Switch places with another element
 * @method swap
 * @param {Element} element
 */
Elp.swap = function(element) {
	var parent1, next1, parent2, next2;
	parent1 = this.parentNode;
	next1   = this.nextSibling;
	parent2 = element.parentNode;
	next2   = element.nextSibling;
	parent1.insertBefore(element, next1);
	parent2.insertBefore(this, next2);
};

function _returnFalse() { return false; }

/**
 * Prevent ability to select text in an element
 * @method preventSelections
 * @param {Boolean} deep whether to prevent it also on child elements
 * @param {Boolean} callouts whether to also cancel the callouts in webkit
 */
Elp.preventSelections = function (deep, callouts) {
	Q.addEventListener(this, 'selectstart', _returnFalse);
	this.preventSelectionsInfo = this.preventSelectionsInfo || {
		style: this.style['-moz-user-select']
			|| this.style['-webkit-user-select']
			|| this.style['-ms-user-select']
			|| this.style['user-select'],
		callout: this.style['-webkit-user-callout'],
		unselectable: this.unselectable
	};
	this.unselectable = 'on'; 
	this.style[Q.info.browser.prefix+'user-select']
	= this.style['user-select'] = 'none';
	if (callouts) {
		this.style[Q.info.browser.prefix+'user-callout']
		= this.style['user-select'] = 'none';
	}
	if (!deep) return;
	Q.each(this.children || this.childNodes, function () {
		if (this.preventSelections
		&& ['INPUT', 'TEXTAREA'].indexOf(this.tagName.toUpperCase()) < 0
		&& !this.hasClass('Q_selectable')) {
			this.preventSelections(deep);
		}
	});
};

/**
 * Restore ability to select text in an element 
 * @method restoreSelections
 * @param {Boolean} deep whether to restore it also on child elements
 * @return {Boolean}
 */
Elp.restoreSelections = function (deep) {
	var p = this.preventSelectionsInfo;
	if (p) {
		this.style['-moz-user-select']
		= this.style['-webkit-user-select']
		= this.style['-ms-user-select']
		= this.style['user-select'] = p.style || 'text';
		this.style['-webkit-user-callout'] = p.callout;
		this.unselectable = p.unselectable;
		delete this.preventSelectionsInfo;
	}
	Q.removeEventListener(this, 'selectstart', _returnFalse);
	if (!deep) return;
	Q.each(this.children || this.childNodes, function () {
		if (this.restoreSelections
		&& ['INPUT', 'TEXTAREA'].indexOf(this.tagName.toUpperCase()) >= 0) {
			this.restoreSelections(deep);
		}
	});
};

/**
 * Check whether this Element comes before another one, in a certain context
 * @method isBefore
 * @param {Element} element
 * @param {Element} context optional containing element, defaults ot the document element
 * @return {Boolean}
 */
Elp.isBefore = function (element, context) {
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

/**
 * Check whether this element has a given CSS class
 * @method hasClass
 * @param {String} className
 * @return {Boolean}
 */
Elp.hasClass = function (className) {
	if (this.classList) {
		return this.classList.contains(className);
	} else {
		return new RegExp('(^| )' + className + '( |$)', 'gi').test(this.className);
	}
};

/**
 * Remove a CSS class from the element
 * @method removeClass
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.removeClass = function (className) {
	if (this.classList) {
		this.classList.remove(className);
	} else {
		this.className = this.className.replace(new RegExp('(^| )' 
			+ className.split(' ').join('|') + '( |$)', 'gi'), ' ');
	}
	return this;
};

/**
 * Restore ability to select text in an element 
 * @method addClass
 * @param {String} className
 * @return {Element} returns this, for chaining
 */
Elp.addClass = function (className) {
	var classNames = className.split(' ');
	var l = classNames.length;
	for (var i=0; i<l; ++i) {
		var c = classNames[i];
		if (this.classList) {
			this.classList.add(c);
		} else {
			this.removeClass(c);
			this.className += ' ' + c;
		}
	}
	return this;
};

/**
 * Get the text content of an element (as opposed to its inner HTML)
 * @method text
 * @return {String}
 */
Elp.text = function() {
	return this.textContent || this.innerText;
};

/**
 * Returns whether the element's content has overflowed the element's bounds.
 * Does not work in IE8 and below for elements with {text-overflow: ellipsis}.
 * @method text
 * @return {String}
 */
Elp.isOverflowed = function() {
     return (this.offsetWidth < this.scrollWidth)
	 	|| (this.offsetHeight < this.scrollHeight);
};

if (!Elp.getElementsByClassName) {
	Elp.getElementsByClassName = document.getElementsByClassName;
}

}

if (!window.requestAnimationFrame) {
	window.requestAnimationFrame =
		window.webkitRequestAnimationFrame || 
		window.mozRequestAnimationFrame    || 
		window.oRequestAnimationFrame      || 
		window.msRequestAnimationFrame     || 
		function( callback ) {
			window.setTimeout(function _shim_requestAnimationFrame() {
				callback(Q.milliseconds());
			}, 1000 / Q.Animation.fps);
		};
}

if(!document.getElementsByClassName) {
	document.getElementsByClassName = function(className) {
		return Array.prototype.slice.call(this.querySelectorAll("." + className));
	};
}

// public methods:

/**
 * @class Q
 */

/**
 * Returns microtime like PHP
 * @static
 * @method microtime
 * @param getAsFloat {Boolean}
 * @return {String}
 */
Q.microtime = function _Q_microtime(getAsFloat) {
	var now = Date.now() / 1000;
	if (getAsFloat) return now;
	var s = parseInt(now, 10);
	return (Math.round((now - s) * 1000) / 1000) + ' ' + s;
};

/**
 * Returns the number of milliseconds since the
 * first call to this function (i.e. since script started).
 * 
 * @static
 * @method milliseconds
 * @param {Boolean} sinceEpoch
 *  Defaults to false. If true, just returns the number of milliseconds in the UNIX timestamp.
 * @return {float}
 *  The number of milliseconds, with fractional part
 */
Q.milliseconds = function (sinceEpoch) {
	var result = Date.now();
	if (sinceEpoch) return result;
	return result - Q.milliseconds.start;
};
Q.milliseconds.start = Date.now();

/**
 * Creates a derived object which you can extend, inheriting from an existing object
 * 
 * @static
 * @method objectWithPrototype
 * @param {Derived} original
 * @return {Derived}
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
 * 
 * @static
 * @method typeOf
 * @param {Mixed} value
 * @return {String}
 */
Q.typeOf = function _Q_typeOf(value) {
	var s = typeof value, x;
	if (s === 'function' && !(value instanceof Function)) {
		// older webkit workaround https://bugs.webkit.org/show_bug.cgi?id=33716
		s = 'object';
	}
	if (s === 'object') {
		if (value === null) {
			return 'null';
		}
		if (value instanceof Array || (value.constructor && value.constructor.name === 'Array')
		|| Object.prototype.toString.apply(value) === '[object Array]') {
			s = 'array';
		} else if (typeof value.typename != 'undefined' ) {
			return value.typename;
		} else if (typeof value.constructor != 'undefined' && typeof value.constructor.name != 'undefined') {
			if (value.constructor.name == 'Object') {
				return 'object';
			}
			if (value.constructor === window.jQuery) {
				return 'jQuery';
			}
			return value.constructor.name;
		} else if ((x = Object.prototype.toString.apply(value)).substr(0, 8) === "[object ") {
			return x.substring(8, x.length-1).toLowerCase();
		} else {
			return 'object';
		}
	}
	return s;
};

/**
 * Iterates over elements in a container, and calls the callback.
 * Use this if you want to avoid problems with loops and closures.
 * 
 * @static
 * @method each
 * @param {Array|Object|String|Number} container, which can be an array, object or string.
 *  You can also pass up to three numbers here: from, to and optional step
 * @param {Function|String} callback
 *  A function which will receive two parameters
 *	index: the index of the current item
 *	value: the value of the current item
 *  Also can be a string, which would be the name of a method to invoke on each item, if possible.
 *  In this case the callback should be followed by an array of arguments to pass to the method calls.
 * @param {Object} options Can include the following: <br>
 *  ascending: Optional. Pass true here to traverse in ascending key order, false in descending.<br><br>
 *  numeric: Optional. Used together with ascending. Use numeric sort instead of string sort.<br>
 *  sort: Optional. Pass a compare Function here to be used when sorting object keys before traversal. Also can pass a String naming the property on which to sort.
 *  hasOwnProperty: Optional. Set to true to skip properties found on the prototype chain.<br>
 * @throws {Q.Error} If container is not array, object or string
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
				c = [];
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
					r = Q.handle(callback, container[i], args || [i, container[i], container]);
					if (r === false) return false;
				}
			} else {
				for (i=0; i<length; ++i) {
					r = Q.handle(callback, container[i], args || [i, container[i]], container);
					if (r === false) return false;
				}
			}
			break;
		case 'object':
			if (!container || !callback) return;
			if (options && ('ascending' in options || 'sort' in options)) {
				var keys = [], key;
				for (k in container) {
					if (options.hasOwnProperty && !Q.has(container, k)) {
						continue;
					}
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						keys.push(options.numeric ? Number(k) : k);
					}
				}
				var s = options.sort;
				var t = typeof(s);
				var _byKeys = undefined;
				function _byFields(a, b) { 
					return container[a][s] > container[b][s] ? 1
						: (container[a][s] < container[b][s] ? -1 : 0); 
				}
				function _byKeysNumeric(a, b) { 
					return Number(a) - Number(b); 
				}
				function _byFieldsNumeric(a, b) { 
					return Number(container[a][s]) - Number(container[b][s]); 
				}
				var compare = (t === 'function') ? s : (t === 'string'
					? (options.numeric ? _byFieldsNumeric : _byFields)
					: (options.numeric ? _byKeysNumeric : _byKeys));
				keys.sort(compare);
				if (options.ascending === false) {
					for (i=keys.length-1; i>=0; --i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				} else {
					for (i=0; i<keys.length; ++i) {
						key = keys[i];
						r = Q.handle(callback, container[key], args || [key, container[key], container]);
						if (r === false) return false;
					}
				}
			} else {
				for (k in container) {
					if (container.hasOwnProperty && container.hasOwnProperty(k)) {
						r = Q.handle(callback, container[k], args || [k, container[k], container]);
						if (r === false) return false;
					}
				}
			}
			break;
		case 'string':
			var c;
			if (!container || !callback) return;
			if (options && options.ascending === false) {
				for (i=0; i<container.length; ++i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
					if (r === false) return false;
				}
			} else {
				for (i=container.length-1; i>=0; --i) {
					c = container.charAt(i);
					r = Q.handle(callback, c, args || [i, c, container]);
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
			if (!step || (to-from)*step<0) {
				return 0;
			}
			if (from <= to) {
				for (i=from; i<=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step < 0) return 0;
				}
			} else {
				for (i=from; i>=to; i+=step) {
					r = Q.handle(callback, this, args || [i], container);
					if (r === false) return false;
					if (step > 0) return 0;
				}
			}
			break;
		case 'function':
		case 'boolean':
			if (container === false) break;
			throw new Q.Error("Q.each: does not support iterating a " + t);
		case 'null':
		case 'undefined':
			break;
	}
};

/**
 * Returns the first non-undefined value found in a container
 * Note: do not rely on object key ordering, it can vary in some browsers
 * 
 * @static
 * @method first
 * @param {Array|Object|String} container
 * @param {Object} options<br>
 *  "nonEmptyKey": return the first non-empty key
 * @return {mixed} the value in the container, or undefined
 * @throws {Q.Error} If container is not array, object or string
 */
Q.first = function _Q_first(container, options) {
	var fk = Q.firstKey(container, options);
	return fk != null ? container[fk] : undefined;
};

/**
 * Returns the first key or index found in a container with a value that's not undefined
 * Note: do not rely on object key ordering, it can vary in some browsers
 * 
 * @static
 * @method firstKey
 * @param {Array|Object|String} container
 * @param {Object} options<br>
 *  "nonEmptyKey": return the first non-empty key
 * @return {Number|String}
 *  the index in the container, or null
 * @throws {Q.Error} If container is not array, object or string
 */
Q.firstKey = function _Q_firstKey(container, options) {
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
					if (k || !options || !options.nonEmptyKey) {
						return k;
					}
				}
			}
			break;
		case 'string':
			return 0;
		default:
			throw new Q.Error("Q.first: container has to be an array, object or string");
	}
	return null;
};

/**
 * Returns a container with the items in the first parameter that are not in the others
 * 
 * @static
 * @method diff
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
		throw new Q.Error("Q.diff: comparator must be a function");
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
 * Tests whether a variable contains a falsy value,
 * or an empty object or array.
 * 
 * @static
 * @method isEmpty
 * @param {object} o
 *  The object to test.
 *  @return {Boolean}
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
 * 
 * @static
 * @method isInteger
 * @param value {mixed}
 *  The value to test
 * @return {boolean}
 *	Whether it is an integer
 */
Q.isInteger = function _Q_isInteger(value) {
	return value > 0 ? Math.floor(value) === value : Math.ceil(value) === value;
};

/**
 * Determines whether something is a plain object created within Javascript,
 * or something else, like a DOMElement or Number
 * 
 * @static
 * @method isPlainObject
 * @param {Mixed} x
 * @return {Boolean}
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
 * 
 * @static
 * @method copy
 * @param {Array} fields
 *  Optional array of fields to copy. Otherwise copy all that we can.
 * @return {Object}
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
 * Extends an object by merging other objects on top. Among other things,
 *  Q.Events can be extended with Q.Events or objects of {key: handler} pairs,
 *  Arrays can be extended by other arrays or objects.
 *  (If an array is being extended by an object with a "replace" property,
 *   the array is replaced by the value of that property.)
 *  You can also extend recursively, see the levels parameter.
 * @method extend
 * @param target {Object}
 *  This is the first object. It winds up being modified, and also returned
 *  as the return value of the function.
 * @param levels {Number}
 *  Optional. Precede any Object with an integer to indicate that we should 
 *  also copy that many additional levels inside the object.
 * @param deep {Boolean|Number}
 *  Optional. Precede any Object with a boolean true to indicate that we should
 *  also copy the properties it inherits through its prototype chain.
 * @param anotherObject {Object}
 *  Put as many objects here as you want, and they will extend the original one.
 * @param namespace {String}
 *  Optional namespace to use when extending encountered Q.Event objects
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
	var type = Q.typeOf(target);
	var targetIsEvent = (type === 'Q.Event');
	var i, arg, k, argk, m, ttk, tak;
	for (i=1; i<length; ++i) {
		arg = arguments[i];
		if (!arg) {
			continue;
		}
		if (arg === true) {
			deep = true;
			continue;
		}
		if (typeof arg === 'number' && arg) {
			levels = arg;
			continue;
		}
		if (targetIsEvent) {
			if (arg && arg.constructor === Object) {
				for (m in arg) {
					target.set(arg[m], m);
				}
			} else {
				target.set(arg, namespace);
			}
			continue;
		}
		if (type === 'array' && Q.typeOf(arg) === 'array') {
			target = target.concat(arg);
		} else {
			for (k in arg) {
				if (deep !== true 
				&& (!arg.hasOwnProperty || !arg.hasOwnProperty(k))
				&& (arg.hasOwnProperty && (k in arg))) {
					continue;
				}
				argk = arg[k];
				ttk = (k in target) && Q.typeOf(target[k]);
				tak = Q.typeOf(argk);
				if (ttk === 'Q.Event') {
					if (argk && argk.constructor === Object) {
						for (var m in argk) {
							target[k].set(argk[m], m);
						}
					} else {
						target[k].set(argk, namespace);
					}
				} else if (!levels || Q.typeOf(argk) === 'Q.Event' || !(
					Q.isPlainObject(argk)
					|| (ttk === 'array' && tak === 'array')
				)) {
					target[k] = Q.copy(argk);
				} else {
					target[k] = (ttk === 'array' && ('replace' in argk))
						? Q.copy(argk.replace)
						: Q.extend(target[k], deep, levels-1, argk);
				}
				if (target[k] === undefined) {
					delete target[k];
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
 * 
 * @static
 * @method has
 * @param  {Object} obj
 * @param {String} key
 * @return {Boolean}
 */
Q.has = function _Q_has(obj, key) {
	return Object.prototype.hasOwnProperty.call(obj, key);
};

/**
 * 
 * @static
 * @method take
 * @param {Object} source
 *  An Object from which to take things
 * @param  {Array|Object} fields
 *  An array of fields to take
 *  Or an Object of fieldname: default pairs
 * @return {Object}
 */
Q.take = function _Q_take(source, fields) {
	var result = {};
	if (!source) return result;
	if (Q.typeOf(fields) === 'array') {
		for (var i = 0; i < fields.length; ++i) {
			if (fields[i] in source) {
				result [ fields[i] ] = source [ fields[i] ];
			}
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
 * 
 * @static
 * @method shuffle
 * @param {Array} arr
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
 * Mixes in one or more classes. Useful for inheritance and multiple inheritance.
 * 
 * @static
 * @method mixin
 * @param {Function} A
 *  The constructor corresponding to the "class" we are mixing functionality into
 *  This function will get the following members set:
 *  __mixins: an array of [B, C, ...]
 *  constructors(subject, params): a method to call the constructor of all mixin classes, in order. Pass "this" as the first argument.
 *  staticProperty(property): a method for getting a property name
 * @param {Function} B
 *  One or more constructors representing "classes" to mix functionality from
 *  They will be tried in the order they are provided, meaning methods from earlier ones
 *  override methods from later ones.
 */
Q.mixin = function _Q_mixin(A /*, B, ... */) {
	var __mixins = (A.__mixins || (A.__mixins = []));
	var mixin, i, k, l;
	for (i = 1, l = arguments.length; i < l; ++i) {
		mixin = arguments[i];
		if (typeof mixin !== 'function') {
			throw new Q.Error("Q.mixin: argument " + i + " is not a function");
		}
		var p = mixin.prototype, Ap = A.prototype;
		for (k in p) {
			if (!(k in Ap)) {
				Ap[k] = p[k];
			}
		}
		for (k in mixin) {
			if (!(k in A)) {
				A[k] = mixin[k];
			}
		}
		__mixins.push(arguments[i]);
	}

	A.staticProperty = function _staticProperty(propName) {
		for (var i=0; i<A.__mixins.length; ++i) {
			if (propName in A.__mixins[i]) {
				return A.__mixins[i].propName;
			}
		}
		return undefined;
	};
	
	A.constructors = function _constructors() {
		var mixins = A.__mixins;
		var i;
		for (i = mixins.length - 1; i >= 0; --i) {
			if (typeof mixins[i].constructors === 'function') {
				mixins[i].constructors.apply(this, arguments);
			}
			mixins[i].apply(this, arguments);
		}
	};

	A.prototype.constructors = function _prototype_constructors() {
		A.constructors.apply(this, arguments);
	};
};

/**
 * Normalizes text by converting it to lower case, and
 * replacing all non-accepted characters with underscores.
 * 
 * @static
 * @method normalize
 * @param {String} text
 *  The text to normalize
 * @param {String} replacement
 *  Defaults to '_'. A string to replace one or more unacceptable characters.
 *  You can also change this default using the config Db/normalize/replacement
 * @param {String} characters
 *  Defaults to '/[^A-Za-z0-9]+/'. A regexp characters that are not acceptable.
 *  You can also change this default using the config Db/normalize/characters
 * @param {Number} numChars
 *  The maximum length of a normalized string. Default is 200.
 * @return {String} the normalized string
 */
Q.normalize = function _Q_normalize(text, replacement, characters, numChars) {
	if (!numChars) numChars = 200;
	if (replacement === undefined) replacement = '_';
	characters = characters || /[^A-Za-z0-9]+/g;
	if (text === undefined) {
		debugger; // pause here if debugging
	}
	var result = text.toLowerCase().replace(characters, replacement);
	if (text.length > numChars) {
		result = text.substr(0, numChars-11) + '_' 
				 + Math.abs(text.substr(numChars-11).hashCode());
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
				throw new Q.Error("Q.setObject cannot set property of " + typeof(context) + " " + JSON.stringify(context));
			}
		}
	}
	return context; // mixed
}

/**
 * Extend a property from a delimiter-separated string, such as "A.B.C"
 * Useful for longer api chains where you have to test each object in
 * the chain, or when you have an object reference in string format.
 * Objects are created as needed along `path`.
 * 
 * @static
 * @method extendObject
 * @param {String} name Path to a property, in the form "A.B.C".
 * @param {Object} value value or object to place at location given by name
 * @param {Object} [context=window] Optional. Object to use as root of path.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @return {Object|undefined} Returns the passed value if setting is successful or `undefined` if not.
 */
Q.extendObject = function _Q_extendObject(name, value, context, delimiter){
	delimiter = delimiter || '.';
	var parts = name.split(delimiter);
	var p = parts.pop();
	var obj = _getProp(parts, true, context);
	if (obj === undefined) {
		console.warn("Failed to set '"+name+"'");
		return undefined;
	} else {
		// not null && object (maybe array) && value is real object
		if (obj[p]
		&& typeof obj[p] === "object"
		&& Q.typeOf(value) === "object") {
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
 * 
 * @static
 * @method setObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"]
 * @param {anything} value value or object to place at location given by name
 * @param {Object} [context=window]  Optional. Object to use as root of path.
 * @param {String} [delimiter='.']  The delimiter to use in the name
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
 * You can also use it to resolve an object where it might be a string or array or something else.
 * 
 * @static
 * @method getObject
 * @param {String|Array} name Path to a property, in the form "A.B.C" or ["A", "B", "C"] . If not a string or an array, it is simply returned.
 * @param {Object} [context=window] Optional. Object to use as root of path. Null may be passed.
 * @param {String} [delimiter='.'] The delimiter to use in the name
 * @param {Mixed} [create=undefined] Pass a value here to set with Q.setObject if nothing was there
 * @return {Object|undefined} Returns the originally stored value, or `undefined` if nothing is there
 */
Q.getObject = function _Q_getObject(name, context, delimiter, create) {
	delimiter = delimiter || '.';
	if (typeof name === 'string') {
		name = name.split(delimiter);
	} else if (!(name instanceof Array)) {
		return name;
	}
	var result = _getProp(name, false, context);
	if (create !== undefined) {
		Q.setObject(name, create, context, delimiter);
	}
	return result;
};

/**
 * Walks the tree from the parent, returns the object at the end of the path, or the the defaultValue
 * 
 * @static
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
 * Use this to ensure that a property exists before running some javascript code.
 * If something is undefined, loads a script or executes a function, calling the callback on success.
 * 
 * @static
 * @method ensure
 * @param {Mixed} property
 *  The property to test for being undefined.
 * @param {String|Function} loader
 *  Something to execute if the property was undefined.
 *  If a string, this is interpreted as the URL of a javascript to load.
 *  If a function, this is called with the callback as the first argument.
 * @param {Function} callback
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
 * Used to prevent overwriting the latest results on the client with older ones.
 * Typically, you would call this function before making some sort of request,
 * save the ordinal in a variable, and then pass it to the function again inside
 * a closure. For example:
 * @example
 * var ordinal = Q.latest(tool);
 * requestSomeResults(function (err, results) {
 *   if (!Q.latest(tool, ordinal)) return;
 *   // otherwise, show the latest results on the client
 * });
 * 
 * @static
 * @method latest
 * @param key {String|Q.Tool}
 *  Requests under the same key share the same incrementing ordinal
 * @param ordinal {Number|Boolean}
 *  Pass an ordinal that you obtained from a previous call to the function
 *  Pass true here to get the latest ordinal that has been passed so far
 *  to the method under this key, corresponding to the latest results seen.
 * @return {Number|Boolean}
 *  If only key is provided, returns an ordinal to use.
 *  If ordinal is provided, then returns whether this was the latest ordinal.
 */
Q.latest = function (key, ordinal) {
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = key.id;
	}
	if (ordinal === undefined) {
		return Q.latest.issued[key]
			= ((Q.latest.issued[key] || 0) % Q.latest.max) + 1;
	}
	var seen = Q.latest.seen[key] || 0;
	if (ordinal === true) {
		return seen;
	}
	if (ordinal > seen || ordinal < seen - Q.latest.max * 9/10) {
		Q.latest.seen[key] = ordinal;
		return true;
	}
	return false;
};
Q.latest.issued = {};
Q.latest.seen = {};
Q.latest.max = 10000;

/**
 * Wraps a callable in a Q.Event object
 * @class Q.Event
 * @namespace Q
 * @constructor
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
		throw new Q.Error("Q.Event: Missing new keyword");
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
		if (this.stopped) return 0;
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

/**
 * Returns a Q.Event that will fire given an DOM object and an event name
 * 
 * @static
 * @method from
 * @param {String|Q.Tool} key
 * @param {Object} source
 * @param {String} eventName
 * @return {Q.Event}
 */
Q.Event.from = function _Q_Event_from(source, eventName) {
	var event = new Q.Event();
	Q.addEventListener(source, eventName, event.handle);
	return event;
};

/**
 * Calculates a string key by considering the parameter that was passed,
 * the tool being activated, and the page being activated
 * 
 * @static
 * @method calculateKey
 * @param {String|Q.Tool} key
 * @param {Object} container in which the key will be used
 * @param {Number} number at which to start the loop for the default key generation
 * @return {String}
 */
Q.Event.calculateKey = function _Q_Event_calculateKey(key, container, start) {
	if (key === true) {
		return key;
	}
	if (key === undefined) {
		key = Q.Tool.beingActivated; // by default, use the current tool as the key, if any
	}
	if (Q.typeOf(key) === 'Q.Tool')	{
		key = key.id;
	}
	if (container && key == undefined) { // key is undefined or null
		var i = (start === undefined) ? 1 : start;
		key = 'AUTOKEY_' + i;
		while (container[key]) {
			key = 'AUTOKEY_' + (++i);
		}
	}
	return key;
};
Q.Event.calculateKey.keys = [];

var Evp = Q.Event.prototype;
Evp.occurred = false;

/**
 * Adds a handler to an event, or overwrites an existing one
 * 
 * @method set
 * @param {Mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} key Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass true here to associate the handler to the current page,
 *  and it will be automatically removed when the current page is removed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {Boolean} prepend If true, then prepends the handler to the chain
 * @return {String} The key under which the event was set
 */
Evp.set = function _Q_Event_prototype_set(handler, key, prepend) {
	var isTool = (Q.typeOf(key) === 'Q.Tool');
	if (key === true || (key === undefined && Q.Page.beingActivated)) {
		Q.Event.forPage.push(this);
	}
	key = Q.Event.calculateKey(key, this.handlers, this.keys.length);
	this.handlers[key] = handler; // can be a function, string, Q.Event, etc.
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
		this._onFirst.handle.call(this, handler, key, prepend);
	}
	if (this._onSet) {
		this._onSet.handle.call(this, handler, key, prepend);
	}
	return key;
};

/**
 * Like the "set" method, adds a handler to an event, or overwrites an existing one.
 * But in addition, immediately handles the handler if the event has already occurred at least once,
 * passing it the same subject and arguments as were passed to the event the last time it occurred.
 * 
 * @method add
 * @param {mixed} handler Any kind of callable which Q.handle can invoke
 * @param {String|Boolean|Q.Tool} Optional key to associate with the handler.
 *  Used to replace handlers previously added under the same key.
 *  Also used for removing handlers with .remove(key).
 *  If the key is not provided, a unique one is computed.
 *  Pass a Q.Tool object here to associate the handler to the tool,
 *  and it will be automatically removed when the tool is removed.
 * @param {Boolean} prepend If true, then prepends the handler to the chain
 * @return {String} The key under which the handler was set
 */
Evp.add = function _Q_Event_prototype_add(handler, key, prepend) {
	var ret = this.set(handler, key, prepend);
	if (this.occurred) {
		Q.handle(handler, this.lastContext, this.lastArgs);
	}
	return ret;
};

/**
 * Removes an event handler
 * 
 * @method remove
 * @param {String} key
 *  The key of the handler to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Evp.remove = function _Q_Event_prototype_remove(key) {
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
	var l, i = this.keys.indexOf(key);
	if (i < 0) {
		return 0;
	}
	this.keys.splice(i, 1);
	if (this._onRemove) {
		this._onRemove.handle.call(this, key);
	}
	if (!this.keys.length && this._onEmpty) {
		this._onEmpty.handle.call(this, key);
	}
	delete this.handlers[key];
	return 1;
};

/**
 * Removes all handlers for this event
 * 
 * @method removeAllHandlers
 * @param {String} key
 *  The key of the handler to remove.
 *  Pass a Q.Tool object here to remove the handler, if any, associated with this tool.
 */
Evp.removeAllHandlers = function _Q_Event_prototype_removeAllHandlers() {
	this.handlers = {};
	this.keys = [];
	if (this._onEmpty) {
		this._onEmpty.handle.call(this);
	}
};

/**
 * Indicates that the event won't be firing anymore
 * 
 * @method stop
 * @param {Boolean} removeAllHandlers
 *  If true, then also removes all the handlers added to this event
 */
Evp.stop = function _Q_Event_prototype_stop(removeAllHandlers) {
	this.stopped = true;
	if (this._onStop) {
		this._onStop.handle.call(this);
	}
	if (removeAllHandlers) {
		this.removeAllHandlers.call(this);
	}
};

/**
 * Make a copy of this event, with all the keys and handlers
 * 
 * @method copy
 * @return {Q.Event}
 */
Evp.copy = function _Q_Event_prototype_copy() {
	var result = new Q.Event();
	for (var i=0; i<this.keys.length; ++i) {
		result.handlers[this.keys[i]] = this.handlers[this.keys[i]];
		result.keys.push(this.keys[i]);
	}
	return result;
};

/**
 * Returns a new Q.Event that occurs whenever either this or anotherEvent occurs
 * 
 * @method or
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to anotherEvent.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event}
 */
Evp.or = function _Q_Event_prototype_or(anotherEvent, key, anotherKey) {
	if (!anotherEvent) {
		return this.copy();
	}
	var newEvent = new Q.Event();
	this.add(newEvent.handle, key);
	anotherEvent.add(newEvent.handle, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event that occurs whenever either this or anotherEvent occurs
 * as long as both have occurred.
 * 
 * @method and
 * @param {Q.Event} anotherEvent
 *  The other event to check
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.and = function _Q_Event_prototype_and(anotherEvent, key, anotherKey) {
	if (!anotherEvent) {
		return this.copy();
	}
	var newEvent = new Q.Event();
	var event = this;
	function _Q_Event_and_wrapper() {
		if (event.occurred && anotherEvent.occurred) {
			newEvent.handle.call(this, arguments);
		}
	}
	event.add(_Q_Event_and_wrapper, key);
	anotherKey = anotherEvent.add(_Q_Event_and_wrapper, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that is handled whenever this event is handled,
 * until anotherEvent occurs, in which case this event occurs one final time.
 * 
 * @method until
 * @param {Q.Event} anotherEvent
 *  An event whose occurrence will stop the returned event
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to this.add (see docs for that method).
 * @param {String|Boolean|Q.Tool} [anotherKey] Optional key to pass to anotherEvent.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.until = function _Q_Event_prototype_until(anotherEvent, key, anotherKey) {
	var newEvent = new Q.Event();
	var event = this;
	key = event.add(newEvent.handle, key);
	anotherKey = anotherEvent.add(function _Q_Event_until_wrapper() {
		event.remove(key);
		anotherEvent.remove(anotherKey);
		event.stop();
	}, anotherKey);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until this event is stopped,
 * then processes all the pending calls to .handle(), continuing normally after that.
 * 
 * @method then
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.onStop().add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.then = function _Q_Event_prototype_then(key) {
	var newEvent = new Q.Event();
	var handle = newEvent.handle;
	var _waiting = true;
	var _pending = [];
	newEvent.handle = function _Q_Event_then_wrapper() {
		if (_waiting) {
			_pending.push([this, arguments]);
			return 0;
		}
		return handle.apply(this, arguments);
	};
	var key2 = this.onStop().add(function () {
		for (var i=0; i<_pending.length; ++i) {
			handle.apply(_pending[i][0], _pending[i][1]);
		}
		_waiting = false;
		this.onStop().remove(key2);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that waits until after this event's handle() stops
 * being called for a given number of milliseconds, before processing the last call.
 * 
 * @method debounce
 * @param {Number} milliseconds The number of milliseconds
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.debounce = function _Q_Event_prototype_debounce(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.debounce(newEvent.handle, milliseconds, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only at most every given milliseconds.
 * 
 * @method throttle
 * @param {Number} milliseconds The number of milliseconds
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.throttle = function _Q_Event_prototype_throttle(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.throttle(newEvent.handle, milliseconds, 0), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will queue calls to this event's handle()
 * method, to occur once every given milliseconds
 * 
 * @method queue
 * @param {Number} milliseconds The number of milliseconds, can be 0
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.queue = function _Q_Event_prototype_queue(milliseconds, key) {
	var newEvent = new Q.Event();
	this.add(Q.queue(newEvent.handle, milliseconds), key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but only if the test function returns true
 * 
 * @method filter
 * @param {Function} test Function to test the arguments and return a Boolean
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.filter = function _Q_Event_prototype_filter(test, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		if (!test.apply(this, arguments)) return 0;
		return newEvent.handle.apply(newEvent, arguments);
	}, key);
	return newEvent;
};

/**
 * Return a new Q.Event object that will call handle() when this event's handle()
 * is called, but with the arguments returned by the transform function
 * 
 * @method map
 * @param {Function} transform Function to transform the arguments and return
 *   an array of two items for the new call: [this, arguments]
 * @param {String|Boolean|Q.Tool} [key] Optional key to pass to event.add (see docs for that method).
 * @return {Q.Event} A new Q.Event object
 */
Evp.map = function _Q_Event_prototype_map(transform, key) {
	var newEvent = new Q.Event();
	this.add(function () {
		var parts = transform.apply(this, arguments);
		return newEvent.handle.apply(parts[0], parts[1]);
	}, key);
	return newEvent;
};

Evp.onFirst = function () {
   return this._onFirst || (this._onFirst = new Q.Event());
};

Evp.onSet = function () {
   return this._onSet || (this._onSet = new Q.Event());
};

Evp.onRemove = function () {
   return this._onRemove || (this._onRemove = new Q.Event());
};

Evp.onEmpty = function () {
   return this._onEmpty || (this._onEmpty = new Q.Event());
};

Evp.onStop = function () {
   return this._onStop || (this._onStop = new Q.Event());
};

/**
 * Make an event factory
 * 
 * @static
 * @method factory
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
		var args = Array.prototype.slice.call(arguments, 0);
		var len = defaults.length;
		var f = (typeof(defaults[len-1]) === 'function') ? defaults[defaults.length-1] : null;
		if (f) --len;
		for (var i=args.length; i<len; ++i) {
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
 * @class Q
 */

/**
 * This event occurs right before Q javascript library is initialized
 * @event beforeInit
 */
Q.beforeInit = new Q.Event();
/**
 * This event occurs when Q javascript library has just been initialized
 * @event onInit
 */
Q.onInit = new Q.Event();
/**
 * This event tracks the window.onload event
 * @event onLoad
 */
Q.onLoad = new Q.Event();
/**
 * This event tracks the window.onunload event
 * @event onUnload
 */
Q.onUnload = new Q.Event();
/**
 * This event tracks the window.hashchange event
 * @event onHashChange
 */
Q.onHashChange = new Q.Event();
/**
 * This event tracks the window.popstate event
 * @event onPopState
 */
Q.onPopState = new Q.Event();
/**
 * This event tracks the window.ononline event, when browser goes online
 * @event onOnline
 */
Q.onOnline = new Q.Event(function () {
	_isOnline = true;
}, 'Q');
/**
 * This event tracks the window.onoffline event, when online connection is lost
 * @event onOffline
 */
Q.onOffline = new Q.Event(function () {
	_isOnline = false;
}, 'Q');
/**
 * This event occurs every time before something is activated
 * @event beforeActivate
 */
Q.beforeActivate = new Q.Event();
/**
 * This event occurs every time after something is activated
 * @event onActivate
 */
Q.onActivate = new Q.Event();
/**
 * This event occurs when the DOM is ready
 * @event onDOM
 */
Q.onDOM = new Q.Event();
/**
 * This event occurs when the DOM and entire environment is ready
 * @event onReady
 */
Q.onReady = new Q.Event();
/**
 * This event occurs when jQuery has been loaded
 * @event onJQuery
 */
Q.onJQuery = new Q.Event();
/**
 * This event occurs every time the layout needs to be updated
 * @event onLayout
 */
Q.onLayout = new Q.Event(_detectOrientation, 'Q');
/**
 * This event is convenient for doing stuff when the window scrolls
 * @event onLayout
 */
Q.onScroll = new Q.Event();
/**
 * This event tracks the document.onvisibilitychange event, when online connection is lost
 * @event onVisibilityChange
 */
Q.onVisibilityChange = new Q.Event();
/**
 * This event occurs before replacing the contents of an element
 * @event beforeReplace
 */
Q.beforeReplace = new Q.Event();

/**
 * Sets up control flows involving multiple callbacks and dependencies
 * Usage:
 * @example
 * var p = Q.pipe(['user', 'stream], function (params, subjects) {
 *   // arguments that were passed are in params.user, params.stream
 *   // this objects that were passed are in subjects.user, subjects.stream
 * });
 * mysql("SELECT * FROM user WHERE userId = 2", p.fill('user'));
 * mysql("SELECT * FROM stream WHERE publisherId = 2", p.fill('stream'));
 *
 * The first parameter to p.fill() is the name of the field to fill when it's called
 * You can pass a second parameter to p.fill, which can be either:
 * true - in this case, the current function is ignored during the next times through the pipe
 * a string - in this case, this name is considered unfilled the next times through this pipe
 * an array of strings - in this case, these names are considered unfilled the next times through the pipe
 * @class Q.Pipe
 * @constructor
 * @see {Pp.add} for more info on the parameters
 */
Q.Pipe = function _Q_Pipe(requires, maxTimes, callback) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
	this.callbacks = [];
	this.params = {};
	this.subjects = {};
	this.ignore = {};
	this.finished = false;
	this.add.apply(this, arguments);
};

var Pp = Q.Pipe.prototype;

/**
 * Adds a callback to the pipe
 * 
 * @method on
 * @param field {String}
 *  Pass the name of a field to wait for, until it is filled, before calling the callback.
 * @param callback {Function}
 *  This function is called as soon as the field is filled, i.e. when the callback
 *  produced by pipe.fill(field) is finally called by someone.
 *  The "this" and arguments from that call are also passed to the callback.
 *  The callback receives the same "this" and arguments that the original call was made with.
 *  It is passed the "this" and arguments which are passed to the callback.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 */
Pp.on = function _Q_pipe_on(field, callback) {
	return this.add([field], 1, function _Q_pipe_on_callback (params, subjects, field) {
		return callback.apply(subjects[field], params[field], field);
	});
};

/**
 * Adds a callback to the pipe with more flexibility
 * 
 * @method add
 * @param requires {Array}
 *  Optional. Pass an array of required field names here.
 *  Alternatively, pass an array of objects, which should be followed by
 *  the name of a Q.Event to wait for.
 * @param maxTimes {Number}
 *  Optional. The maximum number of times the callback should be called.
 * @param callback {Function}
 *  Once all required fields are filled, this function is called every time something is piped.
 *  It is passed four arguments: (params, subjects, field, requires)
 *  If you return false from this function, it will no longer be called for future pipe runs.
 *  If you return true from this function, it will delete all the callbacks in the pipe.
 */
Pp.add = function _Q_pipe_add(requires, maxTimes, callback) {
	var r = null, n = null, e = null, r2, events, keys;
	for (var i=0; i<arguments.length; i++) {
		if (typeof arguments[i] === 'function') {
			if (e) {
				r2 = [];
				events = [];
				keys = [];
				var pipe = this;
				Q.each(r, function (k, item) {
					var event = Q.getObject(e, item);
					if (Q.typeOf(event) === 'Q.Event') {
						keys.push(event.add(pipe.fill(k)));
						r2.push(k);
						events.push(event);
					}
				});
				arguments[i].pipeEvents = events;
				arguments[i].pipeKeys = keys;
				r = r2;
			}
			arguments[i].pipeRequires = r;
			arguments[i].pipeRemaining = n;
			r = n = e = null;
			this.callbacks.push(arguments[i]);
		} else {
			switch (Q.typeOf(arguments[i])) {
			case 'array':
				r = arguments[i];
				if (r.length
				&& typeof r[0] !== 'string'
				&& typeof r[0] !== 'number') {
					e = arguments[++i];
				}
				break;
			case 'object':
				r = arguments[i];
				e = arguments[++i];
				break;
			case 'number':
				n = arguments[i];
				break;
			default:
				break;
			}
			if (e != null && typeof e !== 'string') {
				throw new Q.Error("Pp.add requires event name after array of objects");
			}
		}
	}
	return this;
};

/**
 * Makes a function that fills a particular field in the pipe and can be used as a callback
 * 
 * @method fill
 * @param field {String}
 *   For error callbacks, you can use field="error" or field="users.error" for example.
 * @param ignore
 *   Optional. If true, then ignores the current field in subsequent pipe runs.
 *   Or pass the name (string) or names (array) of the field(s) to ignore in subsequent pipe runs.
 * @return {Function} Returns a callback you can pass to other functions.
 */
Pp.fill = function _Q_pipe_fill(field, ignore) {
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
		pipe.run(field);
	};
};

/**
 * Runs the pipe
 * 
 * @method run
 * @param field {String} optionally indicate name of the field that was just filled
 * @return {Number} the number of pipe callbacks that wound up running
 */
Pp.run = function _Q_pipe_run(field) {
	var cb, ret, callbacks = this.callbacks, params = Q.copy(this.params), count = 0;
	var i, j;

	cbloop:
	for (i=0; i<callbacks.length; i++) {
		if (this.ignore[i]) {
			continue;
		}
		this.i = i;
		if (!(cb = callbacks[i]))
			continue;
		if (cb.pipeRequires) {
			for (j=0; j<cb.pipeRequires.length; j++) {
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
		ret = cb.call(this, this.params, this.subjects, field, cb.pipeRequires);
		if (cb.pipeEvents) {
			for (j=0; j<cb.pipeEvents.length; j++) {
				cb.pipeEvents[j].remove(cb.pipeKeys[j]);
			}
		}
		++count;
		delete cb.pipeEvents;
		delete cb.pipeKeys;
		if (ret === false) {
			delete callbacks[i];
		} else if (ret === true) {
			this.callbacks = []; // clean up memory
			this.finished = true;
			break;
		}
	}
	return count;
};


/**
 * @class Q
 */

/**
 * A convenience method for constructing Q.Pipe objects
 * and is really here just for backward compatibility.
 * 
 * @static
 * @method pipe
 * @return {Q.Pipe}
 * @see Q.Pipe
 */
Q.pipe = function _Q_pipe(a, b, c, d) {
	return new Q.Pipe(a, b, c, d);
};

/**
 * This function helps create "batch functions", which can be used in getter functions
 * and other places to accomplish things in batches.
 * 
 * @static
 * @method batcher
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
			var i;
			var callbacks = [], args = [];

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
 * 
 * @static
 * @method batcher.factory
 * @param {Object} collection An object to contain all the batcher functions
 * @param {String} baseUrl The base url of the webservice built to support batch requests.
 * @param {String} tail The rest of the url of the webservice built to support batch requests.
 * @param {String} slotName The name of the slot to request. Defaults to "batch".
 * @param {String} fieldName The name of the data field. Defaults to "batch".
 * @param {Object} options Any additional options to pass to Q.req, as well as:<br>
 *  "max": Passed as option to Q.batcher<br>
 *  "ms": Passed as option to Q.batcher<br>
 *  "preprocess": Optional function calculating a data structure to JSON stringify into the data field
 * @return {Function} A function with any number of non-function arguments followed by
 *  one function which is treated as a callback and passed (errors, content)
 *  where content is whatever is returned in the slots.
 */
Q.batcher.factory = function _Q_batcher_factory(collection, baseUrl, tail, slotName, fieldName, options) {
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
		var o = Q.extend({
			method: 'post',
			fields: {}
		}, options);
		var result = options && options.preprocess
			? options.preprocess(args)
			: {args: args};
		o.fields[fieldName] = JSON.stringify(result);
		Q.req(baseUrl+tail, slotName, function (err, response) {
			var error = err || response.errors;
			if (error) {
				Q.each(callbacks, function (k, cb) {
					cb[0].call(this, error);
				});
				return;
			}
			var request = this;
			Q.each(response.slots.batch, function (k, result) {
				if (result && result.errors) {
					callbacks[k][0].call(this, result.errors, null, request);
				} else {
					callbacks[k][0].call(this, null, (result && result.slots) || {}, request);
				}
			});
		}, o);
	}, options);
	Q.setObject(name, f, collection, delimiter);
	return f;
};

/**
 * Wraps a getter function to provide support for re-entrancy, cache and throttling.
 *  It caches based on all non-function arguments which were passed to the function.
 *  All functions passed in as arguments are considered as callbacks. Getter execution is
 *  considered complete when one of the callbacks is fired. If any other callback is fired,
 *  throttling may be influenced - i.e. throttleSize will increase by number of callbacks fired.
 *  If the original function has a "batch" property, it gets copied as a property of
 *  the wrapper function being returned. This is useful when calling Q.getter(Q.batcher(...))
 *  Call method .forget with the same arguments as original getter to clear cache record
 *  and update it on next call to getter (if it happen)
 * 
 * @static
 * @method getter
 * @param original {Function}
 *  The original getter function to be wrapped
 *  Can also be an array of [getter, execute] which you can use if
 *  your getter does "batching", and waits a tiny bit before sending the batch request,
 *  to see if any more will be requested. In this case, the execute function
 *  is supposed to execute the batched request without waiting any more.
 * @param options {Object}
 *  An optional hash of possible options, which include:
 *  "throttle" => a String id to throttle on, or an Object that supports the throttle interface:
 *	"throttle.throttleTry" => function(subject, getter, args) - applies or throttles getter with subject, args
 *	"throttle.throttleNext" => function (subject) - applies next getter with subject
 *	"throttleSize" => defaults to 100. Integer representing the size of the throttle, if it is enabled
 *	"cache" => pass false here to prevent caching, or an object which supports the Q.Cache interface
 * @return {Function}
 *  The wrapper function, which returns an object with a property called "result"
 *  which could be one of Q.getter.CACHED, Q.getter.WAITING, Q.getter.REQUESTING or Q.getter.THROTTLING
 */
Q.getter = function _Q_getter(original, options) {

	function wrapper() {
		var i, key, that = this, arguments2 = Array.prototype.slice.call(arguments);
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

		var cached, cbpos, cbi;

		// if caching required check the cache -- maybe the result is there
		if (wrapper.cache) {
			if (cached = wrapper.cache.get(key)) {
				cbpos = cached.cbpos;
				if (callbacks[cbpos]) {
					wrapper.onResult.handle(cached.subject, cached.params, arguments2, ret, original);
					Q.getter.usingCached = true;
					callbacks[cbpos].apply(cached.subject, cached.params);
					ret.result = Q.getter.CACHED;
					wrapper.onExecuted.handle.call(this, arguments2, ret);
					return ret; // wrapper found in cache, callback and throttling have run
				}
			}
		}
		Q.getter.usingCached = false;

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
					if (wk) for (i = 0; i < wk.length; i++) {
						wrapper.onResult.handle(this, arguments, arguments2, wk[i].ret, original);
						wk[i].callbacks[cbpos].apply(this, arguments);
					}
					delete _waiting[key]; 

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
					console.warn("Q.getter: throttle count is negative. This probably means you passed a callback somewhere it shouldn't have been passed.");
				}
				if (p.queue.length) {
					p.queue.shift().apply(that, p.args.shift());
				}
			};
		}
		if (!wrapper.throttleSize) {
			wrapper.throttle.throttleSize = function _throttleSize(newSize) {
				if (typeof newSize === 'undefined') {
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

	Q.extend(wrapper, original, Q.getter.options, options);
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
	} // else assume we were passed an Object that supports the cache interface

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
			return wrapper.cache.remove(key);
		}
	};

	if (original.batch) {
		wrapper.batch = original.batch;
	}
	return wrapper;
};
var _Q_getter_i = 0;
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
 * Wraps a function and returns a wrapper that will call the function at most once.
 * 
 * @static
 * @method once
 * @param {Function} original The function to wrap
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.once = function (original, defaultValue) {
	var _called = false;
	return function _Q_once_wrapper() {
		if (_called) return defaultValue;
		_called = true;
		return original.apply(this, arguments);
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * at most once every given milliseconds.
 * 
 * @static
 * @method throttle
 * @param {Function} original The function to wrap
 * @param {Number} milliseconds The number of milliseconds
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.throttle = function (original, milliseconds, defaultValue) {
	var _lastCalled;
	return function _Q_throttle_wrapper() {
		if (Date.now() - _lastCalled < milliseconds) return defaultValue;
		_lastCalled = Date.now();
		return original.apply(this, arguments);
	};
};

/**
 * Wraps a function and returns a wrapper that adds the function to a queue
 * of functions to be called one by one at most once every given milliseconds.
 * 
 * @static
 * @method queue
 * @param {Function} original The function to wrap
 * @param {Number} milliseconds The number of milliseconds, defaults to 0
 * @return {Function} The wrapper function
 */
Q.queue = function (original, milliseconds) {
	var _queue = [];
	var _timeout = null;
	milliseconds = milliseconds || 0;
	function _Q_queue_next() {
		if (!_queue.length) {
			_timeout = null;
			return 0;
		}
		var p = _queue.shift();
		var ret = original.apply(p[0], p[1]);
		if (ret === false) {
			_timeout = null;
			_queue = [];
		} else {
			_timeout = setTimeout(_Q_queue_next, milliseconds);
		}
	};
	return function _Q_queue_wrapper() {
		var args = Array.prototype.slice.call(arguments, 0);
		var len = _queue.push([this, args]);
		if (!_timeout) {
			_timeout = setTimeout(function () {
				_Q_queue_next();
			}, 0);
		}
		return len;
	};
};

/**
 * Wraps a function and returns a wrapper that will call the function
 * after calls stopped coming in for a given number of milliseconds
 * 
 * @static
 * @method debounce
 * @param {Function} original The function to wrap
 * @param {Number} milliseconds The number of milliseconds
 * @param {Mixed} defaultValue Value to return whenever original function isn't called
 * @return {Function} The wrapper function
 */
Q.debounce = function (original, milliseconds, defaultValue) {
	var _timeout = null;
	return function _Q_debounce_wrapper() {
		if (_timeout) {
			clearTimeout(_timeout);
		}
		var t = this, a = arguments;
		_timeout = setTimeout(function () {
			original.apply(t, a);
		}, milliseconds);
		return defaultValue;
	};
};

/**
 * Custom exception constructor
 * @class Q.Exception
 * @constructor
 * @param [message=""] {string} The error message
 * @param {object} fields={}
 */
Q.Exception = function (message, fields) {
	this.fields = fields || {};
	this.message = message || "";
};

Q.Error.prototype = Error;

/**
 * The root mixin added to all tools.
 * 
 * @class Q.Tool
 * @constructor
 * @param [element] the element to activate into a tool
 * @param [options={}] an optional set of options that may contain ".Tool_name or #Some_exact_tool or #Some_child_tool"
 * @return {Q.Tool} if this tool is replacing an earlier one, returns existing tool that was removed.
 *	 Otherwise returns null, or false if the tool was already constructed.
 */
Q.Tool = function _Q_Tool(element, options) {
	if (this.activated) {
		return this; // don't construct the same tool more than once
	}
	this.activated = true;
	this.element = element;
	this.typename = 'Q.Tool';

	if (window.jQuery) {
		jQuery(element).data('Q_tool', this);
	}

	// ID and prefix
	if (!this.element.id) {
		var prefix = Q.Tool.beingActivated ? Q.Tool.beingActivated.prefix : '';
		this.element.id = (prefix + this.name + '_' + (Q.Tool.nextDefaultId++) + "_tool").toLowerCase();
	}
	this.prefix = Q.Tool.calculatePrefix(this.element.id);
	this.id = this.prefix.substr(0, this.prefix.length-1);

	// for later use
	var classes = (this.element.className && this.element.className.split(/\s+/) || []);

	// options from data attribute
	var dataOptions = element.getAttribute('data-' + Q.normalize(this.name, '-'));
	if (dataOptions) {
		var parsed = null;
		if (dataOptions[0] === '{') {
			parsed = JSON.parse(dataOptions);
		} else {
			var ios = dataOptions.indexOf(' ');
			this.id = dataOptions.substr(0, ios);
			var tail = dataOptions.substr(ios+1);
			parsed = tail && JSON.parse(tail);
		}
		if (parsed) {
			Q.extend(this.options, Q.Tool.options.levels, parsed, 'Q.Tool');
		}
	}

	// options cascade -- process option keys that start with '.' or '#'
	var partial, i, l;
	options = options || {};
	this.options = this.options || {};
	
	var pids = this.parentIds(),
		len = pids.length,
		o = len ? Q.extend({}, Q.Tool.options.levels, options) : options;
	
	for (i=len-1; i>=0; --i) {
		var pid = pids[i];
		if (Q.isEmpty(Q.Tool.active[pid].state)) continue;
		o = Q.extend(o, Q.Tool.options.levels, Q.Tool.active[pid].state);
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
	
	if (element.Q === Element.prototype.Q) {
		element.Q = function (toolName) {
			if (!toolName) {
				return (this.Q.tool || null);
			}
			return this.Q.tools[Q.normalize(toolName)] || null;
		};
	}
	
	var normalizedName = Q.normalize(this.name);
	if (!element.Q.tools) element.Q.tools = {};
	element.Q.tools[normalizedName] = this;
	element.Q.tool = this;
	Q.Tool.active[this.id] = this;
	
	// Add a Q property on the object and extend it with the prototype.Q if any
	this.Q = Q.extend({
		/**
		 * Q.Event which occurs when the tool was constructed
		 * @event onConstruct
		 */
		onConstruct: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was initialized
		 * @event onInit
		 */
		onInit: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was removed
		 * @event onRemove
		 */
		beforeRemove: new Q.Event(),
		/**
		 * Q.Event which occurs when the tool was retained while replacing some HTML
		 * @event onRetained
		 */
		onRetain: new Q.Event(),
		/**
		 * Returns Q.Event which occurs when some fields in the tool's state changed
		 * @event onStateChanged
		 * @param name {String} The name of the field. Can be "" to listen on all fields.
		 */
		onStateChanged: new Q.Event.factory({}, "")
	}, this.Q);
	
	return this;
};

Q.Tool.options = {
	levels: 10
};

Q.Tool.active = {};
Q.Tool.latestName = null;
Q.Tool.latestNames = {};

var _constructToolHandlers = {};
var _activateToolHandlers = {};
var _initToolHandlers = {};
var _beforeRemoveToolHandlers = {};
var _waitingParentStack = [];
var _pendingParentStack = [];

function _toolEventFactoryNormalizeKey(key) {
	var parts = key.split(':', 2);
	parts[parts.length-1] = Q.normalize(parts[parts.length-1]);
	return [parts.join(':')];
}

/**
 * Returns Q.Event which occurs when a tool has been constructed, but not yet activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onActivate
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onConstruct = Q.Event.factory(_constructToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Returns Q.Event which occurs when a tool has been activated
 * Generic callbacks can be assigned by setting toolName to ""
 * @class Q.Tool
 * @event onActivate
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onActivate = Q.Event.factory(_activateToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Returns Q.Event which occurs when a tool has been initialized
 * Generic callbacks can be assigned by setting toolName to ""
 * 
 * @event onInit
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.onInit = Q.Event.factory(_initToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Returns Q.Event which occurs when a tool is about to be removed
 * Generic callbacks can be assigned by setting toolName to ""
 * 
 * @event beforeRemove
 * @param nameOrId {String} the name of the tool, such as "Q/inplace", or "id:" followed by tool's id
 */
Q.Tool.beforeRemove = Q.Event.factory(_beforeRemoveToolHandlers, ["", _toolEventFactoryNormalizeKey]);

/**
 * Traverses elements in a particular container, including the container, and removes + destroys all tools.
 * 
 * @static
 * @method remove
 * @param elem {HTMLElement}
 *  The container to traverse
 * @param removeCached {Boolean}
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
 *  should be removed.
 */
Q.Tool.remove = function _Q_Tool_remove(elem, removeCached) {
	Q.find(elem, true, null, function _Q_Tool_remove_found(toolElement) {
		for (var name in toolElement.Q.tools) {
			toolElement.Q.tools[name].remove(removeCached);
		}
	});
};

/**
 * Traverses children in a particular container and removes + destroys all tools.
 * 
 * @static
 * @method clear
 * @param elem {HTMLElement}
 *  The container to traverse
 * @param removeCached {Boolean}
 *  Defaults to false. Whether the tools whose containing elements have the "data-Q-retain" attribute
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
 * 
 * @static
 * @method define
 * @param name {String|Object} The name of the tool, e.g. "Q/foo". Also you can pass an object of name: filename here here.
 * @param ctor {Function} Your tool's constructor. You can also pass a filename here, in which case the other parameters are ignored.
 * @param defaultOptions {Object} An optional hash of default options for the tool
 * @param stateKeys {Array} An optional array of key names to copy from options to state
 * @param methods {Object} An optional hash of method functions to assign to the prototype
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
			_qtdo[name] = _qtdo[name] || {};
			return Q.Tool.constructors[name] = ctor;
		}
		return ctor;
	}
	if (typeof stateKeys === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	ctor.options = Q.extend(
		defaultOptions, Q.Tool.options.levels, _qtdo[name]
	);
	ctor.stateKeys = stateKeys;
	if (typeof ctor !== 'function') {
		throw new Q.Error("Q.Tool.define requires ctor to be a string or a function");
	}
	Q.extend(ctor.prototype, 10, methods);
	Q.Tool.constructors[name] = ctor;
	Q.Tool.onLoadedConstructor(name).handle(name, ctor);
	Q.Tool.onLoadedConstructor("").handle(name, ctor);
	Q.Tool.latestName = name;
	return ctor;
};

Q.Tool.beingActivated = undefined;

/**
 * Call this function to define options for a tool constructor
 * that may not have been loaded yet.
 * 
 * @static
 * @method define.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.define.options = function (toolName, setOptions) {
	var options;
	toolName = Q.normalize(toolName);
	if (Q.Tool.constructors[toolName]) {
		options = Q.Tool.constructors[toolName].options;
	} else {
		options = _qtdo[toolName] = _qtdo[toolName] || {};
	}
	if (setOptions) {
		Q.extend(options, setOptions);
	}
	return options;
};
var _qtdo = {};

/**
 * Call this function to define a jQuery plugin, and a tool with the same name that uses it.
 * 
 * @static
 * @method jQuery
 * @param {String} name The name of the jQuery plugin and tool, e.g. "Q/foo"
 * @param {Function} ctor Your jQuery plugin's constructor
 * @param {Object} defaultOptions An optional hash of default options for the plugin
 * @param {Array} stateKeys An optional array of key names to copy from options to state
 * @param {Object} methods An optional hash of method functions to assign to the prototype
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
			_qtjo[name] = _qtjo[name] || {};
			window.jQuery.fn.plugin[name] = Q.Tool.constructors[name] = ctor;
		}
		return ctor;
	}
	if (typeof stateKeys === 'object') {
		methods = stateKeys;
		stateKeys = undefined;
	}
	Q.onJQuery.add(function ($) {
		function jQueryPluginConstructor(options /* or methodName, argument1, argument2, ... */) {
			if (typeof options === 'string') {
				var method = options;
				if (jQueryPluginConstructor.methods[method]) {
					// invoke method on this with arguments
					return jQueryPluginConstructor.methods[method].apply(
						this, Array.prototype.slice.call(arguments, 1)
					);
				}
			} else {
				var args = Array.prototype.slice.call(arguments, 0);
				args[0] = Q.extend({}, 10, jQueryPluginConstructor.options, 10, options);
				$(this).each(function () {
					var key = name + ' state';
					var $this = $(this);
					if ($this.data(key)) {
						// This jQuery plugin was already applied here,
						// so call remove method if it's defined,
						// before calling constructor again
						$this.plugin(name, 'remove');
					}
					$this.data(key, Q.copy(args[0], stateKeys));
					ctor.apply($this, args);
				});
			}
			return this;
		}
		jQueryPluginConstructor.options = Q.extend(
			defaultOptions, Q.Tool.options.levels, _qtjo[name]
		);
		jQueryPluginConstructor.methods = methods || {};
		$.fn[name] = jQueryPluginConstructor;
		var ToolConstructor = Q.Tool.define(name, function _Q_Tool_jQuery_toolConstructor(options) {
			$(this.element).plugin(name, options, this);
			this.Q.beforeRemove.set(function () {
				$(this.element).plugin(name, 'remove', this);
			}, 'Q');
		});
		Q.each(methods, function (method) {
			ToolConstructor.prototype[method] = function _Q_Tool_jQuery_method() {
				var args = Array.prototype.slice.call(arguments, 0);
				args.unshift(name, method);
				var $te = $(this.element);
				$te.plugin.apply($te, args);
			};
		});
	});
	Q.Tool.latestName = name;
};

/**
 * Call this function to define options for a jQuery tool constructor
 * that may not have been loaded yet.
 * 
 * @static
 * @method jQuery.options
 * @param {String} toolName the name of the tool
 * @param {Object} setOptions the options to set
 * @return {Object} the resulting pending options for the tool
 */
Q.Tool.jQuery.options = function (pluginName, setOptions) {
	var options;
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
var _qtjo = {};

Q.Tool.nextDefaultId = 1;
var _qtc = Q.Tool.constructors = {};

var Tp = Q.Tool.prototype;

/**
 * Call this after changing one more values in the state.
 * Unlike Angular and Ember, Q provides a more explicit mechanism
 * for signaling that a tool's state has changed.
 * Other parts of code can use the Tool.prototype.onState event factory
 * to attach handlers to be run when the state changes.
 * 
 * @method stateChanged
 * @param {String|Array} names Name(s) of properties that may have changed
 */
Tp.stateChanged = function Q_Tool_prototype_stateChanged(names) {
	if (typeof names === 'string') {
		names = [names];
	}
	var l = names.length;
	for (var i=0; i<l; ++i) {
		var name = names[i];
		this.Q.onStateChanged(name).handle.call(this, name);
	}
	this.Q.onStateChanged('').handle(this, [names]);
};

/**
 * Gets child tools contained in the tool, as determined by their prefixes
 * based on the prefix of the tool.
 * 
 * @method children
 * @param {String} append The string to append to the prefix to find the child tools
 * @param {Number} levels Pass 1 here to get only the immediate children, 2 for immediate children and grandchildren, etc.
 * @return {Object} A hash of {prefix: Tool} pairs
 */
Tp.children = function Q_Tool_prototype_children(append, levels) {
	var result = {},
		prefix2 = Q.normalize(this.prefix + (append || "")),
		id, ni, i, ids;
	for (id in Q.Tool.active) {
		ni = Q.normalize(id);
		if (id.length >= prefix2.length + (append ? 0 : 1)
		&& ni.substr(0, prefix2.length) == prefix2) {
			if (levels) {
				ids = Q.Tool.active[id].parentIds();
				for (i=0; i<levels; ++i) {
					if (ids[i] === this.id) {
						result[id] = Q.Tool.active[id];
						break;
					}
				}
			} else {
				result[id] = Q.Tool.active[id];
			}
		}
	}
	return result;
};

/**
 * Gets one child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * 
 * @method child
 * @param {String} append The string to append to the prefix to find the child tool
 * @return {Tool|null}
 */
Tp.child = function Q_Tool_prototype_child(append) {
	var prefix2 = Q.normalize(this.prefix + (append || ""));
	var id, ni;
	for (id in Q.Tool.active) {
		ni = Q.normalize(id);
		if (id.length >= prefix2.length + (append ? 0 : 1)
		&& ni.substr(0, prefix2.length) == prefix2) {
			return Q.Tool.active[id];
		}
	}
	return null;
};

/**
 * Gets the first child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * 
 * @method parentIds
 * @return {Tool|null}
 */
Tp.parentIds = function Q_Tool_prototype_parentIds() {
	var prefix2 = Q.normalize(this.prefix), ids = [], id, ni;
	for (id in Q.Tool.active) {
		ni = Q.normalize(id);
		if (ni.length < prefix2.length-1 && ni === prefix2.substr(0, ni.length)) {
			ids.push(id);
		}
	}
	// sort in reverse length order
	ids.sort(function (a, b) { 
		return String(b).length - String(a).length; 
	});
	return ids;
};

/**
 * Gets parents tools containing the tool, as determined by their prefixes
 * based on the prefix of the tool.
 * 
 * @method parents
 * @return {Object} A hash of {prefix: Tool} pairs
 */
Tp.parents = function Q_Tool_prototype_parents() {
	var ids = [], i, id;
	ids = this.parentIds();
	var result = {}, len = ids.length;
	for (i=0; i<len; ++i) {
		id = ids[i];
		result[id] = Q.Tool.active[id];
	}
	return result;
};

/**
 * Gets the first child tool contained in the tool, which matches the prefix
 * based on the prefix of the tool.
 * 
 * @method parent
 * @return {Tool|null}
 */
Tp.parent = function Q_Tool_prototype_parent() {
	var ids = [];
	ids = this.parentIds();
	return ids.length ? Q.Tool.active[ids[0]] : null;
};

/**
 * Called when a tool instance is removed, possibly
 * being replaced by another.
 * Typically happens after an AJAX call which returns
 * markup for the new instance tool.
 * Also can be used for removing a tool instance
 * and all of its children.
 * 
 * @method remove
 * @param {Boolean} removeCached
 *  Defaults to false. Whether or not to remove the actual tool if its containing element
 *  has a "data-Q-retain" attribute.
 * @return {Boolean} Returns whether the tool was removed.
 */
Tp.remove = function _Q_Tool_prototype_remove(removeCached) {

	var i;
	var shouldRemove = removeCached
		|| !this.element.getAttribute('data-Q-retain') !== null;
	if (!shouldRemove) return false;

	// give the tool a chance to clean up after itself
	var normalizedName = Q.normalize(this.name);
	var normalizedId = Q.normalize(this.id);
	_beforeRemoveToolHandlers["id:"+normalizedId] &&
	_beforeRemoveToolHandlers["id:"+normalizedId].handle.call(this);
	_beforeRemoveToolHandlers[normalizedName] &&
	_beforeRemoveToolHandlers[normalizedName].handle.call(this);
	_beforeRemoveToolHandlers[""] &&
	_beforeRemoveToolHandlers[""].handle.call(this);
	Q.handle(this.Q.beforeRemove, this, []);
	
	delete this.element.Q.tools[Q.normalize(this.name)];
	if (Q.isEmpty(this.element.Q.tools)) {
		Q.removeElement(this.element);
		delete Q.Tool.active[this.id];
	}

	// remove all the tool's events automatically
	var tool = this;
	while (Q.Event.forTool[this.id] && Q.Event.forTool[this.id].length) {
		// keep removing the first element of the array until it is empty
		Q.Event.forTool[this.id][0].remove(tool);
	}
	
	var p = Q.Event.jQueryForTool[this.id];
	if (p) {
		for (i=p.length-1; i >= 0; --i) {
			var off = p[i][0];
			window.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
		}
		Q.Event.jQueryForTool[this.id] = [];
	}

	return true;
};

/**
 * If jQuery is available, returns jQuery(selector, this.element).
 * Just a tiny Backbone.js-style convenience helper; this.$ is similar
 * to $, but scoped to the DOM tree of this tool.
 * 
 * @method $
 * @param {String} selector
 *   jQuery selector
 * @return {Object}
 *   jQuery object matched by the given selector
 */
Tp.$ = function _Q_Tool_prototype_$(selector) {
	if (window.jQuery) {
		return selector === undefined
			? window.jQuery(this.element)
			: window.jQuery(selector, this.element);
	} else {
		throw new Q.Error("Tp.$ requires jQuery");
	}
};

/**
 * Returns all subelements with the given class name.
 * 
 * @method getElementsByClassName
 * @param {String} className
 *   the class name to look for
 * @return {NodeList}
 *   a list of nodes with the given class name.
 */
Tp.getElementsByClassName = function _Q_Tool_prototype_getElementsByClasName(className) {
	return this.element.getElementsByClassName(className);
};

/**
 * Be notified whenever a child tool is activated, repeatedly if it is
 * removed and then activated again.
 * 
 * @event onChildActivate
 */
Tp.onChildActivate = function _Q_Tool_prototype_onChildActivate(append) {
	return Q.Tool.onActivate('id:'+this.prefix+append);
};

/**
 * Be notified whenever a child tool is initialized, repeatedly if it is
 * removed and then activated again.
 * 
 * @event onChildInit
 */
Tp.onChildInit = function _Q_Tool_prototype_onChildInit(append) {
	return Q.Tool.onInit('id:'+this.prefix+append);
};

/**
 * Returns a string that is already properly encoded and can be set as the value of an options attribute
 * 
 * @static
 * @method encodeOptions
 * @param {Object} options the options to pass to a tool
 * @return String
 */
Q.Tool.encodeOptions = function _Q_Tool_stringFromOptions(options) {
	return JSON.stringify(options).encodeHTML().replaceAll({"&quot;": '"'});
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * 
 * @static
 * @method setUpElement
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @param {String} prefix
 *  Optional prefix to prepend to the tool's id
 * @return {HTMLElement}
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
	var ntt = toolType.replace(/\//g, '_');
	element.addClass('Q_tool '+ntt+'_tool');
	if (!id && !element.getAttribute(id)) {
		var p1, p2;
		p1 = prefix || (Q.Tool.beingActivated 
			? Q.Tool.beingActivated.prefix
			: ''
		);
		do {
			p2 = (p1 && p1 + '_') + ntt + '_' + (Q.Tool.nextDefaultId++) + '_';
		} while (Q.Tool.active[p2]);
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
 * 
 * @static
 * @method setUpElementHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Q.Tool.setUpElementHTML = function _Q_Tool_elementHTML(element, toolType, toolOptions, id, prefix) {
	var e = Q.Tool.setUpElement(element, toolType, null, id, prefix);
	var ntt = toolType.replace(/\//g, '_');
	e.setAttribute('data-'+ntt.replace(/_/g, '-'), Q.Tool.encodeOptions(toolOptions));
	return e.outerHTML;
};

/**
 * Sets up element so that it can be used to activate a tool
 * For example: $('container').append(Q.Tool.setUpElement('div', 'Streams/chat')).activate(options);
 * The prefix and id of the element are derived from the tool on which this method is called.
 * 
 * @method setUpElement
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {HTMLElement}
 *  Returns an element you can append to things
 */
Tp.setUpElement = function (element, toolType, toolOptions, id) {
	return Q.Tool.setUpElement(element, toolType, toolOptions, id, this.prefix);
};

/**
 * Returns HTML for an element that it can be used to activate a tool.
 * The prefix and id of the element are derived from the tool on which this method is called.
 * For example: $('container').append(Q.Tool.make('Streams/chat')).activate(options);
 * 
 * @method setUpElementHTML
 * @param {String|Element} element
 *  The tag of the element, such as "div", or a reference to an existing Element
 * @param {String} toolType
 *  The type of the tool, such as "Q/tabs"
 * @param {Object} toolOptions
 *  The options for the tool
 * @param {String} id
 *  Optional id of the tool, such as "_2_Q_tabs"
 * @return {String}
 *  Returns HTML that you can include in templates, etc.
 */
Tp.setUpElementHTML = function (element, toolType, toolOptions, id) {
	return Q.Tool.setUpElementHTML(element, toolType, toolOptions, id, this.prefix);
};

/**
 * Returns a tool corresponding to the given DOM element, if such tool has already been constructed.
 * 
 * @static
 * @method from
 * @param toolElement {Element}
 *   the root element of the desired tool
 * @param {String} toolName
 *   optional name of the tool attached to the element
 * @return {Q.Tool|null}
 *   the tool corresponding to the given element, otherwise null
 */
Q.Tool.from = function _Q_Tool_from(toolElement, toolName) {
	if (typeof toolElement === 'string') {
		toolElement = document.getElementById(toolElement);
	}
	return toolElement.Q ? toolElement.Q(toolName) : null;
};

/**
 * Reference a tool by its id
 * 
 * @static
 * @method byId
 * @param {String} id
 * @param {String} name optional name of the tool, useful if more than one tool was activated on the same element
 * @return {Q.Tool|null}
 */
Q.Tool.byId = function _Q_Tool_byId(id, name) {
	var tool = Q.Tool.active[id];
	return tool && name ? tool.element.Q(name) : tool || null;
};

/**
 * Computes and returns a tool's prefix
 * 
 * @static
 * @method calculatePrefix
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculatePrefix = function _Q_Tool_calculatePrefix(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-4);
	} else if (id.substr(-1) === '_') {
		return id;
	} else {
		return id + "_";
	}
};

/**
 * Computes and returns a tool's id
 * 
 * @static
 * @method calculateId
 * @param {String} id the id or prefix of an existing tool or its element
 * @return {String}
 */
Q.Tool.calculateId = function _Q_Tool_calculatePrefix(id) {
	if (id.match(/_tool$/)) {
		return id.substring(0, id.length-5);
	} else if (id.substr(-1) === '_') {
		return id.substring(0, id.length-1);
	} else {
		return id;
	}
};

/**
 * For debugging purposes only, allows to log tool names conveniently
 * 
 * @method toString
 * @return {String}
 */
Tp.toString = function _Q_Tool_prototype_toString() {
	return this.id.substr(0, this.id.length - 1);
};

/**
 * Loads the script corresponding to a tool
 * @method _loadToolScript
 * @param {DOMElement} toolElement
 * @param {Function} callback  The callback to call when the corresponding script has been loaded and executed
 * @param {Mixed} shared pass this only when constructing a tool
 * @param {Q.Pipe} you can pass a parent pipe which will be filled later
 * @return {Boolean} whether the script needed to be loaded
 */
function _loadToolScript(toolElement, callback, shared, parentPipe) {
	var id = toolElement.id;
	var classNames = toolElement.className.split(' ');
	var toolNames = [];
	var normalizedId = Q.normalize(Q.Tool.calculateId(id));
	if (parentPipe) {
		if (!parentPipe.waitForIdNames) {
			parentPipe.waitForIdNames = [];
		}
	}
	for (var i=0, nl = classNames.length; i<nl; ++i) {
		var className = classNames[i];
		if (className === 'Q_tool'
		|| className.slice(-5) !== '_tool') {
			continue;
		}
		toolNames.push(Q.normalize(className.substr(0, className.length-5)));
	}
	var p = new Q.Pipe(toolNames, function (params) {
		// now that all the tool scripts are loaded, activate the tools in the right order
		for (var i=0, nl = toolNames.length; i<nl; ++i) {
			var toolName = toolNames[i];
			callback.apply(null, params[toolName]);
		}
	});
	Q.each(toolNames, function (i, toolName) {
		function _loadToolScript_loaded() {
			// in this function, toolFunc starts as a string
			if (Q.Tool.latestName) {
				_qtc[toolName] = _qtc[Q.Tool.latestName];
				Q.Tool.latestNames[toolFunc] = Q.Tool.latestName;
			}
			toolFunc = _qtc[toolName];
			if (typeof toolFunc !== 'function') {
				Q.Tool.onMissingConstructor.handle(_qtc, toolName);
				toolFunc = _qtc[toolName];
				if (typeof toolFunc !== 'function') {
					console.warn("Q.Tool.loadScript: Missing tool constructor for " + toolName);
					toolFunc = function () { console.log("Missing tool constructor for " + toolName); }; 
				}
			}
			p.fill(toolName)(toolElement, toolFunc, toolName, uniqueToolId);
		}
		var toolFunc = _qtc[toolName];
		if (typeof toolFunc === 'undefined') {
			Q.Tool.onMissingConstructor.handle(_qtc, toolName);
			toolFunc = _qtc[toolName];
			if (typeof toolFunc !== 'function' && typeof toolFunc !== 'string') {
				console.warn("Q.Tool.loadScript: Missing tool constructor for " + toolName);
				toolFunc = function () {
					console.log("Missing tool constructor for " + toolName);
				}; 
			}
		}
		if (parentPipe) {
			var normalizedName = Q.normalize(toolName);
			parentPipe.waitForIdNames.push(normalizedId+"\t"+normalizedName);
		}
		if (shared) {
			var uniqueToolId = "tool " + (shared.waitingForTools.length+1)
				+ ": " + normalizedId;
			if (!shared.firstToolId) {
				shared.firstToolId = uniqueToolId;
			}
			shared.waitingForTools.push(uniqueToolId);
		}
		if (typeof toolFunc === 'function') {
			return p.fill(toolName)(toolElement, toolFunc, toolName, uniqueToolId);
		}
		if (toolFunc === undefined) {
			return;
		}
		if (typeof toolFunc !== 'string') {
			throw new Q.Error("Q.Tool.loadScript: toolFunc cannot be " + typeof(toolFunc));
		}
		if (Q.Tool.latestNames[toolFunc]) {
			Q.Tool.latestName = Q.Tool.latestNames[toolFunc];
			_loadToolScript_loaded();
		} else {
			Q.Tool.latestName = null;
			Q.addScript(toolFunc, _loadToolScript_loaded);
		}
	});
}

Q.Tool.onLoadedConstructor = Q.Event.factory({}, ["", function (name) { 
	return [Q.normalize(name)];
}]);
Q.Tool.onMissingConstructor = new Q.Event();


/**
 * A Q.Session object represents a session, and implements things like an "expiring" dialog
 * @class Q.Session
 * @constructor
 */

Q.Session = function _Q_Session() {
	// TODO: Set a timer for when session expires?
	return {};
};

/**
 * A Q.Request object represents a network request issued by Q
 * @class Q.Request
 * @constructor
 */

Q.Request = function _Q_Request(url, slotNames, callback, options) {
	this.url = url;
	this.slotNames = slotNames;
	this.callback = callback;
	this.options = options;
};

/**
 * A Q.Cache object stores items in a cache and throws out least-recently-used ones.
 * @class Q.Cache
 * @constructor
 * @param {Object} options you can pass the following options:
 *  "localStorage": use local storage instead of page storage<br>
 *  "sessionStorage": use session storage instead of page storage<br>
 *  "name": the name of the cache, not really used for now<br>
 *  "max": the maximum number of items the cache should hold. Defaults to 100.
 */
Q.Cache = function _Q_Cache(options) {
	if (this === Q) {
		throw new Q.Error("Q.Pipe: omitted keyword new");
	}
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
     * @method earliest
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
     * @method latest
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
     * @method count
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
		if (!value) {
			debugger; // pause here if debugging
		}
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
 * 
 * @static
 * @method key
 * @param  {Array} args the arguments from which to generate the key
 * @param {Array} functions  optional array to which all the functions found in the arguments will be pushed
 * @return {String}
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

var Cp = Q.Cache.prototype;

/**
 * Accesses the cache and sets an entry in it
 * 
 * @static
 * @method set
 * @param {String} key  the key to save the entry under, or an array of arguments
 * @param {Options} options  supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {Boolean} whether there was an existing entry under that key
 */
Cp.set = function _Q_Cache_prototype_set(key, cbpos, subject, params, options) {
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
 * 
 * @static
 * @method get
 * @param {String} key  the key to search for
 * @param {Object} options  supports the following options:
 *  "dontTouch": if true, then doesn't mark item as most recently used. Defaults to false.
 * @return {mixed} whatever is stored there, or else returns undefined
 */
Cp.get = function _Q_Cache_prototype_get(key, options) {
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
 * 
 * @static
 * @method remove
 * @param {String} key  the key of the entry to remove
 * @return {Boolean} whether there was an existing entry under that key
 */
Cp.remove = function _Q_Cache_prototype_remove(key) {
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
 * 
 * @static
 * @method clear
 */
Cp.clear = function _Q_Cache_prototype_clear() {
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
 * 
 * @static
 * @method each
 * @param {Array} args  An array consisting of some or all the arguments that form the key
 * @param {Function} callback  Is passed two parameters: key, value, with this = the cache
 */
Cp.each = function _Q_Cache_prototype_clear(args, callback) {
	var prefix = null;
	if (!callback) return;
	if (typeof args === 'function') {
		callback = args;
		args = undefined;
	} else {
		var json = Q.Cache.key(args);
		prefix = json.substring(0, json.length-1);
	}
	var cache = this;
	if (this.documentStorage) {
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
 * A constructor to create Q.Page objects
 * @class Q.Page
 * @constructor
 * @param {String} uriString
 */
Q.Page = function (uriString) {
	this.uriString = uriString;
};

Q.Page.beingLoaded = false;
Q.Page.beingActivated = false;

/**
 * Occurs after the page loads
 * 
 * @event onLoad
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onLoad = Q.Event.factory(null, [""]);
/**
 * Occurs after the page is activated
 * 
 * @event onActivate
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onActivate = Q.Event.factory(null, [""]);
/**
 * Occurs after the page unloads
 * 
 * @event onUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.onUnload = Q.Event.factory(null, [""]);
/**
 * Occurs before the page loads
 * 
 * @event beforeLoad
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.beforeLoad = Q.Event.factory(null, [""]);
/**
 * Occurs before the page unloads
 * 
 * @event beforeUnload
 * @param uriString {String} The full URI string, or "Module/action"
 */
Q.Page.beforeUnload = Q.Event.factory(null, [""]);

/**
 * @class Q
 */

/**
 * Use this function to set handlers for when the page is loaded or unloaded.
 * 
 * @static
 * @method page
 * @param page {String} "$Module/$action" or a more specific URI string, or "" to handle all pages
 * @param handler {Function} A function to run after the page loaded.
 *  If the page is already currently loaded (i.e. it is the latest loaded page)
 *  then the handler is run right away.
 *  The handler can optionally returns another function, which will be run when the page is unloaded.
 *  After a page is unloaded, all the "unloading" handlers added in this way are removed, so that
 *  the next time the "loading" handlers run, they don't create duplicate "unloading" handlers.
 * @param key {String} Use this to identify the entity setting the handler, e.g. "Users/authorize".
 *  If the key is undefined, it will be automatically set to "Q". To force no key, pass null here.
 *  Since "loading" handlers are not automatically removed, they can accumulate if the key was null.
 *  For example, if an AJAX call would execute Javascript such as Q.page(uri, handler, null),
 *  this could lead to frustrating bugs as event handlers are registered multiple times, etc.
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
	Q.Page.onActivate(page)
	.add(function Q_onPageActivate_handler(url, options) {
		var unload = handler.call(
			Q, Q.Page.beforeUnload("Q\t"+page), url, options
		);
		if (unload && typeof unload === "function") {
			Q.Page.beforeUnload("Q\t"+page).set(unload, key);
		}
	}, key);
};

/**
 * Initialize the Q javascript platform
 * 
 * @static
 * @method init
 * @param {Object} options
 *  Supports the following options:
 *  "isLocalFile": defaults to false. Set this to true if you are calling Q.init from local file:/// context.
 */
Q.init = function _Q_init(options) {

	Q.info.imgLoading = Q.info.imgLoading ||
		Q.url('plugins/Q/img/throbbers/loading.gif');

	Q.loadUrl.options.slotNames = Q.info.slotNames;

	_detectOrientation();

	Q.handle(Q.beforeInit);
	Q.handle(Q.onInit); // Call all the onInit handlers

	Q.addEventListener(window, 'unload', Q.onUnload.handle);
	Q.addEventListener(window, 'online', Q.onOnline.handle);
	Q.addEventListener(window, 'offline', Q.onOffline.handle);

	var checks = ["ready"];
	if (window.cordova && Q.typeOf(window.cordova).substr(0, 4) !== 'HTML'
	&& window.device) {
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
			Q.handle(navigator.onLine ? Q.onOnline : Q.onOffline);
			Q.ready();
		}

		function _getJSON() {
			if (window.JSON) {
				_ready();
			} else {
				Q.addScript(Q.init.jsonLibraryUrl, _ready);
			}
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
				Q.addEventListener(document, "click", function (e) {
					var t = e.target, s;
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
		if (window.device) {
			_Q_init_deviceready_handler();
		} else {
			Q.addEventListener(document, 'deviceready', _Q_init_deviceready_handler, false);
		}
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
 * 
 * @static
 * @method ready
 */
Q.ready = function _Q_ready() {
	function readyWithNonce() {

		_isReady = true;

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
		
		Q.onDOM.handle.call(window, window.jQuery);

		var body = document.getElementsByTagName('body')[0];
		Q.activate(body, undefined, function _onReadyActivate() {
			// Hash changes -- will work only in browsers that support it natively
			// see http://caniuse.com/hashchange
			Q.addEventListener(window, 'hashchange', Q.onHashChange.handle);
			
			// History changes -- will work only in browsers that support it natively
			// see http://caniuse.com/history
			Q.addEventListener(window, 'popstate', Q.onPopState.handle);

			// To support tool layouting, trigger 'layout' event
			// on browser resize and orientation change
			Q.addEventListener(window, 'resize', Q.onLayout.handle);
			Q.addEventListener(window, 'orientationchange', Q.onLayout.handle);
			Q.addEventListener(window, 'scroll', Q.onScroll.handle);
			_setLayoutInterval();

			// Call the functions meant to be called after ready() is done
			Q.onReady.handle.call(window, window.jQuery);

			if (Q.info.isCordova && navigator.splashscreen) {
				navigator.splashscreen.hide();
			}

			// This is an HTML document loaded from our server
			try {
				Q.Page.beingActivated = true;
				Q.Page.onActivate('').handle(Q.info.url);
				if (Q.info && Q.info.uri) {
					var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
					Q.Page.onActivate(moduleSlashAction).handle();
					if (Q.info.uriString !== moduleSlashAction) {
						Q.Page.onActivate(Q.info.uriString).handle();
					}
				}
				Q.Page.beingActivated = false;
			} catch (e) {
				debugger; // pause here if debugging
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
			Q.Page.onLoad('').handle();
			Q.Page.onLoad(moduleSlashAction).handle();
			if (Q.info.uriString !== moduleSlashAction) {
				Q.Page.onLoad(Q.info.uriString).handle();
			}
			Q.Page.beingLoaded = false;
		} catch (e) {
			debugger; // pause here if debugging
			Q.Page.beingLoaded = false;
			throw e;
		}
		
	}
	Q.loadNonce(readyWithNonce);
};

/**
 * This function is called by Q to make sure that we've loaded the session nonce.
 * If you like, you can also call it yourself.
 * 
 * @static
 * @method loadNonce
 * @param {Function} callback This function is called when the nonce is loaded
 * @param {Object} context The "this" to pass to the callback
 * @param {Array} args The arguments to pass to the callback
 */
Q.loadNonce = function _Q_loadNonce(callback, context, args) {
	// Q.nonce = Q.cookie('Q_nonce');
	if (Q.nonce) {
		Q.handle(callback, context, args);
		return;
	}
	Q.req('Q/nonce', 'data', function _Q_loadNonce_nonceLoaded() {
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
 * 
 * @static
 * @method beforeUnload
 * @param notice {String} The notice to set. It should typically be worded so that "Cancel" cancels the unloading.
 * @required
 */
Q.beforeUnload = function _Q_beforeUnload(notice) {
	window.onbeforeunload = function(e){
		if (!notice) return undefined;
		e = e || window.event;
		if (e) { // For IE and Firefox (prior to 4)
			e.returnValue = notice;
		}
		return notice; // For Safari and Chrome
	};
};

/**
 * Remove an element from the DOM and try to clean up memory as much as possible
 * 
 * @static
 * @method removeElement
 * @param {HTMLElement} element
 * @param {Boolean} removeTools
 */
Q.removeElement = function _Q_removeElement(element, removeTools) {
	if (removeTools) {
		Q.Tool.clear(element);
	}
	if (window.jQuery) {
		return window.jQuery(element).remove();
	}
	if (!element.parentNode) return false;
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
 * 
 * @static
 * @method addEventListener
 * @param {HTMLElement} element
 *  An HTML element, window or other element that supports listening to events
 * @param {String|Array} eventName
 *  A space-delimited string of event names
 * @param {Function} eventHandler
 *  A function to call when the event fires
 * @param {Boolean} useCapture
 *  Whether to use the capture instead of bubble phase. Ignored in IE8 and below.
 */
Q.addEventListener = function _Q_addEventListener(element, eventName, eventHandler, useCapture) {
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
			throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
		}
		eventName = params.eventName;
	}

	if (Q.typeOf(eventName) === 'array') {
		for (var i=0, l=eventName.length; i<l; ++i) {
			Q.addEventListener(element, eventName[i], eventHandler, useCapture);
		}
		return;
	}
	if (element.addEventListener) {
		element.addEventListener(eventName, handler, useCapture || false);
	} else if (element.attachEvent) {
		element.attachEvent('on'+eventName, handler);
	} else {
		element["on"+eventName] = function () {
			if (element["on"+eventName]) {
				element["on"+eventName].apply(this, arguments);
			}
			eventHandler.apply(this, arguments);
		}; // best we can do
	}
};

/**
 * Remove an event listener from an element
 * 
 * @static
 * @method removeEventListener
 * @param {HTMLElement} element
 * @param {String} eventName
 * @param {Function} eventHandler
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
		element["on"+eventName] = null; // best we can do
	}
};

/**
 * Triggers a method or Q.Event on all the tools inside a particular element
 * 
 * @static
 * @method trigger
 * @param {String} eventName  Required, the name of the method or Q.Event to trigger
 * @required
 * @param {HTMLElement} element Optional element to traverse from (defaults to document.body).
 * @param {Array} args Any additional arguments that would be passed to the triggered method or event
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
	Q.trigger('Q.onLayout', element || document.body, [element]);
	Q.onLayout.handle.call(element);
};

Q.clientId = function () {
	if (!Q.clientId.value) {
		var detected = Q.Browser.detect();
		Q.clientId.value = (detected.device || "desktop").substr(0, 4)
			+ "\t" + detected.OS.substr(0, 3)
			+ "\t" + detected.name.substr(0, 3)
			+ "\t" + detected.mainVersion + (detected.isWebView ? "n" : "w")
			+ "\t" + Math.floor(Date.now()/1000).toString(36);
	}
	return Q.clientId.value;
};

/**
 * Call this function to get an rfc4122 version 4 compliant id for the current client
 * 
 * @static
 * @method uuid
 */
Q.uuid = function () {
	// TODO: consider replacing with
	// https://github.com/broofa/node-uuid/blob/master/uuid.js
	return Q.uuid.value = Q.uuid.value || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
		return v.toString(16);
	});
};

/**
 * Returns whether Q.ready() has been called
 * 
 * @static
 * @method isReady
 * @return {Boolean}
 */
Q.isReady = function _Q_isReady() {
	return _isReady;
};

/**
 * Returns whether the client is currently connected to the 'net
 * 
 * @static
 * @method isOnline
 * @return {Boolean}
 */
Q.isOnline = function _Q_isOnline() {
	return _isOnline;
};

/**
 * Loads a plugin
 * 
 * @static
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
 * 
 * @static
 * @method url
 * @param {Object} what
 *  Usually the stuff that comes after the base URL
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} options
 *  A hash of options, including:
 *  'baseUrl': A string to replace the default base url
 *  'cacheBust': Number of milliseconds before a new cachebuster is appended
 */
Q.url = function _Q_url(what, fields, options) {
	if (fields) {
		for (var k in fields) {
			what += '?'+encodeURIComponent(k)+'='+encodeURIComponent(fields[k]);
		}
	}
	if (options && options.cacheBust) {
		what += "?Q.cacheBust="+Math.floor(Date.now()/options.cacheBust);
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
		result = baseUrl + ((what.substr(0, 1) == '/') ? '' : '/') + what;
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
 * Get the URL for an action
 * 
 * @static
 * @method action
 * @param {String} uri
 *  A string of the form "Module/action" or an absolute url, which is returned unmodified.
 * @param {Object} fields
 *  Optional fields to append to the querystring.
 *  NOTE: only handles scalar values in the object.
 * @param {Object} options
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
 * Extends a string or object to be used with AJAX
 * 
 * @static
 * @method ajaxExtend
 * @param {String} what
 *  If a string, then treats it as a URL and
 *  appends ajax fields to the end of the querystring.
 *  If an object, then adds properties to it.
 * @param {String} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object or array, converts it to a comma-separated list
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  "echo": A string to echo back. Used to keep track of responses
 *  "method": if set, adds a &Q.method=$method to the querystring
 *  "callback": if a string, adds a "&Q.callback="+encodeURIComponent(callback) to the querystring.
 *  "loadExtras": if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 *  "idPrefixes": optional array of Q_Html::pushIdPrefix values for each slotName
 *  "timestamp": whether to include a timestamp (e.g. as a cache-breaker)
 * @return {String|Object}
 *  Returns the extended string or object
 */
Q.ajaxExtend = function _Q_ajaxExtend(what, slotNames, options) {
	if (!what && what !== '') {
		if (console && ('warn' in console)) {
			console.warn('Q.ajaxExtend received empty url');
		}
		return '';
	}
	var slotNames2 = (typeof slotNames === 'string')
		? slotNames 
		: Q.extend([], slotNames).join(',');
	var idPrefixes = options
		? ((typeof options.idPrefixes === 'string')
			? options.idPrefixes 
			: (options.idPrefixes && options.idPrefixes.join(',')))
		: '';
	var timestamp = Q.microtime(true);
	if (typeof what == 'string') {
		var what2 = what;
		if (Q.info && Q.info.baseUrl === what2) {
			what2 += '/'; // otherwise we will have 301 redirect with trailing slash on most servers
		}
		what2 += (what.indexOf('?') < 0) ? '?' : '&';
		var ajax = options && options.loadExtras ? 'loadExtras' : 'json';
		what2 += encodeURI('Q.ajax='+ajax);
		if (options && options.timestamp) {
			what2 += encodeURI('&Q.timestamp=')+encodeURIComponent(timestamp);
		}
		if (slotNames2 != null) {
			what2 += encodeURI('&Q.slotNames=') + encodeURIComponent(slotNames2);
		}
		if (idPrefixes) {
			what2 += encodeURI('&Q.idPrefixes=') + encodeURIComponent(idPrefixes);
		}
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
		var what2 = {};
		for (var k in what) {
			what2[k] =  what[k];
		}
		what2.Q = { "ajax": "json" };
		if (options && options.timestamp) {
			what2.Q.timestamp = timestamp;
		}
		if (slotNames) {
			what2.slotNames = slotNames2;
		}
		if (options) {
			if (options.callback) {
				what2.Q.callback = options.callback;
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
 * The easiest way to make direct web service requests in Q
 * 
 * @static
 * @method req
 * @param {String} uri
 *  A string of the form "Module/action"
 * @param {String|Array} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an array, converts it to a comma-separated list
 * @param {Function} callback
 *  The JSON will be passed to this callback function
 * @param {Object} options
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
 * 
 * @static
 * @method request
 * @param {Object} fields
 *  Optional object of fields to pass
 * @param {String} url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param {String|Object} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object, converts it to a comma-separated list
 * @param {Function} callback
 *  The err and parsed content will be passed to this callback function,
 *  (unless parse is false, in which case the raw content is passed as a String),
 *  followed by a Boolean indicating whether a redirect was performed.
 * @param {Object} options
 *  A hash of options, including:
 *  "post": if set, adds a &Q.method=post to the querystring
 *  "method": if set, adds a &Q.method= that value to the querystring, default "get"
 *  "fields": optional fields to pass with any method other than "get"
 *  "idPrefixes": optional array of Q_Html::pushIdPrefix values for each slotName
 *  "skipNonce": if true, skips loading of the nonce
 *  "xhr": if false, avoids XHR. If true, tries to make xhr based on "method" option.
 *	 Or pass an object with properties to merge onto the xhr object, including a special "sync" property to make the call synchronous.
 *	 Or pass a function which will be run before .send() is executed. First parameter is the xhr object, second is the options.
 *  "preprocess": an optional function that takes the xhr object before the .send() is invoked on it
 *  "parse": set to false to pass the unparsed string to the callback
 *  "extend": defaults to true. If false, the URL is not extended with Q fields.
 *  "query": if true simply returns the query url without issuing the request
 *  "callbackName": if set, the URL is not extended with Q fields and the value is used to name the callback field in the request.
 *  "duplicate": defaults to true, but you can set it to false in order not to fetch the same url again
 *  "quiet": defaults to true. This option is just passed to your onLoadStart/onLoadEnd handlers in case they want to respect it.
 *  "timestamp": whether to include a timestamp (e.g. as a cache-breaker)
 *  "handleRedirects": if set and response data.redirect.url is not empty, automatically call this function. Defaults to Q.handle.
 *  "timeout": timeout to wait for response defaults to 20.5 sec. Set to false to disable
 *  "onTimeout": handler to call when timeout is reached. First argument is a function which can be called to cancel loading.
 *  "onResponse": handler to call when the response comes back but before it is processed
 *  "onProcessed": handler to call when a response was processed
 *  "onLoadStart": if "quiet" option is false, anything here will be called after the request is initiated
 *  "onLoadEnd": if "quiet" option is false, anything here will be called after the request is fully completed
 */
Q.request = function (url, slotNames, callback, options) {
	
	var fields, delim;
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
	} else if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	var o = Q.extend({}, Q.request.options, options);
	if (o.skipNonce) {
		return _Q_request_makeRequest.call(this, url, slotNames, callback, o);
	} else {
		Q.loadNonce(_Q_request_makeRequest, this, [url, slotNames, callback, o]);
	}
	function _Q_request_makeRequest (url, slotNames, callback, o) {

		var request = new Q.Request(url, slotNames, callback, o);

		var tout = false, t = {};
		if (o.timeout !== false) tout = o.timeout || 1500;
	
		function _Q_request_callback(err, content, wasJsonP) {
			if (err) {
				callback(err);
				Q.handle(o.onProcessed, Q, [err]);
				return;
			}
			var data = content;
			if (o.parse !== false) {
				try {
					if (wasJsonP) {
						data = content;
					} else {
						data = JSON.parse(content)
					}
				} catch (e) {
					console.warn('Q.request(' + url + ',['+slotNames+']):' + e);
					err = {"errors": [e]};
					callback(e, content);
					Q.handle(o.onProcessed, Q, [e, content]);
				}
			}
			var redirected = false;
			if (data && data.redirect && data.redirect.url) {
				Q.handle(o.handleRedirects, Q, [data.redirect.url]);
				redirected = true;
			}
			callback && callback.call(this, err, data, redirected);
			Q.handle(o.onProcessed, Q, [err, data, redirected]);
		};

		function _onStart () {
			Q.handle(o.onLoadStart, this, [url, slotNames, o]);
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

		function _onResponse (data, wasJsonP) {
			t.loaded = true;
			if (t.timeout) {
				clearTimeout(t.timeout);
			}
			Q.handle(o.onLoadEnd, request, [url, slotNames, o]);
			if (!t.cancelled) {
				o.onResponse.handle.call(request, data, wasJsonP);
				Q.handle(_Q_request_callback, request, [null, data, wasJsonP]);
			}
		}
		
		function _onCancel (status, msg) {
			msg = (msg || Q.text.Q.request[status] || Q.text.Q.request.error)
				.interpolate({'status': status, 'url': url})
			t.cancelled = true;
			_onResponse();
			var errors = {
				errors: [{message: msg || "Request was canceled", code: status}]
			};
			o.onCancel.handle.call(this, errors, o);
			Q.handle(_Q_request_callback, this, [errors, errors]);
		}

		if (!o.query && o.xhr !== false
		&& Q.url(url).search(Q.info.baseUrl) === 0) {
			
			function xhr(url, slotNames, onSuccess, onCancel, options) {					
				var xmlhttp;
				if (window.XMLHttpRequest) { // code for IE7+, Firefox, Chrome, Opera, Safari
					xmlhttp = new XMLHttpRequest();
				} else { // code for IE6, IE5
					xmlhttp = new window.ActiveXObject("Microsoft.XMLHTTP");
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
				};
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
				request.xmlhttp = xmlhttp;
				if (verb === 'GET') {
					xmlhttp.open('GET', url + (content ? '&' + content : ''), !sync);
					xmlhttp.send();
				} else {
					xmlhttp.open(verb, url, !sync);
					xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					//xmlhttp.setRequestHeader("Content-length", content.length);
					//xmlhttp.setRequestHeader("Connection", "close");
					xmlhttp.send(content);
				}
			}

			_onStart();
			return xhr(url, slotNames, _onResponse, _onCancel, o);
		}

		var i = Q.request.callbacks.length;
		var url2 = url;
		if (callback) {
			Q.request.callbacks[i] = function _Q_request_JSONP(data) {
				delete Q.request.callbacks[i];
				Q.removeElement(script);
				_onResponse(data, true);
			};
			if (o.callbackName) {
				url2 = url + (url.indexOf('?') < 0 ? '?' : '&')
					+ encodeURIComponent(o.callbackName) + '='
					+ encodeURIComponent('Q.request.callbacks['+i+']');
			} else {
				url2 = (o.extend === false)
					? url
					: Q.ajaxExtend(url, slotNames, Q.extend(o, {
						callback: 'Q.request.callbacks['+i+']'
					}));
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
 * 
 * @static
 * @method firstErrorMessage
 * @param {Object} data an object where the errors may be found, you can pass as many of these as you want
 * @return {String|null} The first error message found, or null
 */
Q.firstErrorMessage = function _Q_firstErrorMessage(data /*, data2, ... */) {
	var error = null;
	for (var i=0; i<arguments.length; ++i) {
		var d = arguments[i];
		if (Q.isEmpty(d)) {
			continue;
		}
		if (d.errors && d.errors[0]) {
			error = d.errors[0];
		} else if (d.error) {
			error = d.error;
		} else if (Q.typeOf(d) === 'array') {
			error = d[0];
		} else {
			error = d;
		}
		if (error) {
			break;
		}
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
 * 
 * @static
 * @method ajaxErrors
 * @param {Object} errors
 *  A hash of errors
 * @param {Array} fields
 *  Optional. An array of field names to restrict ourselves to.
 *  For each error, if none of the fields apply, then the error
 *  is assigned to the field named first in this array.
 * @return {Object}
 */
Q.ajaxErrors = function _Q_ajaxErrors(errors, fields) {
	var result = {};
	var e, f, i, j;
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
 * @private
 * 
 * @static
 * @method jsonRequest
 * @param {Object} fields
 *  Optional object of fields to pass
 * @param {String} url
 *  The URL you pass will normally be automatically extended through Q.ajaxExtend
 * @param {String|Object} slotNames
 *  If a string, expects a comma-separated list of slot names
 *  If an object, converts it to a comma-separated list
 * @param {Function} callback
 *  The JSON will be passed to this callback function
 * @param {Object} options
 *  A hash of options, to be passed to Q.request
 */
Q.jsonRequest = Q.request;

/**
 * Serialize an object of fields into a shallow object of key/value pairs
 * @private
 * 
 * @static
 * @method serializeFields
 * @param {Object} fields
 *  The object to serialize
 * @param {Array} keys
 *  An optional array of keys into the object, in the order to serialize things
 * @return {Object}
 *  A shallow object of key/value pairs
 */
Q.serializeFields = function _Q_serializeFields(fields, keys) {
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
		if (value == undefined) return;
		// If value is a function, invoke it and return its value
		value = Q.typeOf(value) === "function" ? value() : value;
		parts.push(encodeURIComponent(key) + "=" + encodeURIComponent(value));
	}

	if (keys) {
		Q.each(keys, function _Q_param_each(i, field) {
			_params(field, fields[field]);
		});
	} else {
		Q.each(fields, function _Q_param_each(field, value) {
			_params(field, value);
		});
	}

	// Return the resulting serialization
	return parts.join("&").replace(/%20/g, "+");
};

/**
 * Uses a form to do a real POST, but doesn't have a callback
 * Useful for convincing Safari to stop blocking third-party cookies
 * Technically we could use AJAX and CORS instead, and then we could have a callback.
 * 
 * @static
 * @method formPost
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
 * 
 * @static
 * @method addScript
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

	function stateChangeInIE() { // function to watch scripts load in IE
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
		var cb;
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
	
	var p, ret = [];
	if (!onload) {
		onload = function () {};
	}
	
	if (Q.typeOf(src) === 'array') {
		var srcs = [];
		Q.each(src, function (i, src) {
			if (!src) return;
			srcs.push((src && src.src) ? src.src : src);
		});
		if (Q.isEmpty(srcs)) {
			onload();
			return [];
		}
		p = new Q.Pipe(srcs, onload);
		Q.each(srcs, function (i, src) {
			ret.push(Q.addScript(src, p.fill(src), options));
		});
		return ret;
	}

	var o = Q.extend({}, Q.addScript.options, options),
		firstScript = document.scripts ? document.scripts[0] : document.getElementsByTagName('script')[0],
		container = o.container || document.head  || document.getElementsByTagName('head')[0];
		
	if (!onload) {
		onload = function() { };
	}
	
	var script, i;
	_onload.loaded = {};
	src = (src && src.src) ? src.src : src;
	if (!src) {
		return null;
	}
	src = Q.url(src);
	
	if (!o || !o.duplicate) {
		var scripts = document.getElementsByTagName('script');
		for (i=0; i<scripts.length; ++i) {
			script = scripts[i];
			if (script.getAttribute('src') !== src) {
				continue;
			}
			// move the element to the right container if necessary
			// hopefully, moving the script element won't change the order of execution
			p = scripts[i];
			var outside = true;
	    	while (p = p.parentNode) {
				if (p === container) {
					outside = false;
    				break;
				}
			}
			if (outside) {
				container.appendChild(script);
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
					o.onError.call(script);
				}
				return o.returnAll ? script : false;
			}
			if (!Q.addScript.added[src]
			&& (!('readyState' in script)
			|| (script.readyState !== 'complete'
			|| script.readyState !== 'loaded'))) {
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
	script = document.createElement('script');
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
 * 
 * @static
 * @method addStylesheet
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
	if (typeof media === 'function') {
		onload = media; media = undefined;
	}
	if (!onload) {
		onload = function _onload() { };
	}
	if (Q.typeOf(href) === 'array') {
		var ret = [];
		var len = href.length;
		for (i=0; i<len; ++i) {
			ret.push(Q.addStylesheet(
				href[i].href || href[i],
				href[i].media
			));
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
		links = document.getElementsByTagName('link');
		for (var j=0; j<links.length; ++j) {
			if (links[j].href !== href) continue;
			links[j].onload = onload2;
			links[j].onreadystatechange = onload2; // for IE6
			break;
		}
		return options.returnAll ? links[i] : false; // don't add
	}

	function onload2() {
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
 * 
 * @static
 * @method cookie
 * @param {String} name
 *   The name of the cookie
 * @param {Mixed} value
 *   Optional. If passed, this is the new value of the cookie.
 *   If null is passed here, the cookie is "deleted".
 * @param {Object} options
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
 * @static
 * @method find
 * @param {HTMLElement|Array} elem
 *  An element, or an array of elements, within which to search
 * @param {String|RegExp|true|null} filter
 *  The name of the class or attribute to match
 * @param {Function} callbackBefore
 *  A function to run when a match is found (before the children).
 *  If it returns true, the Q.find function doesn't search further inside that element.
 *  If it returns false, the Q.find function stops searching.
 *  Otherwise, the Q.find function continues to search inside the element.
 * @param {Function} callbackAfter
 *  A function to run when a match is found (after the children)
 *  If it returns false, the Q.find function stops searching.
 * @param {Object} options
 *  Any options to pass to the callbacks as the second argument
 * @param {Mixed} shared
 *  An optional object that will be passed to each callbackBefore and callbackAfter
 */
Q.find = function _Q_find(elem, filter, callbackBefore, callbackAfter, options, shared, parent, index) {
	var i;
	if (!elem) {
		return;
	}
	if (filter === true) {
		filter = 'q_tool';
	}
	// Arrays are accepted
	if (Q.typeOf(elem) === 'array'
	|| (typeof HTMLCollection !== 'undefined' && (elem instanceof window.HTMLCollection))
	|| (window.jQuery && (elem instanceof jQuery))) {

		Q.each(elem, function _Q_find_array(i) {
			if (false === Q.find(
				this, filter, callbackBefore, callbackAfter, 
				options, shared, parent, i
			)) {
				return false;
			}
		});
		return;
	}
	// Do a depth-first search and call the constructors
	var found = (filter === null);
	if (!found && ('className' in elem) && typeof elem.className === "string" && elem.className) {
		var classNames = elem.className.split(' ');
		for (i=classNames.length-1; i>=0; --i) {
			var className = Q.normalize(classNames[i]);
			if (((typeof filter === 'string') && (filter === className))
			|| ((filter instanceof RegExp) && filter.test(className))
			|| ((typeof filter === 'function' && filter(className)))) {
				found = true;
				break;
			}
		}
	}
	if (!found && elem.attributes) {
		for (i=elem.attributes.length-1; i>=0; --i) {
			var attribute = elem.attributes[i].name;
			if (((typeof filter === 'string') && (filter === attribute))
			|| ((filter instanceof RegExp) && filter.test(attribute))
			|| ((typeof filter === 'function' && filter(attribute)))) {
				found = true;
				break;
			}
		}
	}
	var ret;
	if (found && typeof callbackBefore == 'function') {
		ret = callbackBefore(elem, options, shared, parent, index);
		if (ret === false) {
			return false;
		}
	}
	if (ret !== true) {
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
		ret = Q.find(c, filter, callbackBefore, callbackAfter, options, shared, elem);
		if (ret === false) {
			return false;
		}
	}
	if (found && typeof callbackAfter  == 'function') {
		if (false === callbackAfter(elem, options, shared, parent, index)) {
			return false;
		}
	}
};

/**
 * Unleash this on an element to activate all the tools within it.
 * If the element is itself an outer div of a tool, that tool is activated too.
 * 
 * @static
 * @method activate
 * @param {HTMLElement|Q.Tool} elem
 *  HTML element or existing tool to traverse and activate
 *  If this is empty, then Q.activate exits early
 * @param {Object} options
 *  Optional options to provide to tools and their children.
 * @param {Function|Q.Event} callback
 *  This will get called when the content has been completely activated.
 *  That is, after all the files, if any, have been loaded and all the
 *  constructors have run.
 *  It receives (elem, options, tools) as arguments, and the last tool to be
 *  activated as "this".
 *  @optional
 */
Q.activate = function _Q_activate(elem, options, callback) {
	
	if (!elem) {
		return;
	}
	
	var ba, tool;
	if (Q.typeOf(elem) === 'Q.Tool') {
		tool = elem;
		ba = Q.Tool.beingActivated;
		Q.Tool.beingActivated = tool;
		elem = tool.element;
	}
	
	Q.beforeActivate.handle.call(window, elem); // things to do before things are activated
	
	var shared = {
		tool: null,
		tools: {},
		waitingForTools: [],
		pipe: Q.pipe()
	};
	if (typeof options === 'function') {
		callback = options;
		options = undefined;
	}
	Q.find(elem, true, _activateTools, _initTools, options, shared);
	shared.pipe.add(shared.waitingForTools, 1, _activated)
		.run();
	
	Q.Tool.beingActivated = ba;
	
	function _activated() {
		var tool = shared.firstTool || shared.tool;
		Q.trigger('Q.onLayout', elem, []);
		if (callback) {
			Q.handle(callback, tool, [elem, options, shared.tools]);
		}
		Q.handle(Q.onActivate, tool, [elem, options, shared.tools]);
	}
};

/**
 * Replaces the contents of an element and does the right thing with all the tools in it
 * 
 * @static
 * @method replace
 * @param {HTMLElement} container
 *  A existing HTMLElement whose contents are to be replaced with the source
 *  Tools found in the existing DOM which have data-Q-retain attribute
 *  are actually retained unless the tool replacing them has a data-Q-replace attribute.
 *  You can update the tool by implementing a handler for
 *  tool.Q.onRetain, which receives the old Q.Tool object and the new options.
 *  After the event is handled, the tool's state will be extended with these new options.
 * @param {Element|String} source
 *  An HTML string or a Element which is not part of the DOM
 * @param {Object} options
 *  Optional. A hash of options, including:
 *  "replaceElements": array of elements or ids of elements in the document to replace, even if they have "data-q-retain" attributes.
 *  "animation": To animate the transition, pass an object here with optional "duration", "ease" and "callback" properties.
 * @return {HTMLElement}
 *  Returns the container element if successful
 */
Q.replace = function _Q_replace(container, source, options) {
	if (!source) {
		Q.Tool.clear(container); // Remove all the tools remaining in the container, with their events etc.
		container.innerHTML = '';
		return container;
	}
	options = Q.extend({}, Q.replace.options, options);
	if (Q.typeOf(source) === 'string') {
		var s = document.createElement('div'); // temporary container
		s.innerHTML = source;
		source = s;
	}
	
	var replaceElements;
	if (options.replaceElements) {
		replaceElements = [];
		Q.each(options.replaceElements, function (i, e) {
			replaceElements.push(
				typeof e === 'string' ? document.getElementById(e) : e
			);
		});
	}
	
	var retainedToolsArray = [];
	var newOptionsArray = [];
	Q.find(source, null, function (incomingElement) {
		var element = document.getElementById(incomingElement.id);
		if (element && element.getAttribute('data-Q-retain') !== null
		&& !incomingElement.getAttribute('data-Q-replace') !== null) {
			// If a tool exists with this exact id and has "data-Q-retain",
			// then re-use it and all its HTML elements, unless
			// the new tool HTML has data-Q-replace.
			// This way tools can avoid doing expensive operations each time
			// they are replaced and reactivated.
			incomingElement.parentNode.replaceChild(element, incomingElement);
			for (var name in element.Q.tools) {
				var tool = Q.Tool.from(element, name);
				var attrName = 'data-' + Q.normalize(tool.name, '-');
				var newOptionsString = incomingElement.getAttribute(attrName);
				var newOptions = JSON.parse(newOptionsString);
				element.setAttribute(attrName, newOptionsString);
				retainedToolsArray.push(tool);
				newOptionsArray.push(newOptions);
			}
		}
	});
	
	Q.beforeReplace.handle(container, source, options, newOptionsArray);
	
	Q.Tool.clear(container); // Remove all the tools remaining in the container, with their events etc.
	container.innerHTML = ''; // Clear the container
	
	// Move the actual nodes from the source to existing container
	var c;
	while (c = source.childNodes[0]) {
		container.appendChild(c);
	}
	
	for (var i=0, l=retainedToolsArray.length; i<l; ++i) {
		var tool = retainedToolsArray[i];
		var newOptions = newOptionsArray[i];
		// The tool's constructor not will be called again with the new options.
		// Instead, implement Q.onRetain, from the tool we decided to retain.
		// The Q.Tool object still contains all its old properties, options, state.
		// Its element still contains DOM elements, 
		// attached jQuery data and events, and more.
		// However, the element's data-TOOL-NAME attribute now contains
		// the new options.
		Q.handle(tool.Q.onRetain, tool, [newOptions]);
		Q.extend(tool.state, 10, newOptions);
	}
	
	return container;
};

var _latestLoadUrlObject;

/**
 * 
 * @static
 * @method loadUrl
 * @param {String} url
 * @param {Array|String} slotNames Optional, defaults to all application slots
 * @param {Function} callback Callback which is called when response returned and scripts,
 * stylesheets and inline styles added, but before inline scripts executed.
 * Receives response as its first agrument. May return DOM element or array of them which need to be Q.activate'ed.
 * By default place slot content to DOM element with id "{slotName}_slot"
 * @param {Object} options Optional.
 * An hash of options to pass to the loader, and can also include options for loadUrl itself:
 *   "loader": the actual function to load the URL, defaults to Q.request. See Q.request documentation for more options.
 *   "handler": the function to handle the returned data. Defaults to a function that fills the corresponding slot containers correctly.
 *   "ignoreHistory": if true, does not push the url onto the history stack
 *   "ignorePage": if true, does not process the links / stylesheets / script data in the response,
 *      and doesn't trigger deactivation of current page and activation of the new page
 *   "ignoreLoadingErrors": If true, ignores any errors in loading scripts.
 *   "ignoreHash": if true, does not navigate to the hash part of the URL in browsers that can support it
 *   "fields": additional fields to pass via the querystring
 *   "loadExtras": if true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 *   "timeout": timeout to wait for response defaults to 20.5 sec. Set to false to disable
 *   "quiet": defaults to false. If true, allows visual indications that the request is going to take place.
 *   "slotNames": an array of slot names to request and process (default is all slots in Q.info.slotNames)
 *   "idPrefixes": optional array of Q_Html::pushIdPrefix values for each slotName
 *   "retainSlots": an object of {slotName: whetherToRetain} pairs, retained slots aren't requested
 *   "slotContainer": optional function taking (slotName, response) and returning the element, if any, to fill for that slot
 *   "replaceElements": array of elements or ids of elements in the document to replace. Overrides "data-q-retain" attributes but not retainSlots option.
 *   "onTimeout": handler to call when timeout is reached. Receives function as argument -
 *		the function might be called to cancel loading.
 *   "onResponse": handler to call when the response comes back but before it is processed
 *   "onError": event for when an error occurs, by default shows an alert
 *   "onLoad": event which occurs when the parsed data comes back from the server
 *   "onActivate": event which occurs when all Q.activate's processed and all script lines executed
 *   "onLoadStart": if "quiet" option is false, anything here will be called after the request is initiated
 *   "onLoadEnd": if "quiet" option is false, anything here will be called after the request is fully completed
 * See Q.request for more info.
 * Also it is passed to loader function so any additional options can be passed
 */
Q.loadUrl = function _Q_loadUrl(url, options) {
	var o = Q.extend({}, Q.loadUrl.options, options);
	Q.handle(o.onLoadStart, this, [url, o]);

	var handler = o.handler;
	var slotNames = o.slotNames;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	if (o.retainSlots) {
		var arr = [], i, l = slotNames.length;
		for (i=0; i<l; ++i) {
			var slotName = slotNames[i];
			if (!o.retainSlots[slotName]
			|| !Q.loadUrl.retainedSlots[slotName]) {
				arr.push(slotName);
			}
		}
		slotNames = arr;
	}

	var parts = url.split('#');
	var hashUrl = parts[1] ? parts[1].queryField('url') : undefined;
	url = (hashUrl !== undefined) ? hashUrl : parts[0];

	var loader = Q.request;
	var onActivate;
	if (o.loader) {
		loader = o.loader;
	}
	if (o.onError) {
		onError = o.onError;
	}
	if (o.onActivate) {
		onActivate = o.onActivate;
	}
	var _loadUrlObject = _latestLoadUrlObject = {};
	loader(url, slotNames, loadResponse, o);

	function loadResponse(err, response, redirected) {
		if (_loadUrlObject != _latestLoadUrlObject) {
			return; // a newer request was sent
		}
		if (err) {
			return Q.handle(onError, this, [Q.firstErrorMessage(err)]);
		}
		if (!response) {
			return Q.handle(onError, this, ["Response is empty", response]);
		}
		if (response.errors) {
			return Q.handle(onError, this, [response.errors[0].message]);
		}
		Q.handle(o.onLoad, this, [response]);
		
		if (redirected) {
			return;
		}
		
		loadTemplates();
		var newScripts;
		
		if (o.ignorePage) {
			newScripts = [];
			afterScripts();
		} else {
			newScripts = loadScripts(afterScripts);
		}
		
		function afterScripts () {
			
			// WARNING: This function may not be called if one of the scripts is missing or returns an error
			// So the existing page will not be unloaded and the new page will not be loaded, in this case,
			// but some of the new scripts will be added.

			var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // old page going out
			var i, newStylesheets, newStyles;
			
			function _doEvents(prefix, moduleSlashAction) {
				var event, f = Q.Page[prefix+'Unload'];
				Q.handle(o.onLoadEnd, this, [url, o]);
				if (Q.info && Q.info.uri) {
					event = f("Q\t"+moduleSlashAction);
					event.handle(url, o);
					event.removeAllHandlers();
					event = f(moduleSlashAction);
					event.handle(url, o);
					if (Q.info.uriString !== moduleSlashAction) {
						event = f("Q\t"+Q.info.uriString);
						event.handle(url, o);
						event.removeAllHandlers();
						event = f(Q.info.uriString);
						event.handle(url, o);
					}
				}
				event = f("Q\t");
				event.handle(url, o);
				event.removeAllHandlers();
				event = f('');
				event.handle(url, o);
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
				if (!o.ignorePage) {
					try {
						Q.Page.beingActivated = true;
						Q.Page.onActivate('').handle(url, o);
						if (Q.info && Q.info.uri) {
							var moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action;
							Q.Page.onActivate(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onActivate(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingActivated = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingActivated = false;
						throw e;
					}
				}
				// Invoke prefixfree again if it was loaded
				if (window.StyleFix) {
					window.StyleFix.process();
				}

				Q.handle(onActivate, this, [domElements]);
			}
			
			function afterStyles() {
			
				if (!o.ignorePage && Q.info && Q.info.uri) {
					Q.Page.beforeLoad(moduleSlashAction).occurred = false;
					Q.Page.onLoad(moduleSlashAction).occurred = false;
					Q.Page.onActivate(moduleSlashAction).occurred = false;
					if (Q.info.uriString !== Q.moduleSlashAction) {
						Q.Page.beforeLoad(Q.info.uriString).occurred = false;
						Q.Page.onLoad(Q.info.uriString).occurred = false;
						Q.Page.onActivate(Q.info.uriString).occurred = false;
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

				if (!o.ignorePage) {
					try {
						Q.Page.beingLoaded = true;
						Q.Page.onLoad('').handle(url, o);
						if (Q.info && Q.info.uri) {
							moduleSlashAction = Q.info.uri.module+"/"+Q.info.uri.action; // new page coming in
							Q.Page.onLoad(moduleSlashAction).handle(url, o);
							if (Q.info.uriString !== moduleSlashAction) {
								Q.Page.onLoad(Q.info.uriString).handle(url, o);
							}
						}
						Q.Page.beingLoaded = false;
					} catch (e) {
						debugger; // pause here if debugging
						Q.Page.beingLoaded = false;
						throw e;
					}
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

			if (!o.ignorePage) {
				_doEvents('before', moduleSlashAction);
				while (Q.Event.forPage && Q.Event.forPage.length) {
					// keep removing the first element of the array until it is empty
					Q.Event.forPage[0].remove(true);
				}
				var p = Q.Event.jQueryForPage;
				for (i=p.length-1; i >= 0; --i) {
					var off = p[i][0];
					window.jQuery.fn[off].call(p[i][1], p[i][2], p[i][3]);
				}
				Q.Event.jQueryForPage = [];
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
							location.hash.replace(/#!url=[^&]*/, '')
								.replace(/&!url=[^&]*/, '')
								.replace(/&column=[^&]+/, '')
								.replace(/#column=[^&]+/, '');
						if (parts[1]) {
							hash += ('&'+parts[1])
								.replace(/&!url=[^&]*/, '')
								.replace(/&column=[^&]+/, '');
						}
						if (location.hash !== hash) {
							Q_hashChangeHandler.ignore = true;
							location.hash = hash;
						}
					}
				}
			}
			
			if (!o.ignorePage) {
				// Remove various elements belonging to the slots that are being reloaded
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
			}
			
			var domElements = handler(response, url, o); // this is where we fill all the slots
			if (!o.ignorePage) {
				_doEvents('on', moduleSlashAction);
				newStylesheets = loadStylesheets();
				newStyles = loadStyles();
			}
			
			afterStyles(); // Synchronous to allow additional scripts to change the styles before allowing the browser reflow.
			
			if (!o.ignoreHash && parts[1] && history.pushState) {
				var e = document.getElementById(parts[1]);
				if (e) {
					location.hash = parts[1];
					history.back();
					// todo: modify history successfully somehow
					// history.replaceState({}, null, url + '#' + parts[1]);
				}
			}
		}
		
		function loadStylesheets() {
			if (!response.stylesheets) {
				return null;
			}
			var newStylesheets = {};
			var keys = Object.keys(response.stylesheets);
			if (response.stylesheets[""]) {
				keys.splice(keys.indexOf(""), 1);
				keys.unshift("");
			}
			Q.each(keys, function (i, slotName) {
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
			});
			return newStylesheets;
		}
		
		function loadStyles() {
			if (!response.stylesInline) {
				return null;
			}
			var newStyles = {},
				head = document.head || document.getElementsByTagName('head')[0];
			var keys = Object.keys(response.stylesInline);
			if (response.stylesInline[""]) {
				keys.splice(keys.indexOf(""), 1);
				keys.unshift("");
			}
			Q.each(keys, function (i, slotName) {
				var styles = response.stylesInline[slotName];
				if (!styles) return;
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
			});
			return newStyles;
		}
		
		function loadTemplates() {
			if (!response.templates) {
				return null;
			}
			var slotName, newTemplates = {};
			for (slotName in response.templates) {
				newTemplates[slotName] = [];
				Q.each(response.templates[slotName], function (i) {
					newTemplates[slotName].push(
						Q.Template.set(this.name, this.content, this.type)
					);
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
			var newScripts = {};
			var keys = Object.keys(response.scripts);
			if (response.scripts[""]) {
				keys.splice(keys.indexOf(""), 1);
				keys.unshift("");
			}
			Q.each(keys, function (i, slotName) {
				var elem = Q.addScript(response.scripts[slotName], slotPipe.fill(slotName), {
					ignoreLoadingErrors: (o.ignoreLoadingErrors !== undefined) ? o.ignoreLoadingErrors : undefined,
					returnAll: false
				});
				if (elem) {
					newScripts[slotName] = elem;
				}
			});
			return newScripts;
		}
	}
};

Q.loadUrl.retainedSlots = {};

Q.loadUrl.saveScroll = function _Q_loadUrl_saveScroll (url) {
	var slotNames = Q.info.slotNames, l, elem, i;
	if (typeof slotNames === 'string') {
		slotNames = slotNames.split(',');
	}
	l = slotNames.length;
	for (i=0; i<l; ++i) {
		if ((elem = document.getElementById(slotNames[i] + "_slot"))
		&& ('scrollLeft' in elem)) {
			Q.setObject(['Q', 'scroll', url], {
				left: elem.scrollLeft,
				top: elem.scrollTop
			}, elem);
		}
	}
};

/**
 * Used for handling callbacks, whether they come as functions,
 * strings referring to functions (if evaluated), arrays or hashes.
 * 
 * @static
 * @method handle
 * @param {Mixed} callables
 *  The callables to call
 *  Can be a function, array of functions, object of functions, Q.Event or URL
 *  If it is a url, simply follow it with options, callback
 * @param {Function} callback
 *  You can pass a function here if callables is a URL
 * @param {Object} context
 *  The context in which to call them
 * @param {Array} args
 *  An array of arguments to pass to them
 * @param {Object} options
 *  If callables is a url, these are the options to pass to Q.loadUrl, if any. Also can include:
 *  "dontReload": defaults to false. If this is true and callback is a url matching current url, it is not reloaded
 *  "loadUsingAjax": defaults to false. If this is true and callback is a url, it is loaded using Q.loadUrl
 *  "externalLoader": when using loadUsingAjax, you can set this to a function to suppress loading of external websites with Q.handle
 *	Note: this will still not supress loading of external websites done with other means, such as window.location
 *  'fields': optional fields to pass with any method other than "get"
 *  'callback': if a string, adds a '&Q.callback='+encodeURIComponent(callback) to the querystring. If a function, this is the callback.
 *  'loadExtras': defaults to true. If true, asks the server to load the extra scripts, stylesheets, etc. that are loaded on first page load
 *  "target": the name of a window or iframe to use as the target. In this case callables is treated as a url.
 *  "slotNames": a comma-separated list of slot names, or an array of slot names
 *  "quiet": defaults to false. If true, allows visual indications that the request is going to take place.
 * @return {Number}
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
			return callables.handle.apply(context, args);
		case 'object':
			for (k in callables) {
				result = Q.handle(callables[k], context, args);
				if (result === false) return false;
				count += result;
			}
			return count;
		case 'string':
			var o = Q.extend({}, Q.handle.options, options);
			if (!callables.isUrl()
			&& (callables[0] != '#')
			&& (!o.target || o.target.toLowerCase() === '_self')) {
				// Assume this is not a URL.
				// Try to evaluate the expression, and execute the resulting function
				var c = Q.getObject(callables, context) || Q.getObject(callables);
				return Q.handle(c, context, args);
			}
			// Assume callables is a URL
			if (o.dontReload && Q.info && Q.info.url === callables) {
				return 0;
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
			var sameDomain = callables.sameDomain(Q.info.baseUrl);
			if (callables[0] === '#') {
				window.location.hash = callables;
			} else if (o.loadUsingAjax && sameDomain
			&& (!o.target || o.target === true || o.target === '_self')) {
				if (callables.search(Q.info.baseUrl) === 0) {
					// Use AJAX to refresh the page whenever the request is for a local page
					Q.loadUrl(callables, Q.extend({
						loadExtras: true,
						ignoreHistory: false,
						onActivate: function () {
							if (callback) callback();
						}
					}, o));
				} else if (o.externalLoader) {
					o.externalLoader.apply(this, arguments);
				} else {
					window.location = callables;
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
Q.handle.onUrl = new Q.Event(function () {
	var elements = document.getElementsByClassName('Q_error_message');
	Q.each(elements, function () {
		Q.removeElement(this);
	});
	Q.Pointer.stopHint();
}, "Q");

/**
 * Parses a querystring
 * 
 * @static
 * @method parseQueryString
 * @param {String} queryString  The string to parse
 * @param {Array} keys  Optional array onto which the keys are pushed
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
 * 
 * @static
 * @method buildQueryString
 * @param from {Object} An object containing {key: value} pairs
 * @param keys {Array} An array of keys in the object, in the order in which the querystring should be built
 * @return {String} the resulting querystring
 */
Q.buildQueryString = Q.serializeFields;

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
 * @private
 * @static
 * @method _activateTools
 * @param {ToolElement} toolElement
 *  A tool's generated container div.
 * @param {Object} options
 *  Options that should be passed onto the tool
 * @param {Mixed} shared
 *  A shared pipe which we can use to fill
 */
function _activateTools(toolElement, options, shared) {
	var pendingParentEvent = _pendingParentStack[_pendingParentStack.length-1];
	var pendingCurrentEvent = new Q.Event();
	_pendingParentStack.push(pendingCurrentEvent); // wait for construct of parent tool
	_loadToolScript(toolElement,
	function _activateTools_doConstruct(toolElement, toolFunc, toolName, uniqueToolId) {
		if (!toolFunc.toolConstructor) {
			toolFunc.toolConstructor = function Q_Tool(element, options) {
				// support re-entrancy of Q.activate
				var tool = Q.getObject(['Q', 'tools', toolName], element);
				if (this.activated || tool) {
					tool = tool || this;
					return _activateTools.alreadyActivated;
				}
				this.activated = false;
				this.initialized = false;
				try {
					this.options = Q.extend({}, Q.Tool.options.levels, toolFunc.options, Q.Tool.options.levels, options);
					this.name = toolName;
					Q.Tool.call(this, element, options);
					this.state = Q.copy(this.options, toolFunc.stateKeys);
					var prevTool = Q.Tool.beingActivated;
					Q.Tool.beingActivated = this;
					// Trigger events in some global event factories
					var normalizedName = Q.normalize(this.name);
					var normalizedId = Q.normalize(this.id);
					_constructToolHandlers[""] &&
					_constructToolHandlers[""].handle.call(this, this.options);
					_constructToolHandlers[normalizedName] &&
					_constructToolHandlers[normalizedName].handle.call(this, this.options);
					_constructToolHandlers["id:"+normalizedId] &&
					_constructToolHandlers["id:"+normalizedId].handle.call(this, this.options);
					toolFunc.call(this, this.options);
					_activateToolHandlers[""] &&
					_activateToolHandlers[""].handle.call(this, this.options);
					_activateToolHandlers[normalizedName] &&
					_activateToolHandlers[normalizedName].handle.call(this, this.options);
					_activateToolHandlers["id:"+normalizedId] &&
					_activateToolHandlers["id:"+normalizedId].handle.call(this, this.options);
					Q.Tool.beingActivated = prevTool;
				} catch (e) {
					debugger; // pause here if debugging
					console.warn(e);
					Q.Tool.beingActivated = prevTool;
					throw e;
				}
				this.activated = true;
			};
			Q.mixin(toolFunc, Q.Tool);
			Q.mixin(toolFunc.toolConstructor, toolFunc);
		}
		var key;
		if (pendingParentEvent) {
			key = pendingParentEvent.add(_reallyConstruct, null);
		} else {
			_reallyConstruct();
		}
		function _reallyConstruct() {
			var result = new toolFunc.toolConstructor(toolElement, options);
			var tool = Q.getObject(['Q', 'tools', toolName], toolElement);
			shared.tools[tool.id] = shared.tool = tool;
			
			if (result !== _activateTools.alreadyActivated) {
				// recursively activate whatever was inside,
				// handle _initTools events, etc.
				
				// TODO: make a mechanism for the tools
				// to tell Q to go deeper inside, and otherwise
				// we can skip the subtree on every Q.activate
				// when it hits an element where no tool on that
				// element said to go deeper. Which also means
				// no child tools will be activated, so nothing
				// was added to waitForIdNames and the tool will
				// be initialized without waiting for any child tools.
				// tool.element.Q.supportsChildren = true
				// set by tool.supportsChildren(true)
				Q.activate(toolElement);
			}
			
			if (uniqueToolId) {
				if (uniqueToolId === shared.firstToolId) {
					shared.firstTool = tool;
				}
				shared.pipe.fill(uniqueToolId)();
			}
			pendingCurrentEvent.handle.call(result, options);
			pendingCurrentEvent.removeAllHandlers();
		}
	}, shared);
	_waitingParentStack.push(new Q.Pipe()); // wait for init of child tools
}

_activateTools.alreadyActivated = {};

/**
 * Calls the init method of a tool. Used internally.
 * @private
 * @static
 * @method _initTools
 * @param {ToolElement} toolElement
 *  A tool's generated container div
 */
function _initTools(toolElement) {
	
	function _handleInit() {
		var tn, tool, normalizedName, normalizedId;
		var tools = toolElement.Q.tools;
		for (tn in tools) {
			tool = tools[tn];
			normalizedName = Q.normalize(tn);
			normalizedId = Q.normalize(tool.id);
			if (!tool.initialized) {
				tool.initialized = true;
				Q.handle(tool.Q && tool.Q.onInit, tool, tool.options);
				_initToolHandlers[""] &&
				_initToolHandlers[""].handle.call(tool, tool.options);
				_initToolHandlers[normalizedName] &&
				_initToolHandlers[normalizedName].handle.call(tool, tool.options);
				_initToolHandlers["id:"+normalizedId] &&
				_initToolHandlers["id:"+normalizedId].handle.call(tool, tool.options);
			}
			if (parentPipe) {
				parentPipe.fill(normalizedId+"\t"+normalizedName).call(tool, tool.options);
			}
		}
	}
	
	_pendingParentStack.pop();
	
	var currentPipe = _waitingParentStack.pop();
	var parentPipe = _waitingParentStack.length
		? _waitingParentStack[_waitingParentStack.length-1]
		: null;
	
	_loadToolScript(toolElement, function () {
		var wfin = currentPipe.waitForIdNames;
		if (wfin) {
			currentPipe.add(wfin, 1, _handleInit).run();
		} else {
			_handleInit(); // just a slight optimization
		}
	}, null, parentPipe);
}

/**
 * Given a hash of values, returns the hostname and port for connecting to PHP server running Q
 * 
 * @static
 * @method baseUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} Something of the form "scheme://hostname:port" or "scheme://hostname:port/subpath"
 */
Q.baseUrl = function _Q_host(where) {
	var result, i;
	for (i=0; i<Q.baseUrl.routers.length; ++i) {
		if (result = Q.baseUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.baseUrl; // By default, return the base url of the app
};
Q.baseUrl.routers = []; // functions returning a custom url

/**
 * Given an index and field values, returns the hostname and port for connecting to a Node.js server running Q
 * 
 * @static
 * @method nodeUrl
 * @param {Object} where
 *  An object of field: value pairs
 * @return {String} "scheme://hostname:port"
 */
Q.nodeUrl = function _Q_node(where) {
	var result, i;
	for (i=0; i<Q.nodeUrl.routers.length; ++i) {
		if (result = Q.nodeUrl.routers[i](where)) {
			return result;
		}
	}
	return Q.info.socketUrl;
};
Q.nodeUrl.routers = []; // functions returning a custom url

/**
 * Module for templates functionality
 * @class Q.Template
 * @constructor
 */
Q.Template = function () {

};

Q.Template.collection = {};


/**
 * Sets the content of a template in the document's collection.
 * This is usually called by Q.loadUrl when the server sends over some templates,
 * so they won't have to be requested later.
 * 
 * @static
 * @method set
 * @param {String} name The template's name under which it will be found
 * @param {String} content The content of the template that will be processed by the template engine
 * @param {String} type The type of template. Defaults to "handlebars"
 */
Q.Template.set = function (name, content, type) {
	type = type || 'handlebars';
	Q.Template.collection[Q.normalize(name)] = content;
};

/**
 * Removes a template that may have been set before
 * 
 * @static
 * @method remove
 * @param {String} name The template's name under which it will be found
 */
Q.Template.remove = function (name) {
	if (typeof name === 'string') {
		delete Q.Template.collection[Q.normalize(name)];
		Q.Template.load.cache.each([name], function (key) {
			Q.Template.load.cache.remove(key);
		});
		return;
	}
	Q.each(name, function (i, name) {
		Q.Template.remove(name);
	});
};

/**
 * Load template from server and store to cache
 * 
 * @static
 * @method load
 * @param name {String} The template name. Here is how templates are found:
 *   First, load any new templates from the DOM if found inside script tag with type "text/"+type
 *   Then, check the cache. If not there, we try to load the template from dir+'/'+name+'.'+type
 * @param callback {Function} Receives two parameters: (err, templateText)
 * @param options {Object?} Options.
 *   "type" - the type and extension of the template, defaults to 'handlebars'
 *   "dir" - the subpath of the app url under which to look for the template if it needs to be loaded
 *   "name" - option to override the name of the template
 * @return {String|undefined}
 */
Q.Template.load = Q.getter(function _Q_Template_load(name, callback, options) {
	if (typeof callback === "object") {
		options = callback;
		callback = undefined;
	}
	if (options && options.name) {
		name = options.name;
	}
	if (!name) {
		console.error('Q.Template.load: name is empty');
		return;
	}
	// defaults to handlebars templates
	var o = Q.extend({}, Q.Template.load.options, options);
	var tpl = Q.Template.collection;

	
	// Now attempt to load the template.
	// First, search the DOM for templates loaded inside script tag with type "text/theType",
	// e.g. "text/handlebars" and id matching the template name.
	var i, l, script;
	var scripts = document.getElementsByTagName('script');
	var trash = [];
	for (i = 0, l = scripts.length; i < l; i++) {
		script = scripts[i];
		var type = script.getAttribute('type');
		if (script && script.id && script.innerHTML
		&& type.substr(0, 5) === 'text/'
		&& o.types[type.substr(5)]) {
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
			Q.Template.onError.handle(err);
			return callback(err, null);
		}
		tpl[n] = content.trim();
		callback(null, tpl[n]);
	}
	function _fail () {
		var err = 'Failed to load template "'+o.dir+'/'+name+'.'+o.type+'"';
		Q.Template.onError.handle(err);
		callback(err);
	}
	var url = Q.url(o.dir+'/'+name+'.'+ o.type);

	Q.request(url, _callback, {parse: false, extend: false});
	return true;
}, {
	cache: Q.Cache.document('Q.Template.load', 100),
	throttle: 'Q.Template.load'
});

Q.Template.load.options = {
	type: "handlebars",
	types: { "handlebars": true, "mustache": true, "php": true },
	dir: "views"
};

Q.Template.onError = new Q.Event(function (err) {
	console.warn("Q.Template: " + Q.firstErrorMessage(err));
}, 'Q.Template');

/**
 * Render template taken from DOM or from file on server with partials
 * 
 * @static
 * @method render
 * @param name {string} The name of template. See Q.Template.load
 * @param fields {object?} Rendering params - to be substituted to template
 * @param partials {array?} Names of partials to load and use for rendering the template
 * @param callback {function} a callback - receives the rendering result or nothing
 * @param options {object?} Options.
 *   "type" - the type and extension of the template, defaults to 'handlebars'
 *   "dir" - the folder under project web folder where templates are located
 *   "name" - option to override the name of the template
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
		throw new Q.Error("Q.Template.render: callback is missing");
	}
	var isArray = (Q.typeOf(name) === 'array');
	if (isArray || Q.isPlainObject(name)) {
		var names = name;
		var p = Q.pipe(isArray ? names : Object.keys(names), callback);
		return Q.each(names, function (key, name) {
			Q.Template.render(
				name, fields, partials, p.fill(isArray ? name : key), options
			);
		});
	}
	Q.ensure(window.Handlebars, 
		Q.url('plugins/Q/js/handlebars-v1.3.0.min.js'),
		function () {
			
			var Handlebars = window.Handlebars;
			if (!Handlebars.helpers.call) {
				Handlebars.registerHelper('call', function(path) {
					if (!path) {
						return "{{call missing method name}}";
					}
					var parts = path.split('.');
					var p0 = parts[0];
					var p1 = parts[1];
					if (this[p0] && typeof this[p0][p1] === 'function') {
						var args = Array.prototype.slice.call(
							arguments, 1, arguments.length-1
						);
						return this[p0][p1].apply(this[p0], args);
					}
					return "{{call "+path+" not found}}";
				});
			}
			
			// load the template and partials
			var p = Q.pipe(['template', 'partials'], function (params) {
				if (params.template[0]) {
					return callback(params.template[0]);
				}
				callback(null, Handlebars.compile(params.template[1])(fields, {partials: params.partials[0]}));
			});
			Q.Template.load(name, p.fill('template'), options);
			// pipe for partials
			if (partials && partials.length) {
				var pp = Q.pipe(partials, function (params) {
					var i, partial, part = {};
					for (i=0; i<partials.length; i++) {
						partial = partials[i];
						part[partial] = params[partial][0] ? null : params[partial][1];
					}
					p.fill('partials')(part);
				});
				for (var i=0; i<partials.length; i++) {
					Q.Template.load(partials[i], pp.fill(partials[i]), options);
				}
			} else {
				p.fill('partials')();
			}
		}
	);
};

var _qsockets = {}, _eventHandlers = {}, _connectHandlers = {}, _ioCleanup = [];
var _socketRegister = [];

function _ioOn(obj, evt, callback) {
	// In case we call this function again during a reconnect,
	// and the functions were already bound, remove them first.
	obj.off(evt, callback);
	obj.on(evt, callback);
 	_ioCleanup.push(function () { 
 		obj.off(evt, callback);
 	});
}

/**
 * Q.Socket class can be used to manage sockets (implemented with socket.io)<br>
 * Instantiate sockets with Q.Socket.connect
 * @class Q.Socket
 * @param {Object} params
 * @private
 * @constructor
 */
Q.Socket = function (params) {
	this.socket = params.socket;
	this.url = params.url;
	this.ns = params.ns;
};

/**
 * Returns a socket, if it was already connected, or returns undefined
 * @static
 * @method get
 * @param ns {String} The socket.io namespace
 * @param url {String} The url where socket.io is listening. If it's empty, then returns all matching sockets.
 * @return {Q.Socket}
 */
Q.Socket.get = function _Q_Socket_get(ns, url) {
	ns = ns || "";
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!url) {
		return _qsockets[ns];
	}
	return _qsockets[ns] && _qsockets[ns][url];
};

function _connectSocketNS(ns, url, callback, force) {
	// load socket.io script and connect socket
	function _connectNS(ns, url, callback) {
		// connect to (ns, url)
		if (!window.io) return;
		var qs = _qsockets[ns][url];
		if (!qs || !qs.socket) {
			_qsockets[ns][url] = qs = new Q.Socket({
				socket: window.io.connect(url+ns, force ? {
					'force new connection': true
				} : {}),
				url: url,
				ns: ns
			});
			function _Q_Socket_register(socket) {
				Q.each(_socketRegister, function (i, item) {
					if (item[0] !== ns) return;
					var name = item[1];
					_ioOn(socket, name, Q.Socket.onEvent(ns, url, name).handle); // may overwrite again, but it's ok
					_ioOn(socket, name, Q.Socket.onEvent(ns, '', name).handle);
				});
			}
			Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
			// remember actual socket - for disconnecting
			var socket = qs.socket;
			function _connected() {
				this.emit('session', Q.cookie(Q.info.sessionName || 'sessionId'));
				Q.Socket.onConnect(ns).handle(socket);
				Q.Socket.onConnect(ns, url).handle(socket);
				console.log('Socket connected to '+url);
			}
			_ioOn(socket, 'connect', _connected);
			/*
			_ioOn(socket, 'reconnect', function () {
				this.connected = true;
				++this.io.connected;
				_connected.apply(this, arguments);
			});
			*/
			_ioOn(socket, 'connect_error', function (error) {
				console.log('Failed to connect to '+url, error);
			});
			_ioOn(socket, 'disconnect', function () {
				console.log('Socket ' + ns + ' disconnected from '+url);
			});
			_ioOn(socket, 'error', function () {
				console.log('Error on connection '+url);
			});
		}
		callback && callback(_qsockets[ns][url]);
	}
	
	if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	
	if (window.io && window.io.Socket) {
		_connectNS(ns, url, callback);
	} else {
		Q.addScript(url+'/socket.io/socket.io.js', function () {
			_connectNS(ns, url, callback);
		});
	}
}

/**
 * Connects a socket, and stores it in the list of connected sockets
 * 
 * @static
 * @method connect
 * @param ns {String} A socket.io namespace to use
 * @param url {String} The url of the socket.io node to connect to
 * @param callback {Function} When a connection is made, receives the socket object
 */
Q.Socket.connect = function _Q_Socket_prototype_connect(ns, url, callback) {
	if (!url) {
		return false;
	}
	if (typeof ns === 'function') {
		callback = ns;
		ns = '';
	} else if (!ns) {
		ns = '';
	} else if (ns[0] !== '/') {
		ns = '/' + ns;
	}
	if (!_qsockets[ns]) _qsockets[ns] = {};
	if (!_qsockets[ns][url]) {
		_qsockets[ns][url] = null; // pending
	}
	_connectSocketNS(ns, url, callback); // check if socket already connected and try to restore it
};

/**
 * Disconnects a socket corresponding to a Q.Socket
 * 
 * @method disconnect
 */
Q.Socket.prototype.disconnect = function _Q_Socket_prototype_disconnect() {
	if (!this.url) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect socket with empty url");
		return;
	}
	var qs = Q.getObject([this.ns, this.url], _qsockets);
	if (!qs) {
		console.warn("Q.Socket.prototype.disconnect: Attempt to disconnect nonexistent socket: ", this.url);
		return;
	}
	qs.socket.disconnect();
};

/**
 * Disconnects all sockets that have been connected
 * 
 * @static
 * @param {String} ns Any namespace for the sockets to disconnect
 * @method disconnectAll
 */
Q.Socket.disconnectAll = function _Q_Socket_disconnectAll(ns) {
	if (ns) {
		Q.each(_qsockets[ns], function (url, socket) {
			socket && socket.disconnect();
		});
	} else {
		Q.each(_qsockets, function (ns, arr) {
			Q.each(arr, function (url, socket) {
				socket && socket.disconnect();
			});
		});
	}
};

/**
 * Reconnect all sockets that have been connected
 * 
 * @static
 * @method reconnectAll
 */
Q.Socket.reconnectAll = function _Q_Socket_reconnectAll() {
	var ns, url;
	for (ns in _qsockets) {
		for (url in _qsockets[ns]) {
			if (!_qsockets[ns][url]) {
				_connectSocketNS(ns, url);
			} else if (!_qsockets[ns][url].socket.io.connected) {
				_qsockets[ns][url].socket.io.reconnect();
			}
		}
	}
};

/**
 * Completely remove all sockets, de-register events and forget socket.io
 * 
 * @static
 * @method destroyAll
 */
Q.Socket.destroyAll = function _Q_Socket_destroyAll() {
	Q.Socket.disconnectAll();
	setTimeout(function () {
		for (var i=0; i<_ioCleanup.length; i++) {
			_ioCleanup[i]();
		}
		_ioCleanup = [];
		_qsockets = {};
		window.io = undefined;
	}, 1000);
};

/**
 * Subscribe to a socket event and obtain a Q.Event based on the parameters
 * 
 * @event onEvent
 * @param {String} ns the namespace of the socket
 * @param {String} url the url of the socket
 * @param {String} name the name of the event
 */
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
			Q.each(Q.Socket.get(ns, url), function (url, qs) {
				function _Q_Socket_register(socket) {
					// this occurs when socket is connected
					_ioOn(socket, name, event.handle);
		    	}
				if (qs) { 
					// add listeners on sockets which are already constructed
					Q.Socket.onConnect(ns, url).add(_Q_Socket_register, 'Q');
				}
			});
			// add pending listeners on sockets that may constructed later
	    	_socketRegister.push([ns, name]);
		});
		event.onEmpty().set(function () {
			// Every handler was removed from the event
			Q.each(Q.Socket.get(ns, url), function (url, qs) {
				if (qs) { // remove listeners on sockets which are already constructed
					qs.socket.off(name, event.handle);
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

/**
 * Be notified when a socket connects and obtain a Q.Event based on the parameters
 * 
 * @event onConnect
 * @param {String} ns the namespace of the socket
 * @param {String} url the url of the socket
 */
Q.Socket.onConnect = Q.Event.factory(
	_connectHandlers, 
	["", "", function (ns, url) { 
		if (ns[0] !== '/') {
			return ['/'+ns, url];
		}
	}]
);

/**
 * Returns Q.Event which occurs on a message post event coming from socket.io
 * Generic callbacks can be assigend by setting messageType to ""
 * @event onEvent
 * @param name {String} name of the event to listen for
 */
Q.Socket.prototype.onEvent = function(name) {
	return Q.Socket.onEvent(this.url, this.ns, name);
};

/**
 * Q.Animation class can be used to repeatedly call a function
 * in order to animate something
 * @class Q.Animation
 * @constructor
 * @param {Function} callback
 *  The function to call. It is passed the following parameters:
 *  x = the position in the animation, between 0 and 1
 *  y = the output of the ease function after plugging in x
 *  params = the fourth parameter passed to the run function
 * @param {Number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation = function _Q_Animation(callback, duration, ease, params) {
	if (duration == undefined) {
		duration = 1000;
	}
	if (typeof ease == "string") {
		ease = Q.Animation.ease[ease];
	}
	if (typeof ease !== 'function') {
		ease = Q.Animation.ease.smooth;
	}
	var anim = this;
	anim.position = 0;
	anim.milliseconds = 0;
	anim.sinceLastFrame = 0;
	this.id = ++_Q_Animation_index;
	this.duration = duration;
	this.ease = ease;
	this.callback = callback;
	this.params = params;
	this.onRewind = new Q.Event();
	this.onPause = new Q.Event();
	this.onRender = new Q.Event();
	this.onComplete = new Q.Event();
};

var Ap = Q.Animation.prototype;

/**
 * Pause the animation
 * @method pause
 */
Ap.pause = function _Q_Animation_prototype_pause() {
	this.playing = false;
	delete Q.Animation.playing[this.id];
	this.onPause.handle.call(this);
	return this;
};

/**
 * Rewind the animation
 * @method rewind
 */
Ap.rewind = function _Q_Animation_prototype_rewind() {
	this.pause();
	this.position = this.milliseconds = this.sinceLastFrame = 0;
	this.onRewind.handle.call(this);
	return this;
};

/**
 * Render the current frame of the animation
 * @method render
 */
Ap.render = function _Q_Animation_prototype_rewind() {
	var anim = this;
	var ms = Q.milliseconds();
	window.requestAnimationFrame(function () {
		var _milliseconds = anim.milliseconds || 0;
		anim.milliseconds += Q.milliseconds() - ms;
		anim.sinceLastFrame = anim.milliseconds - _milliseconds;
		var x = anim.position = anim.milliseconds / anim.duration;
		if (x >= 1) {
			Q.handle(anim.callback, anim, [1, anim.ease(1), anim.params]);
			anim.onRender.stop();
			anim.onComplete.handle.call(anim);
			anim.rewind();
			return;
		}
		var y = anim.ease(x);
		Q.handle(anim.callback, anim, [x, y, anim.params]);
		if (anim.playing) {
			anim.render();
		}
		anim.onRender.handle.call(anim, x, y, anim.params);
	});
};

/**
 * Play the animation (resume after a pause)
 * @method play
 */
Ap.play = function _Q_Animation_instance_play() {
	Q.Animation.playing[this.id] = this;
	this.playing = true;
	this.render();
	return this;
};

/**
 * Play the animation
 * @static
 * @method play
 * @param {Function} callback
 *  The function to call. It is passed the following parameters:
 *  x = the position in the animation, between 0 and 1
 *  y = the output of the ease function after plugging in x
 *  params = the fourth parameter passed to the run function
 * @param {Number} duration
 *  The number of milliseconds the animation should run
 * @param {String|Function} ease
 *  The key of the ease function in Q.Animation.ease object, or another ease function
 * @param {Object} params
 *  Optional parameters to pass to the callback
 */
Q.Animation.play = function _Q_Animation_play(callback, duration, ease, params) {
	var result = new Q.Animation(callback, duration, ease, params);
	return result.play();
};

/**
 * The frames per second, used if requestAnimationFrame isn't defined
 * @property {Number} fps
 */
Q.Animation.fps = 60;

/**
 * Ease functions for animations
 * Contains "linear", "bounce", "smooth" and "inOutQuintic".
 * Feel free to add more.
 * @property {Object} ease
 */
Q.Animation.ease = {
	linear: function(fraction) {
		return fraction;
	},
	power: function (exponent) {
		return function(fraction) {
			return 1-Math.pow(1-fraction, exponent);
		};
	},
	bounce: function(fraction) {
		return Math.sin(Math.PI * 1.2 * (fraction - 0.5)) / 1.7 + 0.5;
	},
	smooth: function(fraction) {
		return Math.sin(Math.PI * (fraction - 0.5)) / 2 + 0.5;
	},
	easeInExpo: function (t) {
		return (x==0) ? 0 : pow(2, 10 * (x - 1)) + 0 - 1 * 0.001;
	},
	inOutQuintic: function(t) {
		var ts = t * t;
		var tc = ts * t;
		return 6 * tc * ts + -15 * ts * ts + 10 * tc;
	}
};

function _listenForVisibilityChange() {
	var hidden, visibilityChange; 
	if ('hidden' in document) { // Opera 12.10 and Firefox 18 and later support 
		hidden = 'hidden';
		visibilityChange = 'visibilitychange';
	} else if ('mozHidden' in document) {
		hidden = 'mozHidden';
		visibilityChange = 'mozvisibilitychange';
	} else if ('msHidden' in document) {
		hidden = 'msHidden';
		visibilityChange = 'msvisibilitychange';
	} else if ('webkitHidden' in document) {
		hidden = 'webkitHidden';
		visibilityChange = 'webkitvisibilitychange';
	} else if ('oHidden' in document) {
		hidden = 'oHidden';
		visibilityChange = 'ovisibilitychange';
	}
	Q.addEventListener(document, visibilityChange, function () {
		Q.onVisibilityChange.handle(document, [document[hidden]]);
	}, false);
	Q.isDocumentHidden = function () {
		return document[hidden];
	};
}
_listenForVisibilityChange();

function _handleVisibilityChange() {
	if (document.hidden || document.msHidden 
	|| document.webkitHidden || document.oHidden) {
		return;
	}
	for (var k in Q.Animation.playing) {
		Q.Animation.playing[k].play();
	}
}
Q.onVisibilityChange.set(_handleVisibilityChange, 'Q.Animation');

Q.Animation.playing = {};
var _Q_Animation_index = 0;

Q.jQueryPluginPlugin = function _Q_jQueryPluginPlugin() {
	var $ = window.jQuery;
	if (!$ || $.fn.plugin) {
		return;
	}
	/**
	 * Loads a jQuery plugin if it is not there, then calls the callback
	 * @class jQuery.fn
	 * @static
	 * @method plugin
	 * @param {String} pluginName
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
		var that = this;
		$.fn.plugin.load(pluginName, function _jQuery_plugin_load_completed(results) {
			for (var k in results) {
				if (!results[k]) {
					throw new Q.Error("jQuery.fn.plugin: "+pluginName+" not defined");
				}
				results[k].apply(that, args);
				Q.handle(callback, that, args);
				break;
			}
		});
		return this;
	};
	/**
	 * The function used by the "plugin" plugin to load other plugins
	 * @static
	 * @method plugin.load
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
		var results = {};
		Q.each(pluginNames, function _jQuery_plugin_loaded(i, pluginName) {
			pluginName = Q.normalize(pluginName);
			results[pluginName] = true;
			if ($.fn[pluginName]) return;
			var src = ($.fn.plugin[pluginName] || 'plugins/jQuery/'+pluginName+'.js');
			if (typeof src === 'string') {
				srcs.push(src);
			}
		});
		Q.addScript(srcs, function _jQuery_plugin_script_loaded() {
			for (pluginName in results) {
				results[pluginName] = $.fn[pluginName];
			}
			Q.handle(callback, window, [results]);
		}, options);
		return false;
	};
	/**
	 * Used to access the state of a plugin, e.g. $('#foo').state('Q/something').foo
	 * @static
	 * @method state
	 */
	$.fn.state = function _jQuery_fn_state(pluginName) {
		var key = Q.normalize(pluginName) + ' state';
		return jQuery(this).data(key);
	};
	/**
	 * Calls Q.activate on all the elements in the jQuery
	 * @static
	 * @method activate
	 * @param {Object} options
	 *  Optional options to provide to tools and their children.
	 * @param {Function|Q.Event} callback
	 *  This will get called when the content has been completely activated.
	 *  That is, after all the files, if any, have been loaded and all the
	 *  constructors have run.
	 *  It receives (elem, options, tools) as arguments, and the last tool to be
	 *  activated as "this".
	 */
	$.fn.activate = function _jQuery_fn_activate(options, callback) {
		jQuery(this).each(function _jQuery_fn_activate_each(index, element) {
			if (!jQuery(element).closest('html').length) {
				console.warn(new Q.Error("jQuery.fn.activate: element to activate must be in the DOM"));
			}
			Q.activate(element, options, callback);
		});
	};
	
	Q.each({
		'on': 'off',
		'live': 'die',
		'bind': 'unbind'
	}, function (on, off) {
		var _jQuery_fn_on = $.fn[on];
		$.fn[on] = function _jQuery_on() {
			var args = Array.prototype.slice.call(arguments, 0)
			for (var f = args.length-1; f >= 0; --f) {
				if (typeof args[f] === 'function') {
					break;
				}
			} // assume f >= 1
			var af1, af2;
			af1 = af2 = args[f];
			var namespace = '';
			if (Q.typeOf(args[0]) === 'array') {
				namespace = args[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				args[0] = args[0][0];
			}
			if (typeof args[0] === 'function') {
				var params = {
					original: args[f]
				};
				af2 = args[f] = args[0] ( params );
				af1.Q_wrapper = af2;
				if (!('eventName' in params)) {
					throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
				}
				args[0] = params.eventName;
			}
			if (namespace) {
				var parts = args[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				args[0] = parts.join(' ');
			}
			var added;
			if (args[f-1] === true) {
				Q.Event.jQueryForPage.push([off, this, args[0], af2]);
				added = 'page';
			} else if (Q.typeOf(args[f-1]) === 'Q.Tool') {
				var tool = args[f-1], key = tool.id;
				if (!Q.Event.jQueryForTool[key]) {
					Q.Event.jQueryForTool[key] = [];
				}
				Q.Event.jQueryForTool[key].push([off, this, args[0], af2]);
				added = 'tool';
			}
			if (added) {
				args.splice(f-1, 1);
			}
			return _jQuery_fn_on.apply(this, args);
		};
		
		var _jQuery_fn_off = $.fn[off];
		$.fn[off] = function () {
			var args = Array.prototype.slice.call(arguments, 0);
			var namespace = '';
			if (Q.typeOf(arguments[0]) === 'array') {
				namespace = args[0][1] || '';
				if (namespace && namespace[0] !== '.') {
					namespace = '.' + namespace;
				}
				args[0] = args[0][0];
			}
			if (typeof args[0] === 'function') {
				var params = {};
				args[0] ( params );
				if (!('eventName' in params)) {
					throw new Q.Error("Custom $.fn.on handler: need to set params.eventName");
				}
				args[0] = params.eventName;
			}
			if (namespace) {
				var parts = args[0].split(' ');
				for (var i=parts.length-1; i>=0; --i) {
					parts[i] += namespace;
				}
				args[0] = parts.join(' ');
			}
			var f, af = null;
			for (f = args.length-1; f >= 0; --f) {
				if (typeof args[f] === 'function') {
					af = args[f];
					break;
				}
			}
			if (af && af.Q_wrapper) {
				args[f] = af.Q_wrapper;
			}
			return _jQuery_fn_off.apply(this, args);
		};
	});
};
Q.jQueryPluginPlugin();

/**
 * A tool for detecting user browser parameters.
 * @class Q.Browser
 */
Q.Browser = {

	/**
	 * The only public method, detect() returns a hash consisting of these elements:
	 * "name": Name of the browser, can be 'mozilla' for example.
	 * "mainVersion": Major version of the browser, digit like '9' for example.
	 * "OS": Browser's operating system. For example 'windows'.
	 * "engine": Suggested engine of the browser, can be 'gecko', 'webkit' or some other.
	 * @static
     * @method detect
     * @return {Object}
	 */
	detect: function() {
		var data = this.searchData(this.dataBrowser);
		var browser = data.identity || "An unknown browser";
		
		var version = (this.searchVersion(navigator.userAgent)
			|| this.searchVersion(navigator.appVersion)
			|| "an unknown version").toString();
		var dotIndex = version.indexOf('.');
		var mainVersion = version.substring(0, dotIndex != -1 ? dotIndex : version.length);
		
		var OSdata = this.searchData(this.dataOS);
		var OS = OSdata.identity || "an unknown OS";
		
		var engine = '', ua = navigator.userAgent.toLowerCase();

		if (ua.indexOf('webkit') != -1) {
			engine = 'webkit';
		} else if (ua.indexOf('gecko') != -1) {
			engine = 'gecko';
		} else if (ua.indexOf('presto') != -1) {
			engine = 'presto';
		}
		
		var isWebView = /(.*)QWebView(.*)/.test(navigator.userAgent)
			|| (/(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i).test(navigator.userAgent);
		
		var name = browser.toLowerCase();
		var prefix;
		
		switch (engine) {
			case 'webkit': prefix = '-webkit-'; break;
			case 'gecko': prefix = '-moz-'; break;
			case 'presto': prefix = '-o-'; break;
			default: prefix = '';
		}
		
		prefix = (name === 'explorer') ? '-ms-' : prefix;
		
		return {
			name: name,
			mainVersion: mainVersion,
			prefix: prefix,
			OS: OS.toLowerCase(),
			engine: engine,
			device: OSdata.device,
			isWebView: isWebView
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
		
		return Q.Browser.scrollbarWidth = w1 - w2;
	}
	
};

var detected = Q.Browser.detect();
var isTouchscreen = ('ontouchstart' in window || !!window.navigator.msMaxTouchPoints);
var isTablet = navigator.userAgent.match(new RegExp('tablet|ipad', 'i'))
	|| (isTouchscreen && !navigator.userAgent.match(new RegExp('mobi', 'i')));
/**
 * Useful info about the page and environment
 * 
 * @property {Object} info
 */
Q.info = {
	isTouchscreen: isTouchscreen, // works on ie10
	isTablet: isTablet,
	platform: detected.OS,
	browser: detected,
	isIE: function (minVersion, maxVersion) {
		return Q.info.browser.name === 'explorer'
			&& (minVersion == undefined || minVersion <= Q.info.browser.version)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.version);
	},
	isAndroid: function (maxWidth, maxHeight, minVersion, maxVersion) {
		return Q.info.platform === 'android'
			&& (maxWidth == undefined || maxWidth >= Q.Pointer.windowWidth())
			&& (maxHeight == undefined || maxHeight >= Q.Pointer.windowHeight())	
			&& (minVersion == undefined || minVersion <= Q.info.browser.version)
			&& (maxVersion == undefined || maxVersion >= Q.info.browser.version);
	}
};
Q.info.isMobile = Q.info.isTouchscreen && !Q.info.isTablet;
Q.info.formFactor = Q.info.isMobile ? 'mobile' : (Q.info.isTablet ? 'tablet' : 'desktop');
var de = document.documentElement;
de.addClass(Q.info.isTouchscreen  ? 'Q_touchscreen' : 'Q_notTouchscreen');
de.addClass(Q.info.isMobile ? 'Q_mobile' : 'Q_notMobile');
de.addClass(Q.info.isAndroid() ? 'Q_android' : 'Q_notAndroid');

function _touchScrollingHandler(event) {
    var p = event.target;
	var pos;
	var scrollable = null;
	do {
		if (!p.computedStyle) {
			continue;
		}
		var overflow = p.computedStyle().overflow;
		var hiddenWidth = p.scrollWidth - p.offsetWidth;
		var hiddenHeight = p.scrollHeight - p.offsetHeight;
		var s = (['hidden', 'visible'].indexOf(overflow) < 0);
		if ((s || p.tagName === 'HTML')
		&& hiddenHeight > 0) {
			if (_touchScrollingHandler.options.direction != 'horizontal'
			&& (Q.Pointer.movement.positions.length == 1)
			&& (pos = Q.Pointer.movement.positions[0])) {
				var sy = Q.Pointer.getY(event)
					+ Q.Pointer.scrollTop();
				if ((sy > pos.y && p.scrollTop == 0)
				|| (sy < pos.y && p.scrollTop >= hiddenHeight)) {
					continue;
				}
			}
			scrollable = p;
			break;
		}
		if (!scrollable
		&& (s || p.tagName === 'HTML') && hiddenWidth > 0) {
			if (_touchScrollingHandler.options.direction != 'vertical'
			&& (Q.Pointer.movement.positions.length == 1)
			&& (pos = Q.Pointer.movement.positions[0])) {
				var sx = Q.Pointer.getX(event)
					+ Q.Pointer.scrollLeft();
				if ((sx > pos.x && p.scrollLeft == 0)
				|| (sx < pos.x && p.scrollLeft >= hiddenWidth)) {
					continue;
				}
			}
			scrollable = p;
			break;
		}
	} while (p = p.parentNode);
    if (!scrollable) {
        Q.Pointer.preventDefault(event);
    }
}

_touchScrollingHandler.options = {
	direction: 'both'
};

function _detectOrientation(e) {
	var w = window,
	    d = document,
	    h = d.documentElement,
	    b = d.getElementsByTagName('body')[0],
	    x = w.innerWidth || h.clientWidth || b.clientWidth,
	    y = w.innerHeight|| h.clientHeight|| b.clientHeight;
	if (x > y) {
		h.removeClass('Q_verticalOrientation')
			.addClass('Q_horizontalOrientation');
		Q.info.isVertical = false;
	} else {
		h.removeClass('Q_horizontalOrientation')
			.addClass('Q_verticalOrientation');
		Q.info.isVertical = true;
	}
}

function _setLayoutInterval(e) {
	if (!Q.info.isTouchscreen
	|| !_setLayoutInterval.options.milliseconds) {
		return;
	}
	var w = Q.Pointer.windowWidth();
	var h = Q.Pointer.windowHeight();
	var interval = setInterval(function () {
		var w2 = Q.Pointer.windowWidth();
		var h2 = Q.Pointer.windowHeight();
		if (w !== w2 || h !== h2) {
			Q.onLayout.handle();
		}
		w = w2;
		h = h2;
	}, _setLayoutInterval.options.milliseconds);
}

_setLayoutInterval.options = {
	milliseconds: 300
};

/**
 * Methods for working with pointer and touchscreen events
 * @class Q.Pointer
 */
Q.Pointer = {
	/**
	 * Either 'touchstart' or 'mousedown' event name, depending on environment
	 * @static
	 * @property {String} start
	 */
	start: (Q.info.isTouchscreen ? 'touchstart' : 'mousedown'),
	/**
	 * Either 'touchmove' or 'mousemove' event name, depending on environment
	 * @static
	 * @property {String} move
	 */
	move: (Q.info.isTouchscreen ? 'touchmove' : 'mousemove'),
	/**
	 * Either 'touchend' or 'mouseup' event name, depending on environment
	 * @static
	 * @property {String} end
	 */
	end: (Q.info.isTouchscreen ? 'touchend' : 'mouseup'),
	/**
	 * Either 'touchenter' or 'mouseenter' event name, depending on environment
	 * @static
	 * @property {String} enter
	 */
	enter: (Q.info.isTouchscreen ? 'touchenter' : 'mouseenter'),
	/**
	 * Either 'touchleave' or 'mouseleave' event name, depending on environment
	 * @static
	 * @property {String} leave
	 */
	leave: (Q.info.isTouchscreen ? 'touchleave' : 'mouseleave'),
	/**
	 * The 'touchcancel' event name, depending on environment
	 * @static
	 * @property {String} cancel
	 */
	cancel: (Q.info.isTouchscreen ? 'touchcancel' : 'mousecancel'), // mousecancel can be a custom event
	/**
	 * The 'focusin' event name, depending on environment
	 * @static
	 * @property {String} focusin
	 */
	focusin: (Q.info.browser.engine === 'gecko' ? 'focus' : 'focusin'),
	/**
	 * The 'focusout' event name, depending on environment
	 * @static
	 * @property {String} focusout
	 */
	focusout: (Q.info.browser.engine === 'gecko' ? 'blur' : 'focusout'),
	/**
	 * Intelligent click event that also works on touchscreens, and respects Q.Pointer.canceledClick
	 * @static
	 * @method click
	 */
	click: function _Q_click(params) {
		params.eventName = 'click';
		return function _Q_click_on_wrapper (e) {
			if (Q.Pointer.canceledClick) {
				return Q.Pointer.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Like click event but fires much sooner on touchscreens, and respects Q.Pointer.canceledClick
	 * @static
	 * @method fastclick
	 */
	fastclick: function _Q_fastclick (params) {
		params.eventName = Q.Pointer.end;
		return function _Q_fastclick_on_wrapper (e) {
			var elem = Q.Pointer.elementFromPoint(Q.Pointer.getX(e), Q.Pointer.getY(e));
			if (Q.Pointer.canceledClick
			|| !this.isOrContains(Q.Pointer.started)
			|| !this.isOrContains(elem)) {
				return Q.Pointer.preventDefault(e);
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Normalized mouse wheel event that works with various browsers
	 * @static
	 * @method click
	 */
	wheel: function _Q_wheel (params) {
		// Modern browsers support "wheel",
		// Webkit and IE support at least "mousewheel",
		// and let's assume that remaining browsers are older Firefox
		_Q_wheel.div = document.createElement("div");
		params.eventName = ("onwheel" in _Q_wheel.div) ? "wheel" :
			(document.onmousewheel !== undefined) ? "mousewheel" : 
			"DOMMouseScroll MozMousePixelScroll";
		return function _Q_wheel_on_wrapper (e) {
			var oe = e.originalEvent || e;
			e.type = 'wheel';
			e.deltaMode = (oe.type == "MozMousePixelScroll") ? 0 : 1;
			e.deltaX = oe.deltaX || 0;
			e.deltaY = oe.deltaY || 0;
			e.deltaZ = oe.deltaZ || 0;
			
			// calculate deltaY (and deltaX) according to the event
			switch (params.eventName) {
			case 'mousewheel':
				// Webkit also supports wheelDeltaX
				oe.wheelDelta && ( e.deltaY = -Math.ceil(1/3 * oe.wheelDelta) );
				oe.wheelDeltaX && ( e.deltaX = -Math.ceil(1/3 * oe.wheelDeltaX) );
				break;
			case 'wheel':
			default:
				e.deltaY = ('deltaY' in oe) ? oe.deltaY : oe.detail;
			}
			return params.original.apply(this, arguments);
		};
	},
	/**
	 * Whether the click was canceled by Q.Pointer.cancelClick()
	 * @static
	 * @property {Boolean} canceledClick
	 */
	canceledClick: false,
	/**
	 * Returns the document's scroll left in pixels, consistently across browsers
	 * @static
	 * @method scrollLeft
	 * @return {Number}
	 */
	scrollLeft: function () {
		return window.pageXOffset || document.documentElement.scrollLeft || (document.body && document.body.scrollLeft);
	},
	/**
	 * Returns the document's scroll top in pixels, consistently across browsers
	 * @static
	 * @method scrollTop
	 * @return {Number}
	 */
	scrollTop: function () {
		return window.pageYOffset || document.documentElement.scrollTop || (document.body && document.body.scrollTop);
	},
	/**
	 * Returns the window's inner width, in pixels, consistently across browsers
	 * @static
	 * @method scrollTop
	 * @return {Number}
	 */
	windowWidth: function () {
		return window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
	},
	/**
	 * Returns the window's inner height, in pixels, consistently across browsers
	 * @static
	 * @method windowHeight
	 * @return {Number}
	 */
	windowHeight: function () {
		return window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
	},
	/**
	 * Returns the x coordinate of an event relative to the document
	 * @static
	 * @method getX
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	getX: function(e) {
		var oe = e.originalEvent || e;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[0]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[0]
				: oe
			);
		return Math.max(0, ('pageX' in oe) ? oe.pageX : oe.clientX + Q.Pointer.scrollLeft());
	},
	/**
	 * Returns the y coordinate of an event relative to the document
	 * @static
	 * @method getY
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	getY: function(e) {
		var oe = e.originalEvent || e;
		oe = (oe.touches && oe.touches.length)
			? oe.touches[0]
			: (oe.changedTouches && oe.changedTouches.length
				? oe.changedTouches[0]
				: oe
			);
		return Math.max(0, ('pageY' in oe) ? oe.pageY : oe.clientY + Q.Pointer.scrollTop());
	},
	/**
	 * Returns the number of touch points of an event
	 * @static
	 * @method touchCount
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	touchCount: function (e) {
		var oe = e.originalEvent || e;
 		return oe.touches ? oe.touches.length : (Q.Pointer.which(e) > 0 ? 1 : 0);
	},
	/**
	 * Returns which button was pressed - Q.Pointer.which.{LEFT|MIDDLE|RIGHT}
	 * @static
	 * @method which
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	which: function (e) {
		var button = e.button, which = e.which;
		if (!which && button !== undefined ) {
			which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
		}
		return which;
	},
	/**
	 * Consistently returns the target of an event across browsers
	 * @static
	 * @method target
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {HTMLElement}
	 */
	target: function (e) {
		var target = e.target || e.srcElement;
		if (target.nodeType === 3) { // Safari bug
			target = target.parentNode;
		}
		return target;
	},
	/**
	 * Consistently returns the related target of an event across browsers
	 * @static
	 * @method relatedTarget
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	relatedTarget: function (e) {
		e.relatedTarget = e.relatedTarget || (e.type == 'mouseover' ? e.fromElement : e.toElement);	
	},
	/**
	 * Computes the offset of an element relative to the browser
	 * @static
	 * @method offset
	 * @param {Element} element
	 * @return {Object} An object with "left" and "top" properties.
	 */
	offset: function (element) {
		var offsetLeft = 0, offsetTop = 0;
		do {
			if (!isNaN(element.offsetLeft)) {
				offsetLeft += element.offsetLeft;
			}
			if (!isNaN(element.offsetTop)) {
				offsetTop += element.offsetTop;
			}
		} while (element = element.offsetParent);
		return { left: offsetLeft,  top: offsetTop };
	},
	/**
	 * Places a hint to click or tap on the screen
	 * @static
	 * @method hint 
	 * @param {Element|Object} elementOrPoint Indicates where to display the hint. A point should contain properties "x" and "y".
	 * @param {Object} [options] possible options, which can include:
	 * @param {String} [options.src] the url of the image
	 * @param {Point} [options.hotspot={x:0.5,y:0.3}] "x" and "y" represent the location of the hotspot within the image, using fractions between 0 and 1
	 * @param {String} [options.width="200px"]
	 * @param {String} [options.height="200px"]
	 * @param {Integer} [options.zIndex=99999]
	 */
	hint: function (elementOrPoint, options) {
		var o = Q.extend({}, Q.Pointer.hint.options, options);
		var body = document.getElementsByTagName('body')[0];
		var img = Q.Pointer.hint.img;
		if (img) {
			img.parentNode.removeChild(img);
		}
		img = Q.Pointer.hint.img = document.createElement('img');
		img.setAttribute('src', Q.url(o.src));
		img.style.position = 'absolute';
		img.style.width = o.width;
		img.style.height = o.height;
		img.style.display = 'block';
		img.style.pointerEvents = 'none';
		img.setAttribute('class', 'Q_hint');
		body.appendChild(img);
		if (img.complete) {
			_update();
		} else {
			img.onload = _update;
		}
		Q.Pointer.stopHint.prevent = true;
		Q.removeEventListener(window, Q.Pointer.start, Q.Pointer.stopHint);
		Q.removeEventListener(document, 'scroll', Q.Pointer.stopHint);
		setTimeout(function () {
			Q.addEventListener(window, Q.Pointer.start, Q.Pointer.stopHint);
			Q.addEventListener(document, 'scroll', Q.Pointer.stopHint);
			Q.Pointer.stopHint.prevent = false;
		}, o.hide.delay);
		function _update() {
			var point;
			img.style.display = 'block';
			if (elementOrPoint instanceof Element) {
				var offset = Q.Pointer.offset(elementOrPoint);
				point = {
					x: offset.left + elementOrPoint.offsetWidth / 2,
					y: offset.top + elementOrPoint.offsetHeight / 2
				};
			} else {
				point = elementOrPoint;
			}
			img.style.left = point.x - img.offsetWidth * o.hotspot.x + 'px';
			img.style.top = point.y - img.offsetHeight * o.hotspot.y + 'px';
			img.style.zIndex = o.zIndex;
			img.style.opacity = 0;
			if (Q.Pointer.stopHint.animation) {
				Q.Pointer.stopHint.animation.pause();
				img.style.opacity = 0;
			}
			Q.Pointer.hint.elementOrPoint = elementOrPoint;
			setTimeout(function () {
				var width = parseInt(img.style.width);
				var height = parseInt(img.style.height);
				Q.Animation.play(function (x, y) {
					img.style.opacity = y;
					if (o.show.initialScale !== 1) {
						var z = 1 + (o.show.initialScale - 1) * (1 - y);
						var w = width * z;
						var h = height * z;
						img.style.width = w + 'px';
						img.style.height = h + 'px';
						img.style.left = point.x - w * o.hotspot.x + 'px';
						img.style.top = point.y - h * o.hotspot.y + 'px';
					}
				}, o.show.duration, o.show.ease);
			}, o.show.delay);
		}
	},
	/**
	 * Places a hint to click or tap on the screen
	 * @static
	 * @method hint 
	 * @param {Boolean} removeIt
	 */
	stopHint: function (removeIt) {
		var img = Q.Pointer.hint.img;
		if (!img || Q.Pointer.stopHint.prevent) return;
		Q.Pointer.stopHint.animation = Q.Animation.play(function (x, y) {
			img.style.opacity = 1-y;
			if (x < 1 || Q.Pointer.stopHint.prevent) return;
			if (removeIt === true && img.parentNode) {
				img.parentNode.removeChild(img);
				Q.Pointer.hint.img = null;
			} else {
				img.style.display = 'none';
			}
		}, Q.Pointer.hint.options.hide.duration);
		Q.Pointer.hint.elementOrPoint = null;
	},
	/**
	 * Consistently prevents the default behavior of an event across browsers
	 * @static
	 * @method preventDefault
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Boolean} Whether the preventDefault succeeded
	 */
	preventDefault: function (e) {
		if (('cancelable' in e) && !e.cancelable) {
			return false;
		}
		e.preventDefault ? e.preventDefault() : e.returnValue = false;
		return true;
	},
	/**
	 * Cancels a click that may be in progress,
	 * setting Q.Pointer.canceledClick to true.
	 * However, this canceling itself can be canceled by a handler
	 * returning false.
	 * @static
	 * @method cancelClick
	 * @param {Q.Event} event Some mouse or touch event from the DOM
	 * @param {Object} extraInfo Extra info to pass to onCancelClick
	 * @return {Boolean}
	 */
	cancelClick: function (event, extraInfo) {
		if (false === Q.Pointer.onCancelClick.handle(event, extraInfo)) {
			return false;
		}
		Q.Pointer.canceledClick = true;	
	},
	/**
	 * Consistently obtains the element under pageX and pageY relative to document
	 * @static
	 * @method elementFromPoint
	 * @param {Q.Event} e Some mouse or touch event from the DOM
	 * @return {Number}
	 */
	elementFromPoint: function (pageX, pageY) {
		return document.elementFromPoint(
			pageX - Q.Pointer.scrollLeft(),
			pageY - Q.Pointer.scrollTop()
		);
	},
	/**
	 * Call this function to prevent touch scrolling
	 * @param {Object} [options] possible options, which can include:
	 * @param {String} [options.direction='both'] can be 'vertical', 'horizontal', or 'both'
	 * @method preventTouchScrolling
	 */
	preventTouchScrolling: function (options) {
		Q.extend(_touchScrollingHandler.options, options);
		Q.addEventListener(window, 'touchmove', _touchScrollingHandler);
	},
	/**
	 * Can restore touch scrolling after preventTouchScrolling() was called
	 * @method restoreTouchScrolling
	 */
	restoreTouchScrolling: function () {
		Q.removeEventListener(window, 'touchmove', _touchScrollingHandler);
	},
	/**
	 * This event occurs when a click has been canceled, for one of several possible reasons.
	 * @static
	 * @event onCancelClick
	 * @return {Number}
	 */
	onCancelClick: new Q.Event(),
	/**
	 * The distance that a finger or mouse has to move for the click to be canceled
	 * @static
	 * @property options.cancelClickDistance
	 */
	options: {
		cancelClickDistance: 10
	}
};

Q.Pointer.which.LEFT = 1;
Q.Pointer.which.MIDDLE = 2;
Q.Pointer.which.RIGHT = 3;

Q.Pointer.hint.options = {
	src: 'plugins/Q/img/hints/tap.gif',
	hotspot:  {x: 0.5, y: 0.3},
	width: "50px",
	height: "50px",
	zIndex: 99999,
	show: {
		delay: 500,
		duration: 500,
		initialScale: 2,
		ease: Q.Animation.ease.smooth
	},
	hide: {
		delay: 300,
		duration: 300,
		ease: Q.Animation.ease.linear
	}
};

function _Q_restoreScrolling() {
	if (!Q.info || !Q.info.isTouchscreen) return false;
	var body = document.getElementsByTagName('body')[0];
	var lastScrollLeft, lastScrollTop;
	var focused = false;
	setInterval(function _Q_saveScrollPositions() {
		if (focused) return false;
		lastScrollTop = Q.Pointer.scrollTop();
		lastScrollLeft = Q.Pointer.scrollLeft();
	}, 300);
	Q.addEventListener(body, Q.Pointer.focusin, function _Q_body_focusin() {
		focused = true;
	});
	Q.addEventListener(body, Q.Pointer.focusout, function _Q_body_focusout() {
		focused = false;
		if (lastScrollTop !== undefined) {
			window.scrollTo(lastScrollLeft, lastScrollTop);
		}
	});
	return true;
}

var _pos, _dist, _last, _lastTimestamp, _lastVelocity;
function _Q_PointerStartHandler(e) {
	Q.Pointer.started = Q.Pointer.target(e);
	Q.Pointer.canceledClick = false;
	Q.addEventListener(window, Q.Pointer.move, _onPointerMoveHandler);
	Q.addEventListener(window, Q.Pointer.end, _onPointerEndHandler);
	Q.addEventListener(window, Q.Pointer.cancel, _onPointerEndHandler);
	var screenX = Q.Pointer.getX(e) - Q.Pointer.scrollLeft();
	var screenY = Q.Pointer.getY(e) - Q.Pointer.scrollTop();
	_pos = { // first movement
		x: screenX,
		y: screenY
	};
	_dist = _last = _lastTimestamp = _lastVelocity = null;
	Q.Pointer.movement = {
		times: [],
		positions: [],
		velocities: [],
		movingAverageVelocity: null,
		accelerations: [],
		timeout: 300
	};
}

var _pointerMoveTimeout = null;
function _onPointerMoveHandler(evt) { // see http://stackoverflow.com/a/2553717/467460
	clearTimeout(_pointerMoveTimeout);
	var screenX = Q.Pointer.getX(evt) - Q.Pointer.scrollLeft();
	var screenY = Q.Pointer.getY(evt) - Q.Pointer.scrollTop();
	if (!screenX || !screenY) {
		return;
	}
	var ccd = Q.Pointer.options.cancelClickDistance;
	if (_pos
	&& ((_pos.x && Math.abs(_pos.x - screenX) > ccd)
	 || (_pos.y && Math.abs(_pos.y - screenY) > ccd))) {
		// finger moved more than the threshhold
		if (false !== Q.Pointer.cancelClick(evt, {
			fromX: _pos.x,
			fromY: _pos.y,
			toX: screenX,
			toY: screenY
		})) {
			_pos = false;
		}
	}
	var _timestamp = Q.milliseconds();
	Q.Pointer.movement.times.push(_timestamp);
	if (_last && _lastTimestamp) {
		_dist = {
			x: screenX - _last.x,
			y: screenY - _last.y
		};
		var _timeDiff = _timestamp - _lastTimestamp;
		var velocity = {
			x: _dist.x / _timeDiff,
			y: _dist.y / _timeDiff
		};
		Q.Pointer.movement.velocities.push(velocity);
		if (_lastVelocity != null) {
			Q.Pointer.movement.accelerations.push({
				x: (velocity.x - _lastVelocity.x) / _timeDiff,
				y: (velocity.y - _lastVelocity.y) / _timeDiff
			});
		}
		_lastVelocity = velocity;
		var times = Q.Pointer.movement.times;
		var velocities = Q.Pointer.movement.velocities;
		var totalX = 0, totalY = 0;
		var t = _timestamp, tNext;
		for (var i=times.length-1; i>=1; --i) {
			var tNext = times[i];
			if (tNext < _timestamp - 100) break;
			var v = velocities[i-1];
			totalX += v.x * (t-tNext);
			totalY += v.y * (t-tNext);
			t = tNext;
		}
		var tDiff = _timestamp - t;
		Q.Pointer.movement.movingAverageVelocity = tDiff
			? { x: totalX / tDiff, y: totalY / tDiff }
			: Q.Pointer.movement.velocities[velocities.length-1];
		_pointerMoveTimeout = setTimeout(function () {
			// no movement for a while
			var noMovement = {x: 0, y: 0};
			var _timestamp = Q.milliseconds();
			var _timeDiff = _timeDiff - _lastTimestamp;
			var movement = Q.Pointer.movement;
			movement.times.push(_timestamp);
			movement.velocities.push(noMovement);
			movement.movingAverageVelocity = noMovement;
			movement.accelerations.push({
				x: -velocity.x / _timeDiff,
				y: -velocity.y / _timeDiff
			});
		}, Q.Pointer.movement.timeout);
	}
	_lastTimestamp = _timestamp;
	_last = {
		x: screenX,
		y: screenY
	};
	Q.Pointer.movement.positions.push(_last);

}

var _onPointerEndHandler = Q.Pointer.ended = function _onPointerEndHandler() {
	setTimeout(function () {
		Q.Pointer.started = null;
	}, 0);
	clearTimeout(_pointerMoveTimeout);
	Q.removeEventListener(window, Q.Pointer.move, _onPointerMoveHandler);
	Q.removeEventListener(window, Q.Pointer.end, _onPointerEndHandler);
	Q.removeEventListener(window, Q.Pointer.cancel, _onPointerEndHandler);
	setTimeout(function () {
		Q.Pointer.canceledClick = false;
	}, 100);
};

/**
 * Operates with dialogs.
 * @class Q.Dialogs
 */
Q.Dialogs = {

	options: {
		topMargin: '10%', // in percentage	
		bottomMargin: '10%' // or in absolute pixel values
	},
	dialogs: [], // internal dialogs collection
	
	/**
	 * Shows the dialog and pushes it on top of internal dialog stack.
	 * @static
     * @method push
	 * @param {Object} options
	 *	 A hash of options, that can include:
     *   "apply": Optional. Set to true if the dialog should show the "apply" style button to close dialog
	 *   "dialog": Optional. If provided, may be Element or jQuery object containing already prepared dialog html
	 *	       structure with 'title_slot', 'dialog_slot' and appropriate content in them. If it's provided, then
	 *           'title' and 'content' options given below are ignored.
	 *	 "url": Optional. If provided, this url will be used to fetch the "title" and "dialog" slots, to display in the dialog.
	 *        Thus the default content provided by 'title' and 'content' options given below will be overridden.
	 *	 "title": Optional. Dialog title, defaults to 'Dialog'.
	 *	 "content": Optional. Dialog content, initially defaults to loading throbber.
	 *   "className": Optional. Maybe a CSS class name or space-separated list of classes to append to the dialog element.
	 *   "mask": Default is true unless fullscreen. If true, adds a mask to cover the screen behind the dialog.
	 *	 "fullscreen": Defaults to true only on Android and false on all other platforms. If true, dialog will be shown not as overlay
	 *								 but instead will be prepended to document.body and all other child elements of the body will be hidden.
	 *								 Thus dialog will occupy all window space, but still will behave like regular dialog, i.e. it can be closed
	 *								 by clicking / tapping close icon.
	 *	 "appendTo": Optional. Can be DOM element, jQuery object or jQuery selector matching element where dialog should be appended.
	 *							 Moreover, dialog is centered relatively to this element. By default it's document body.
	 *   "alignByParent": Defaults to false. If true, the dialog will be aligned to the center of not the entire window,
	 *                    but to the center of containing element instead.
	 *   "noClose": Defaults to false. If true, overlay close button will not appear and overlay won't be closed by pressing 'Esc' key.
	 *   "closeOnEsc": Defaults to true. Indicates whether to close overlay on 'Esc' key press. Has sense only if 'noClose' is false.
	 *   "destroyOnClose": Defaults to false if "dialog" is provided. If true, dialog DOM element will be removed from the document on close.
	 *   "beforeLoad": Optional. Q.Event or function which is called before dialog is loaded.
	 *   "onActivate": Optional. Q.Event or function which is called when dialog is activated
	 *                 (all inner tools, if any, are activated and dialog is fully loaded and shown).
	 *   "beforeClose": Optional. Q.Event or function which is called when dialog closing initiated but it's still visible and exists in DOM.
	 *   "onClose": Optional. Q.Event or function which is called when dialog is closed and hidden and probably 
	 *                 removed from DOM (if 'destroyOnClose' is 'true').
	 * @return {Object}  jQuery object resresenting DOM element of the dialog that was just pushed.
	 */
	push: function(options) {
		var maskDefault = true;
		for (var i = 0; i < this.dialogs.length; i++) {
			if (!this.dialogs[i].isFullscreen) maskDefault = false;
		}
		var o = Q.extend({mask: maskDefault}, Q.Dialogs.push.options, options);
		if (o.fullscreen) o.mask = false;
		var dialog = $(o.dialog);
		if (!dialog.length) {
			// create this dialog element
			dialog = $('<div />').append(
				$('<div class="title_slot" />').append($('<h2 class="Q_dialog_title" />').append(o.title))
			).append(
				$('<div class="dialog_slot Q_dialog_content" id="dialog_slot" />').append(o.content)
			);
			if (o.className) dialog.addClass(o.className);
			if (o.apply) dialog.addClass('Q_overlay_apply');
			if (o.destroyOnClose !== false) o.destroyOnClose = true;
		}
		dialog.hide();
		//if (dialog.parent().length == 0) {
			$(o.appendTo || $('body')[0]).append(dialog);
		//}
		var _onClose = o.onClose;
		o.onClose = new Q.Event(function() {
			Q.handle(o.onClose.original, dialog, [dialog]);
			if (!Q.Dialogs.dontPopOnClose)
				Q.Dialogs.pop(true);
			Q.Dialogs.dontPopOnClose = false;
		}, 'Q.Dialogs');
		o.onClose.original = _onClose;
		dialog.plugin('Q/dialog', o);
		var topDialog = null;
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
	 * @static
     * @method pop
	 * @param {Boolean} dontTriggerClose is for internal use only
	 * @return {Object}  jQuery object resresenting DOM element of the dialog that was just popped.
	 */
	pop: function(dontTriggerClose) {
		if (dontTriggerClose === undefined) {
			dontTriggerClose = false;
		}
		
		var dialog = this.dialogs.pop();
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
		if (!this.dialogs.length) {
			Q.Mask.hide('Q.screen.mask');
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
	'fullscreen': Q.info.isAndroid(undefined, 1000),
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
 */

/**
 * Provides replacement for default javascript alert() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message and button label.
 * 
 * @static
 * @method alert
 * @param {String} message The only required parameter, this specifies text of the alert.
 * @param {Object} [options] An optiopnal hash of options which can include:
 *   @param {String} [options.title] Optional parameter to override alert dialog title. Defaults to 'Alert'.
 *   @param {Q.Event} [options.onClose] Optional, occurs when dialog is closed
 */
Q.alert = function(message, options) {
	if (options === undefined) options = {};
	if (options.title === undefined) options.title = 'Alert';
	var dialog = Q.Dialogs.push(Q.extend({
		'title': options.title,
		'content': '<div class="Q_messagebox"><p>' + message + '</p></div>',
		'onClose': options.onClose || undefined,
		'fullscreen': false,
		'hidePrevious': false
	}, options));
	return dialog;
};

/**
 * Provides replacement for default javascript confirm() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, conrirmation message and buttons.
 * The only major difference from regular confirm is that this implementation doesn't stop JS execution
 * and thus it's impossible to synchronously return true | false when user presses 'Ok' or 'Cancel' and
 * thereby callback is used to pass the user decision result.
 * 
 * @static
 * @method confirm
 * @param {String} message The only required parameter, this specifies confirmation text.
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing true | false depending on whether user clicked (tapped) 'Ok' or 'Cancel' button, respectively
 *   or null if the user closed the dialog.
 * @param {Object} [options] An optiopnal hash of options which can include:
 *   "title": Optional string parameter to override confirm dialog title. Defaults to 'Confirm'.
 *   "ok": Optional string parameter to override confirm dialog 'Ok' button label, e.g. 'Yes'. Defaults to 'Ok'.
 *   "cancel": Optional string parameter to override confirm dialog 'Cancel' button label, e.g. 'No'. Defaults to 'Cancel'.
 *   "noClose": Defaults to true. Set to false to show a close button
 *   "onClose": Optional, occurs when dialog is closed
 */
Q.confirm = function(message, callback, options) {
	var o = Q.extend({
		title: 'Confirm',
		ok: 'OK',
		cancel: 'Cancel',
		noClose: true
	}, options);
	var buttonClicked = false;
	var dialog = Q.Dialogs.push(Q.extend({
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
	}, options));
	dialog.find('button:first').on(Q.Pointer.end, function() {
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, window, [true]);
	});
	dialog.find('button:last').on(Q.Pointer.end, function() {
		buttonClicked = true;
		Q.Dialogs.pop();
		Q.handle(callback, window, [false]);
	});
	return dialog;
};

/**
 * Provides replacement for default javascript prompt() using Q front-end features, specifically dialogs.
 * Shows dialog with customizable title, message, input field placeholder and button label.
 * Unlike a regular JS prompt, the entered value is passed asynchronously using callback.
 * @static
 * @method prompt
 * @param {String} [message='Enter a value'] Optional, specifies text before input field useful to ask
 *   user to enter something (e.g. 'Enter your name').
 * @param {Function} callback: This will be called when dialog is closed,
 *   passing the entered value as a string, or null if the dialog was dismissed with the close button
 * @param {Object} [options] An optional hash of options which can include:
 *   "title": Optional parameter to override confirm dialog title. Defaults to 'Prompt'.
 *   "placeholder": Optional, used as a placeholder text in the input field. Defaults to 'Enter value'.
 *   "ok": Optional parameter to override confirm dialog 'Ok' button label, e.g. 'Yes'. Defaults to 'OK'.
 *   "noClose": Defaults to true. Set to false to show a close button.
 *   "onClose": Optional, occurs when dialog is closed
 */
Q.prompt = function(message, callback, options) {
	if (options === undefined) options = {};
	var o = Q.extend({
		title: 'Prompt',
		ok: 'OK',
		message: message,
		placeholder: '',
		noClose: true
	}, options);
	if (!o.message) o.message = 'Enter value:';
	var buttonClicked = false;
	var dialog = Q.Dialogs.push(Q.extend({
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
				.plugin('Q/clickfocus')
				.on('keydown', function (event) {
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
	}, options));
	dialog.find('button').on(Q.Pointer.click, _done);
	return dialog;
	function _done() {
		buttonClicked = true;
		var value = dialog.find('input').val();
		Q.Dialogs.pop();
		Q.handle(callback, this, [value]);
	}
};

/**
 * Operates a collection of masks, covering screen for some purposes or providing some splash screens.
 * @class Q.Mask
 * @namespace Q
 * @static
 */
Q.Mask = {
	
	/**
	 * Property to store masks in hash indexed by mask key.
	 * @static
	 * @property collection
	 * @type Object
	 * @private
	 */
	collection: {},

	/**
	 * Creates new mask with given key and options.
	 * @static
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
		var $ = window.jQuery;
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
		var width = options.sizeMatcher && $(options.sizeMatcher).width() ? $(options.sizeMatcher).width() : Q.Pointer.windowWidth();
		var height = options.sizeMatcher && $(options.sizeMatcher).height() ? $(options.sizeMatcher).height() : Q.Pointer.windowHeight();
		var mask = $('<div class="' + options.className + '" />');
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
	 * @static
	 * @method show
	 * @param {String} key A string key to of the mask to show.
	 * @param {Object} [options] A hash of additional options which are same as for create and used to override initial mask options.
	 *                           but only for one show() call (they are restored back after mask is hidden).
	 */
	show: function(key, options)
	{
		if (!(key in Q.Mask.collection)) {
			if (key in Q.Mask.options) {
				Q.Mask.create(key, Q.Mask.options[key]);
			} else {
				throw new Error("Mask with key '" + key + "' doesn't exist");
			}
		}
		if (options === undefined) options = {};
		var mask = Q.Mask.collection[key];
		if (!mask.shows) {
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
	 * @static
	 * @method hide
	 * @param {String} key A key of the mask to hide.
	 */
	hide: function(key)
	{
		var $ = window.jQuery;
		if (!(key in Q.Mask.collection)) return;
		
		var mask = Q.Mask.collection[key];
		if (mask.shows > 0) {
			mask.shows--;
		}
		if (!mask.shows) {
			if (mask.button) {
				$(mask.button).remove();
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
	 * @static
	 * @method get
	 * @param {String} key A key of the mask to get.
	 */
	get: function(key)
	{
		if (key in Q.Mask.collection) {
			return Q.Mask.collection[key];
		} else if (key in Q.Mask.options) {
			Q.Mask.create(key, Q.Mask.options[key]);
			return Q.Mask.collection[key];
		} else {
			throw new Error("Mask with key '" + key + "' doesn't exist");
		}
	},
	
	/**
	 * Updates all masks. This particularly measn it adjusts mask DOM element size, useful when window size changes.
	 * @static
	 * @method update
	 */
	update: function()
	{
		var $ = window.jQuery;
		for (var i in Q.Mask.collection)
		{
			var mask = Q.Mask.collection[i];
			var width = mask.sizeMatcher && $(mask.sizeMatcher).width() ? $(mask.sizeMatcher).width() : Q.Pointer.windowWidth();
			var height = mask.sizeMatcher && $(mask.sizeMatcher).height() ? $(mask.sizeMatcher).height() : Q.Pointer.windowHeight();
			mask.element.css({ 'width': width + 'px', 'height': height + 'px', 'line-height': height + 'px' });
		}
	},
	
	/**
	 * Checks if mask with given key is currently shown. If mask with given key is not found, fails silently.
	 * @static
	 * @method isVisible
	 * @param {String} key A key of the mask to check whether it's visible. 
	 */
	isVisible: function(key)
	{
		if (!(key in Q.Mask.collection)) return false;
		return !!Q.Mask.collection[key].shows;
	},
	
	/**
	 * Checks if the mask with given key is already created and exists in the collection.
	 * @static
	 * @method exists
	 * @param {String} key A key of the mask to check whether it exists. 
	 */
	exists: function(key)
	{
		return (key in Q.Mask.collection);
	}
};

Q.Mask.options = {
	'Q.screen.mask': { 'className': 'Q_screen_mask' },
	'Q.request.load.mask': { 'className': 'Q_load_data_mask', 'fadeTime': 200 },
	'Q.request.cancel.mask': { 'className': 'Q_cancel_mask', 'fadeTime': 200 }
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
 * @method processStylesheets
 */
function processStylesheets() {
	// Complain about some other libraries if necessary
	if (Q.findScript('plugins/Q/js/prefixfree.min.js')) {
		var warning = "Q.js must be included before prefixfree in order to work properly";
		console.warn(warning);
	}
	var links = document.getElementsByTagName('link');
	var slots = processStylesheets.slots;
	for (var i=0; i<links.length; ++i) {
		if (links[i].getAttribute('rel').toLowerCase() !== 'stylesheet') {
			continue;
		}
		var href = links[i].getAttribute('href');
		slots[href] = links[i].getAttribute('data-slot') || null;
	}
}
processStylesheets.slots = {};
processStylesheets(); // NOTE: the above works only for stylesheets included before Q.js and prefixfree.js

Q.addEventListener(window, 'load', Q.onLoad.handle);
Q.onInit.add(function () {
	Q_hashChangeHandler.currentUrl = window.location.href.split('#')[0].substr(Q.info.baseUrl.length + 1);
	if (window.history.pushState) {
		Q.onPopState.set(Q_popStateHandler, 'Q.loadUrl');
	} else {
		Q.onHashChange.set(Q_hashChangeHandler, 'Q.loadUrl');
	}
	Q.onReady.set(function () {
		// renew sockets when reverting to online
		Q.onOnline.set(Q.Socket.reconnectAll, 'Q.Socket');
	}, 'Q.Socket');
	
	//jQuery Tools tooltip and validator plugins configuration
	var tooltipConf = Q.getObject("jQuery.tools.tooltip.conf", window);
	if (tooltipConf) {
		tooltipConf.tipClass = 'Q_tooltip';
		tooltipConf.effect = 'fade';
		tooltipConf.opacity = 1;
		tooltipConf.position = 'bottom center';
		tooltipConf.offset = [0, 0];
	}
	var validatorConf = Q.getObject("jQuery.tools.validator.conf", window);
	if (validatorConf) {
		validatorConf.errorClass = 'Q_errors';
		validatorConf.messageClass = 'Q_error_message';
		validatorConf.position = 'bottom left';
		validatorConf.offset = [0, 0];
	}
	// end of jQuery Tools configuration
	
}, 'Q');

Q.onJQuery.add(function ($) {
	
	Q.Tool.define({
		"Q/inplace": "plugins/Q/js/tools/inplace.js",
		"Q/tabs": "plugins/Q/js/tools/tabs.js",
		"Q/form": "plugins/Q/js/tools/form.js",
		"Q/panel": "plugins/Q/js/tools/panel.js",
		"Q/ticker": "plugins/Q/js/tools/ticker.js",
		"Q/timestamp": "plugins/Q/js/tools/timestamp.js",
		"Q/bookmarklet": "plugins/Q/js/tools/bookmarklet.js",
		"Q/columns": "plugins/Q/js/tools/columns.js",
		"Q/drawers": "plugins/Q/js/tools/drawers.js",
		"Q/expandable": "plugins/Q/js/tools/expandable.js",
		"Q/filter": "plugins/Q/js/tools/filter.js"
	});
	
	Q.Tool.jQuery({
		"Q/placeholders": "plugins/Q/js/fn/placeholders.js",
		"Q/textfill": "plugins/Q/js/fn/textfill.js",
		"Q/autogrow": "plugins/Q/js/fn/autogrow.js",
		"Q/dialog": "plugins/Q/js/fn/dialog.js",
		"Q/flip": "plugins/Q/js/fn/flip.js",
		"Q/gallery": "plugins/Q/js/fn/gallery.js",
		"Q/zoomer": "plugins/Q/js/fn/zoomer.js",
		"Q/listing": "plugins/Q/js/fn/listing.js",
		"Q/hautoscroll": "plugins/Q/js/fn/hautoscroll.js",
		"Q/imagepicker": "plugins/Q/js/fn/imagepicker.js",
		"Q/viewport": "plugins/Q/js/fn/viewport.js",
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

function _Q_loadUrl_fillSlots (res, url, options) {
	var elements = {}, name, elem, pos;
	var osc = options.slotContainer;
	if (Q.isPlainObject(osc)) {
		options.slotContainer = function (slotName) {
			return osc[slotName] || document.getElementById(slotName+"_slot");
		};
	}
	for (name in res.slots) {
		// res.slots will simply not contain the slots that have
		// already been "cached"

		if (name.toUpperCase() === 'TITLE') {
			window.document.title = res.slots[name];
		} else if (elem = options.slotContainer(name, res)) { 
			try {
				Q.replace(elem, res.slots[name], options);
				if (pos = Q.getObject(['Q', 'scroll', url], elem)) {
					elem.scrollLeft = pos.left;
					elem.scrollTop = pos.top;
				}
			} catch (e) {
				debugger; // pause here if debugging
				console.warn('slot ' + name + ' could not be filled');
				console.warn(e);
			}
			elements[name] = elem;
		}
	}
	return elements;
}

Q.loadUrl.options = {
	quiet: false,
	onError: new Q.Event(),
	onLoad: new Q.Event(),
	onLoadStart: new Q.Event(Q.loadUrl.saveScroll, 'Q'),
	onLoadEnd: new Q.Event(),
	onActivate: new Q.Event(),
	slotNames: [],
	slotContainer: function (slotName) {
		return document.getElementById(slotName+"_slot");
	},
	handler: _Q_loadUrl_fillSlots
};

Q.request.options = {
	duplicate: true,
	quiet: true,
	parse: 'json',
	handleRedirects: function (url) {
		Q.handle(url, {
			target: '_self',
			quiet: true
		});
	},
	onLoadStart: new Q.Event(),
	onShowCancel: new Q.Event(),
	onLoadEnd: new Q.Event(),
	onResponse: new Q.Event(),
	onProcessed: new Q.Event(),
	onCancel: new Q.Event(function (error) {
		var msg = Q.firstErrorMessage(error);
		if (msg) {
			console.warn(msg);
		}
	}, 'Q')
};

Q.onReady.set(function _Q_masks() {	
	_Q_restoreScrolling();
	Q.request.options.onLoadStart.set(function(url, slotNames, o) {
		if (o.quiet) return;
		Q.Mask.show('Q.request.load.mask');
	}, 'Q.request.load.mask');
	Q.request.options.onShowCancel.set(function(callback, o) {
		if (o.quiet) return;
		var mask = Q.Mask.get('Q.request.cancel.mask').element;
		var button = mask.children('.Q_load_cancel_button');
		if (!button.length) {
			button = document.createElement('button');
			button.setAttribute('class', 'Q_load_cancel_button');
			button.innerHTML = 'Cancel';
			if (mask[0]) { mask = mask[0]; }
			mask.appendChild(button);
		}
		$(button).off(Q.Pointer.end).on(Q.Pointer.end, callback);
		Q.Mask.show('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.request.options.onLoadEnd.set(function() {
		Q.Mask.hide('Q.request.load.mask');
		Q.Mask.hide('Q.request.cancel.mask');
	}, 'Q.request.load.mask');
	Q.onLayout.handle();
}, 'Q.masks');

if (typeof module !== 'undefined' && typeof process !== 'undefined') {
	// Assume we are in a Node.js environment, e.g. running tests
	module.exports = Q;
} else {
	// We are in a browser environment
	/**
	 * This method restores the old window.Q and returns an instance of itself.
     * @method Q.noConflict
	 * @param {Boolean} extend
	 *  If true, extends the old Q with methods and properties from the Q Platform.
	 *  Otherwise, the old Q is untouched.
	 * @return {Function}
	 *  Returns the Q instance on which this method was called
	 */
	Q.noConflict = function (extend) {
		if (extend) {
			Q.extend(oldQ, Q);
		}
		window.Q = oldQ;
		return Q;
	};
	var oldQ = window.Q;
	window.Q = Q;
}

})(window);