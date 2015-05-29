<?php

function Websites_after_Streams_fetch_Websites_article($params, &$streams)
{
	if (!$params['retrieved']) {
		return;
	}
	$articles = Websites_Article::select('*')
		->where(array(
			'publisherId' => $params['publisherId'],
			'streamName' => array_keys($params['retrieved'])
		))->fetchDbRows(null, '', 'streamName');

	foreach ($params['retrieved'] as $name => $stream) {
		$stream->article = Q::ifset($articles, $name, 'article', '');
		$stream->userId = Q::ifset($articles, $name, 'userId', '');
		$stream->getintouch = Q::ifset($articles, $name, 'getInTouch', '{}');
	}
}