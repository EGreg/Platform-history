<?php

/**
 * @module Places-tools
 */

/**
 * Inplace text editor tool to edit the content or attribute of a stream
 * @class Places location
 * @constructor
 * @param {Object} [options] used to pass options
 * @param {Object} [options.miles] array of { miles: title } pairs, defaults to Places/nearby/miles config
 * @param {Object} [options.map] options for the map
 * @param {Number} [options.map.delay=300] how many milliseconds to delay showing the map, e.g. because the container is animating
 * @param {String} [options.map.prompt="img/map.png"] The src of the map graphical prompt when no location has been selected yet
 * @param {Q.Event} [options.onUpdate] this event occurs when the location is updated
 * @param {Q.Event} [options.onUnset] this event occurs when the location is unset
 */
function Places_location_tool($options)
{
	if (empty($options['miles'])) {
		$options['miles'] = array();
		foreach (Q_Config::expect('Places', 'nearby', 'miles') as $m) {
			$options['miles'][$m] = $m === 1 ? "$m mile" : "$m miles";
		}
	}
	if (empty($options['map']['prompt'])) {
		$options['map']['prompt'] = 'plugins/Places/img/map.png';
	}
	
	Q_Response::setToolOptions($options);
	return Q::view("Places/tool/location.php", $options);
}