(function (Q, $) {
	/**
	 * Q Tools
	 * @module Q-tools
	 */

	/**
	 * This tool makes a timestamp which is periodically updated.
	 * Initially shows time offsets in '<some_time> ago' manner.
	 * Later represents time depending on format,
	 * wisely excluding unnecessary detais
	 * (i.e. 'year' if timestamp has been made this year, 'year' and 'month if in this month etc).
	 * @class Q timestamp
	 * @constructor
	 * @param {Object} [options] This is an object of parameters for this tool
	 *    @param {Number} [options.time] Unix timestamp (in seconds).
	 *    @default 'new Date().getTime() / 1000'
	 *    @param {String} [options.format] formatting string which makes specific timestamp representation. Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
	 *         Including time, time-day, time-week, day, day-week, longday, longday-week, date, date+week, year, year+year
	 *    @default '%a %b %#d %Y at %H:%M:%S'
	 */

	Q.Tool.jQuery('Q/timestamp', function (o) {
		var time = o.time || Date.now() / 1000;

		var $this = $(this),
			state = $this.state('Q/timestamp');

		function update() {
			var needZeroCorrection = o.format.indexOf('%#d') != -1;
			var format = o.format.replace('%#d', '%d');
			var curTime = Date.now() / 1000;
			var result = '';

			// regular formatting using strftime()
			if (curTime - time > 3600 * 24 * 7 * 365) {
				result = strftime(format, time);
			} else if (curTime - time > 3600 * 24 * 7) {
				format = format.replace('%Y', '').replace('    ', ' ').trim();
				result = strftime(format, time);
			} else if (curTime - time > 3600 * 24) {
				format = format.replace(/%Y|%d|%b/g, '').replace(/\s+/g, ' ').trim();
				result = strftime(format, time);
			} else if (curTime - time > 3600 * 2) {
				result = Math.floor((curTime - time) / 3600) + ' hours ago';
			} else if (curTime - time > 3600) {
				result = '1 hour ago';
			} else if (curTime - time > 60 * 2) {
				result = Math.floor((curTime - time) / 60) + ' minutes ago';
			} else if (curTime - time > 60) {
				result = '1 minute ago';
			} else if (curTime - time > 10) {
				result = Math.floor(curTime - time) + ' seconds ago';
			} else {
				result = 'seconds ago';
			}

			if (needZeroCorrection) {
				result = result.replace(/\s0(\d+)/g, ' $1');
			}

			// special formatting
			if (result.indexOf('{time') != -1) {
				if (result.indexOf('{time-week}') != -1 && curTime - time > 3600 * 24 * 7) {
					result = result.replace('{time-week}', '').replace(/\s+/g, ' ').trim();
				} else if (result.indexOf('{time-day}') != -1 && curTime - time > 3600 * 24) {
					result = result.replace('{time-day}', '').replace(/\s+/g, ' ').trim();
				} else {
					result = result.replace(/\{time-week\}|\{time-day\}|\{time\}/g, strftime('%X', time));
				}
			}

			if (result.indexOf('{day') != -1) {
				if (result.indexOf('{day-week}') != -1 && curTime - time > 3600 * 24 * 7) {
					result = result.replace('{day-week}', '').replace(/\s+/g, ' ').trim();
				} else {
					result = result.replace(/\{day-week\}|\{day\}/g, strftime('%a', time));
				}
			}

			if (result.indexOf('{day') != -1) {
				if (result.indexOf('{day-week}') != -1 && curTime - time > 3600 * 24 * 7) {
					result = result.replace('{day-week}', '').replace(/\s+/g, ' ').trim();
				} else {
					result = result.replace(/\{day-week\}|\{day\}/g, strftime('%a', time));
				}
			}

			if (result.indexOf('{longday') != -1) {
				if (result.indexOf('{longday-week}') != -1 && curTime - time > 3600 * 24 * 7) {
					result = result.replace('{longday-week}', '').replace(/\s+/g, ' ').trim();
				} else {
					result = result.replace(/\{longday-week\}|\{longday\}/g, strftime('%A', time));
				}
			}

			if (result.indexOf('{date') != -1) {
				if (result.indexOf('{date+week}') != -1) {
					if (curTime - time > 3600 * 24 * 7) {
						result = result.replace('{date+week}', strftime('%b %d', time));
					} else {
						result = result.replace('{date+week}', '').replace(/\s+/g, ' ').trim();
					}
				} else if (result.indexOf('{date}') != -1) {
					result = result.replace('{date}', strftime('%b %d', time));
				}
			}

			if (result.indexOf('{year') != -1) {
				if (result.indexOf('{year+year}') != -1) {
					if (result.indexOf('{year+year}') != -1 && curTime - time > 3600 * 24 * 365) {
						result = result.replace('{year+year}', strftime('%Y', time));
					} else {
						result = result.replace('{year+year}', '').replace(/\s+/g, ' ').trim();
					}
				} else {
					result = result.replace('{year}', strftime('%Y', time));
				}
			}

			if (state.beforeUpdate.handle.call($this, result) === false) {
				return;
			}

			$this.html(result);
		}

		Q.addScript("plugins/Q/js/phpjs.js", function (){
			update();
			var elapsed = Date.now() - time * 1000;
			setTimeout(function () {
				update();
				setInterval(update, 60000);
			}, 60000 - elapsed || 60000);
		});
	}, {
		time: null,
		format: '%a %b %#d %Y at %H:%M:%S',
		beforeUpdate: new Q.Event()
	});
})(Q, jQuery);