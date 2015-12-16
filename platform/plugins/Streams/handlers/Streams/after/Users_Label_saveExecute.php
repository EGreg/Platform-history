<?php

function Streams_after_Users_Label_saveExecute($params)
{
	// The nickname was probably modified
	$modifiedFields = $params['modifiedFields'];
	$label = $params['row'];
	$updates = Q::take($params, array('nickname'));
	$updates['userId'] = $label->userId;
	return Streams_Message::post(null, $label->userId, "Streams/contacts", array(
		'type' => 'Streams/contacts/update',
		'instructions' => compact('updates')
	), true);
}