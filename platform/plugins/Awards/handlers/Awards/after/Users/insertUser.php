<?php

function Awards_after_Users_insertUser($params)
{
	// Create a stream for the user's credits
	$user = $params['user'];
	$stream = Awards_Credits::createStream($user);
	$stream->join(array('userId' => $user->id));
}