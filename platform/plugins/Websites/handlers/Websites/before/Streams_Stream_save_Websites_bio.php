<?php

function Websites_before_Streams_Stream_save_Websites_bio($params)
{
	$stream = $params['stream'];
	
	$b = new Websites_Bio();
	$b->publisherId = $stream->publisherId;
	$b->streamName = $stream->name;
	if ($stream->wasRetrieved()) {
		$b->retrieve();
	} else {
		$user = new Users_User();
		$user->id = $stream->userId;
		if (!$user->retrieve()) {
			throw new Users_Exception_NoSuchUser();
		}
		$stream->title = Streams::displayName($user, null, array('fullAccess' => true));
		$stream->icon = Q_Html::themedUrl($user->iconPath());
	}
	$changed = false;
	foreach (array('bio', 'userId') as $f) {
		if (isset($stream->$f)) {
			if (!isset($b->$f) or $b->$f !== $stream->$f) {
				$b->$f = $stream->$f;
				$changed = true;
			}
		}
	}
	if ($changed) {
		$b->save();
	}
}