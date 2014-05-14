<?php

function Websites_before_Streams_Stream_save_Websites_bio($params)
{
	$stream = $params['stream'];
	$retrieved = $stream->wasRetrieved();

	if ($retrieved
	and !$stream->wasModified('userId')
	and !$stream->wasModified('bio')
	and !$stream->wasModified('getintouch')) {
		return;
	}

	if (!$retrieved) {
		$user = new Users_User();
		$user->id = $stream->userId;
		if (!$user->retrieve()) {
			throw new Users_Exception_NoSuchUser();
		}

		$title = Streams::displayName($user, array('fullAccess' => true));
		if (isset($title)) {
			$stream->title = $title;
		}
		$stream->icon = Q_Html::themedUrl($user->iconPath());
	}

	$bio = new Websites_Bio();
	$bio->publisherId = $stream->publisherId;
	$bio->streamName = $stream->name;
	$bio->retrieve(null, null, array('ignoreCache' => true));

	foreach (array('userId', 'bio', 'getintouch') as $f) {
		if (!isset($stream->$f)) continue;
		if (isset($bio->$f) and $bio->$f === $stream->$f) continue;
		$bio->$f = $stream->$f;
	}
	if (!isset($bio->bio)) {
		$bio->bio = '';
	}
	if (!isset($bio->getintouch)) {
		$bio->getintouch = 'true';
	}
	Q::event("Websites/bio/save", compact('user', 'stream', 'bio'), "before");
	$bio->save();
}