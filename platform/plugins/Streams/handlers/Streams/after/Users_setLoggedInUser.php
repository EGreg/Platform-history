<?php
	
function Streams_after_Users_setLoggedInUser($params)
{
	// if this the first time the user has ever logged in...
	$user = $params['user'];
	if ($user->sessionCount != 1) {
		return;
	}
	
	// subscribe to app announcements
	$app = Q_Config::expect('Q', 'app');
	$stream = Streams::fetchOne($user->id, $app, 'Streams/community/main');
	if ($stream and !$stream->subscription($user->id)) {
		$stream->subscribe();
	}
}