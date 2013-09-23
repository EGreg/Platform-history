(function ($) {

/**
 * Q/timestamp tool.
 * Makes a timestamp which is periodically updated.
 * Initially shows time offsets in '<some_time> ago' manner. Later represents time depending on format,
 * wisely excluding unnecessary detais (i.e. 'year' if timestamp has been made this year, 'year' and 'month if in this month etc).
 * @param options Object
 *   A hash of options, which can include:
 *   "time": Unix timestamp (in seconds), defaults to value of 'new Date().getTime() / 1000'.
 *   "format": formatting string which makes specific timestamp representation.
 *   Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 */
$.fn.timestamp = function(options)
{
  var o = {
    'time': new Date().getTime() / 1000,
    'format': '%a %b %#d %Y at %H:%M:%S'
  };
  Q.extend(o, options);

  return this.each(function()
  {
    var $this = $(this);
    function update()
    {
      var needZeroCorrection = o.format.indexOf('%#d') != -1;
      var format = o.format.replace('%#d', '%d');
      var curTime = new Date().getTime() / 1000;
      var result = '';

      // regular formatting using strftime()
      if (curTime - o.time > 3600 * 24 * 7 * 365)
      {
        result = strftime(format, o.time);
      }
      else if (curTime - o.time > 3600 * 24 * 7)
      {
        format = format.replace('%Y', '').replace('  ', ' ').trim();
        result = strftime(format, o.time);
      }
      else if (curTime - o.time > 3600 * 24)
      {
        format = format.replace(/%Y|%d|%b/g, '').replace(/\s+/g, ' ').trim();
        result = strftime(format, o.time);
      }
      else if (curTime - o.time > 3600 * 2)
      {
        result = Math.floor((curTime - o.time) / 3600) + ' hours ago';
      }
      else if (curTime - o.time > 3600)
      {
        result = '1 hour ago';
      }
      else if (curTime - o.time > 60 * 2)
      {
        result = Math.floor((curTime - o.time) / 60) + ' minutes ago';
      }
      else if (curTime - o.time > 60)
      {
        result = '1 minute ago';
      }
      else if (curTime - o.time > 10)
      {
        result = Math.floor(curTime - o.time) + ' seconds ago';
      }
      else
      {
        result = 'seconds ago';
      }

      if (needZeroCorrection)
        result = result.replace(/\s0(\d+)/g, ' $1');

      // special formatting
      if (result.indexOf('{time') != -1)
      {
        if (result.indexOf('{time-week}') != -1 && curTime - o.time > 3600 * 24 * 7)
          result = result.replace('{time-week}', '').replace(/\s+/g, ' ').trim();
        else if (result.indexOf('{time-day}') != -1 && curTime - o.time > 3600 * 24)
          result = result.replace('{time-day}', '').replace(/\s+/g, ' ').trim();
        else
          result = result.replace(/\{time-week\}|\{time-day\}|\{time\}/g, strftime('%H:%M', o.time));
      }
      if (result.indexOf('{day') != -1)
      {
        if (result.indexOf('{day-week}') != -1 && curTime - o.time > 3600 * 24 * 7)
          result = result.replace('{day-week}', '').replace(/\s+/g, ' ').trim();
        else
          result = result.replace(/\{day-week\}|\{day\}/g, strftime('%a', o.time));
      }
      if (result.indexOf('{day') != -1)
      {
        if (result.indexOf('{day-week}') != -1 && curTime - o.time > 3600 * 24 * 7)
          result = result.replace('{day-week}', '').replace(/\s+/g, ' ').trim();
        else
          result = result.replace(/\{day-week\}|\{day\}/g, strftime('%a', o.time));
      }
      if (result.indexOf('{longday') != -1)
      {
        if (result.indexOf('{longday-week}') != -1 && curTime - o.time > 3600 * 24 * 7)
          result = result.replace('{longday-week}', '').replace(/\s+/g, ' ').trim();
        else
          result = result.replace(/\{longday-week\}|\{longday\}/g, strftime('%A', o.time));
      }
      if (result.indexOf('{date') != -1)
      {
        if (result.indexOf('{date+week}') != -1)
        {
          if (curTime - o.time > 3600 * 24 * 7)
            result = result.replace('{date+week}', strftime('%b %d', o.time));
          else
            result = result.replace('{date+week}', '').replace(/\s+/g, ' ').trim();
        }
        else (result.indexOf('{date}') != -1)
        {
          result = result.replace('{date}', strftime('%b %d', o.time));
        }
      }
      if (result.indexOf('{year') != -1)
      {
        if (result.indexOf('{year+year}') != -1)
        {
          if (result.indexOf('{year+year}') != -1 && curTime - o.time > 3600 * 24 * 365)
            result = result.replace('{year+year}', strftime('%Y', o.time));
          else
            result = result.replace('{year+year}', '').replace(/\s+/g, ' ').trim();
        }
        else
        {
          result = result.replace('{year}', strftime('%Y', o.time));
        }
      }

      $this.html(result);
    }
    update();
    setInterval(update, 60000);
  });
};

Q.Tool.constructors['q_timestamp'] = function(options)
{
  var toolDiv = $('#' + prefix + 'tool');
  toolDiv.timestamp(options);
};

})(jQuery);