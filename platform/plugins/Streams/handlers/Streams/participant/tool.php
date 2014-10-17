<?php

/**
 * @param $options
 *  An array of parameters, which can include the following fields:
 *  "max" => The maximum number of participants to display
 */
function Streams_participant_tool($options)
{
 	$publisherId = Streams::requestedPublisherId(true);
 	$streamName = Streams::requestedName(true);
	
	$max = Q_Config::get(
		'Streams', 'participants', 'max', 
		Q::ifset($options, 'max', 10)
	);
	$participants = Streams_Participant::select('*')
		->where(compact('publisherId', 'streamName'))
		->limit($max)
		->fetchDbRows();
		
	$userIds = array();
	foreach ($participants as $p) {
		$userIds[] = $p->userId;
	}
	if ($userIds) {
		$avatars = Streams_Avatar::select('*')
			->where(array('publisherId' => $userIds))
			->fetchDbRows();
	} else {
		$avatars = array();
	}
	return Q::view('Streams/tool/participants.php', compact('participants', 'avatars'));
		/*
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
	Q_Response::setToolOptions($options);
	
	$participants = array();
	for ($i = 0; $i < 10; $i++)
	{
		$participants[] = array(
			'avatar' => Q_Html::themedUrl('img/sample/user_avatar.png'),
			'name' => 'User #' . ($i + 1)
		);
	}
	return Q::view('Streams/tool/participants.php', compact('participants'));
	*/
}
