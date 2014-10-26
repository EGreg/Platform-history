<?php
	
/**
 * This tool renders the participants in a stream
 * @class Q columns
 * @constructor
 * @param {array} [options] Provide options for this tool
 *   @param {string} [options.publisherId] The id of the publisher
 *   @required
 *   @param {string} [options.streamName] The name of the stream
 *   @required
 *   @param {integer} [options.max]
 *    The number, if any, to show in the denominator of the summary
 *   @optional
 *   @param {integer} [options.maxShow]
 *    The maximum number of participants to fetch for display
 *   @optional
 *   @default 10
 *   @param {Q.Event} [options.onRefresh] An event that occurs when the tool is refreshed
 *   @optional
 */
function Streams_participants_tool($options)
{
 	$publisherId = Q::ifset($options, 'publisherId', null);
 	$streamName = Q::ifset($options, 'streamName', null);
	if (!isset($publisherId)) {
		$publisherId = Streams::requestedPublisherId(true);
	}
	if (!isset($streamName)) {
		$streamName = Streams::requestedName(true);
	}
	
	$max = Q_Config::get(
		'Streams', 'participants', 'max', 
		Q::ifset($options, 'max', 10)
	);
	$participants = Streams_Participant::select('*')
		->where(compact('publisherId', 'streamName'))
		->limit($max)
		->fetchDbRows();
	
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
	$options['rendered'] = true;
	Q_Response::setToolOptions($options);
	
	$avatars = '';
	if ($participants) {
		$i = 0;
		foreach ($participants as $p) {
			$avatars .= Q::tool("Users/avatar", array(
				'userId' => $p->userId,
				'icon' => true,
				'short' => true
			), $p->userId);
			if (++$i == $options['maxShow']) {
				break;
			}
		}
	}
	$c = count($participants);
	$count = "<span class='Streams_participants_count'>$c</span>";
	$m = isset($options['max']) ? '/'.$options['max'] : '';
	$max = "<span class='Streams_participants_max'>$m</span>";
	$summary = "<div class='Streams_participants_summary'>$count$max</div>";
	return $avatars.$summary;
}