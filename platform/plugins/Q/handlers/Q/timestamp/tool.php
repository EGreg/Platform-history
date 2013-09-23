<?php

/**
 * Makes a timestamp which is periodically updated.
 * Initially shows time offsets in '<some_time> ago' manner. Later represents time depending on format,
 * wisely excluding unnecessary detais (i.e. 'year' if timestamp has been made this year, 'year' and 'month if in this month etc).
 * @param array $options
 *   An associative array of parameters, which can include:
 *   "time" => Unix timestamp (in seconds), defaults to value of time() call.
 *   "format" => formatting string which makes specific timestamp representation.
 *   Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 * @return string
 */
function Q_timestamp_tool($options)
{
  Q_Response::addScript('plugins/Q/js/tools/timestamp.js');
  Q_Response::addScript('plugins/Q/js/phpjs.js');
  
  $defaults = array(
		'time' => time(),
		'format' => '%a %b %#d %Y at %H:%M:%S',
  );
  $options = array_merge($defaults, $options);
  Q_Response::setToolOptions($options);
  
  @date_default_timezone_set(ini_get('date.timezone'));
  
  $format = $options['format'];
  $passed_time = $options['time'];
  $cur_time = time();
  if ($cur_time - $passed_time > 3600 * 24 * 365)
  {
    return strftime($format, $passed_time);
  }
  else if ($cur_time - $passed_time > 3600 * 24 * 7)
  {
    $format = trim(preg_replace('/\s+/', ' ', str_replace('%Y', '', $format)));
    return strftime($format, $passed_time);
  }
  else if ($cur_time - $passed_time > 3600 * 24)
  {
    $format = trim(preg_replace('/\s+/', ' ', str_replace(array('%Y', '%#d', '%b'), '', $format)));
    return strftime($format, $passed_time);
  }
  else if ($cur_time - $passed_time > 3600 * 2)
  {
    return floor(($cur_time - $passed_time) / 3600) . ' hours ago';
  }
  else if ($cur_time - $passed_time > 3600)
  {
    return '1 hour ago';
  }
  else if ($cur_time - $passed_time > 60 * 2)
  {
    return floor(($cur_time - $passed_time) / 60) . ' minutes ago';
  }
  else if ($cur_time - $passed_time > 60)
  {
    return '1 minute ago';
  }
  else if ($cur_time - $passed_time > 10)
  {
    return ($cur_time - $passed_time) . ' seconds ago';
  }
	else
	{
	  return 'seconds ago';
	}
}
