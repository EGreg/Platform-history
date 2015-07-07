<?php

function Websites_before_Streams_Stream_save_Websites_article($params)
{
	if ($retrieved) return;
	
	$stream = $params['stream'];
	$user = new Users_User();
	if (empty($stream->userId)) {
		throw new Q_Exception_RequiredField(array('field' => 'userId'));
	}
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