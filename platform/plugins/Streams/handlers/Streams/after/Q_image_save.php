<?php

function Streams_after_Q_image_save($params)
{
	$user = Users::loggedInUser(true);
	$path = $subpath = $data = $save = null;
	extract($params, EXTR_OVERWRITE);
	if (isset(Users::$cache['iconUrlWasChanged'])
	and (Users::$cache['iconUrlWasChanged'] === false)) {
		// the logged-in user's icon was changed without the url changing
		$stream = Streams::fetchOne($user->id, $user->id, "Streams/user/icon");
	} else if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's icon was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$stream->icon = Q_Request::baseUrl().'/'.$data[''];
	$sizes = array_keys($save);
	$stream->setAttribute('sizes', $sizes);
	$stream->save();
	$toSave = array('changes' => array(
		'icon' => $stream->icon, 
		'attributes' => $stream->attributes
	));
	$stream->post($user->id, array(
		'type' => 'Streams/edited',
		'content' => '',
		'instructions' => $toSave
	));
}