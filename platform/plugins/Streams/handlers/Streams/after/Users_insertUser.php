<?php

function Streams_after_Users_insertUser($params)
{
	$user = $params['user'];
	Q::log($user);
	
	// Create some standard labels
	$label = new Users_Label();
	$label->userId = $user->id;
	$label->label = 'Streams/invited';
	$label->icon = 'Streams/labels/invited';
	$label->title = 'Invited';
	$label->save(true);
	
	$label2 = new Users_Label();
	$label2->userId = $user->id;
	$label2->label = 'Streams/invitedBy';
	$label2->icon = 'Streams/labels/invitedBy';
	$label2->title = 'Invited By';
	$label2->save(true);
}