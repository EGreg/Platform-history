/**
 * Q.Promise constructor.
 * Call the .fulfill(...) or .reject(...) method to
 * signal that the promise is fulfilled or rejected.
 * Implemented according to http://promises-aplus.github.io/promises-spec/
 * with two exceptions:
 * 2.2.5) fulfill and reject can in fact accept "this", and pass it on
 * 2.3.3.3.1) the first callback to .then() doesn't treat its arguments specially
 */
Q.Promise = function () {
	this.state = Q.Promise.states.PENDING;
	this._done = [];
	this._fail = [];
	this._progress = [];
	this._args = null;
	this._context = null;
	
	var p = this;
	p.fulfill = function () {
		if (p.state !== Q.Promise.states.PENDING) {
			return p;
		}
		p.state = Q.Promise.states.FULFILLED;
		p._args = Array.prototype.slice.call(arguments, 0);
		p._context = this;
		setTimeout(function () {
			for (var i=0, l=p._done.length; i<l; ++i) {
				var r = p._done[i];
				x = r.handler.apply(p._context, p._args);
				_Q_Promise_resolve(r.promise, x);
			}
			p._done = null;
		});
		return p;
	};

	p.reject = function () {
		if (p.state !== Q.Promise.states.PENDING) {
			return p;
		}
		p.state = Q.Promise.states.REJECTED;
		p._args = Array.prototype.slice.call(arguments, 0);
		p._context = this;
		setTimeout(function () {
			for (var i=0, l=p._fail.length; i<l; ++i) {
				var r = p._fail[i];
				x = r.handler.apply(p._context, p._args);
				if (x !== undefined) {
					_Q_Promise_resolve(r.promise, x);
				}
			}
			p._fail = null;
		});
		return p;
	};

	p.notify = function () {
		if (p.state !== Q.Promise.states.PENDING) {
			return p;
		}
		var context = this;
		var args = Array.prototype.slice.call(arguments, 0);
		setTimeout(function () {
			for (var i=0, l=p._progress.length; i<l; ++i) {
				p._progress[i].handler.apply(context, args);
			}
		});
		return p;
	};
};

Q.Promise.resolve = function (x) {
	var result = new Q.Promise();
	_Q_Promise_resolve(result, x);
	return result;
};

Q.Promise.all = function () {
	var args = Array.prototype.slice.call(arguments, 0);
};

Q.Promise.first = function () {
	var args = Array.prototype.slice.call(arguments, 0);
};

Q.Promise.prototype.then = function (doneHandler, failHandler, progressHandler) {
	var result = new Q.Promise();
	var x;
	try {
		switch (this.state) {
		case Q.Promise.states.FULFILLED:
			if (typeof doneHandler === 'function')  { // 2.2.1.1
				x = doneHandler.apply(this._context, this._args); // 2.2.2.1
			}
			_Q_Promise_resolve(result, x);
			break;
		case Q.Promise.states.REJECTED:
			if (typeof failHandler === 'function') { // 2.2.1.2
				x = failHandler.apply(this._context, this._args); // 2.2.3.1
			}
			if (x !== undefined) {
				_Q_Promise_resolve(result, x);
			} else {
				result.reject.apply(this._context, this._args); // 2.2.7.4
			}
			break;
		default:
			if (typeof doneHandler === 'function') { // 2.2.1.1
				this._done.push({
					handler: doneHandler,
					promise: result
				}); // 2.2.6.1
			}
			if (typeof failHandler === 'function') { // 2.2.1.2
				this._fail.push({
					handler: failHandler,
					promise: result
				}); // 2.2.6.2
			}
			if (typeof progressHandler === 'function') { 
				this._progress.push({ handler: progressHandler });
			}
			if (typeof doneHandler !== 'function' && doneHandler !== null) {
				this._done.push({ handler: result.fulfill }); // 2.2.7.3
			}
			if (typeof failHandler !== 'function' && failHandler !== null) {
				this._fail.push({ handler: result.reject }); // 2.2.7.4
			}
			break;
		}
	} catch (e) {
		result.reject(e); // 2.2.7.2
	}
	return result;
};

function _Q_Promise_resolve(promise, x) {
	if (!promise) {
		return;
	}
	if (x && (x instanceof Q.Promise)) {
		x.done(promise.fulfill); // 2.3.2.2
		x.fail(promise.reject); // 2.3.2.3
	} else {
		var t = x && x.then; // 2.3.3.1
		if (typeof t === 'function') { // 2.3.3.3
			// NOTE: the following does not support the spec completely
			// in that fulfilling and rejecting promises
			// does not handle a special case where a Q.Promise
			// or other thenable is passed to the first argument of t
			t.call(x, promise.fulfill, promise.reject);
		} else {
			promise.fulfill.call(null, x); // 2.3.3.4
		}
	}
}

Q.Promise.prototype.done = function (doneHandler) {
	return this.then(doneHandler, null, null);
};

Q.Promise.prototype.fail = function (failHandler) {
	return this.then(null, failHandler, null);
};

Q.Promise.prototype.progress = function (progressHandler) {
	return this.then(null, null, progressHandler);
};

Q.Promise.prototype.always = function (handler) {
	return this.then(handler, handler, null);
};

Q.Promise.prototype.isPending = function () {
	return this.state === Q.Promise.states.PENDING;
};

Q.Promise.prototype.isFulfilled = function () {
	return this.state === Q.Promise.states.FULFILLED;
};

Q.Promise.prototype.isRejected = function () {
	return this.state === Q.Promise.states.REJECTED;
};

Q.Promise.states = {
	PENDING: 1,
	FULFILLED: 2,
	REJECTED: 3
};