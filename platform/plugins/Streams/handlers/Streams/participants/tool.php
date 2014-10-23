<?php
	
/**
 * This tool renders the participants in a stream
 * @class Q columns
 * @constructor
 * @param {array}   [options] Provide options for this tool
 *  @param {array}  [options.max] The maximum number of participants to display
 *  @param {array}  [options.publisherId] The publisher's user id
 *  @param {array}  [options.streamName] The stream's name
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
		foreach ($participants as $p) {
			$avatars .= Q::tool("Users/avatar", array(
				'userId' => $p->userId,
				'icon' => true,
				'short' => true
			), $p->userId);
		}
	}
	$div = "<div style='clear: both;'></div>";
	return $avatars.$div;
}