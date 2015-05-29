<?php

function Websites_before_Streams_Stream_save_Websites_article($params)
{
	$stream = $params['stream'];
	$retrieved = $stream->wasRetrieved();

	if ($retrieved
	and !$stream->wasModified('userId')
	and !$stream->wasModified('article')
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
		$s = Streams::fetchOne($user->id, $user->id, "Streams/user/icon");
		if (!$s or !$sizes = $s->getAttribute('sizes', null)) {
			$sizes = Q_Config::expect('Users', 'icon', 'sizes');
		}
		$stream->setAttribute('sizes', $sizes);
	}

	$article = new Websites_Article();
	$article->publisherId = $stream->publisherId;
	$article->streamName = $stream->name;
	$article->retrieve(null, null, array('ignoreCache' => true));

	foreach (array('userId', 'article', 'getintouch') as $f) {
		if (!isset($stream->$f)) continue;
		if (isset($article->$f) and $article->$f === $stream->$f) continue;
		$article->$f = $stream->$f;
	}
	if (!isset($article->article)) {
		$article->article = '';
	}
	if (!isset($article->getintouch)) {
		$article->getintouch = '{}';
	}
	Q::event("Websites/article/save", compact('user', 'stream', 'article'), "before");
	$article->save();
}