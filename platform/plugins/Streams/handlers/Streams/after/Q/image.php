<?php

function Streams_after_Q_image($params)
{
	$user = $path = $subpath = $data = $save = null;
	extract($params, EXTR_OVERWRITE);
	if (empty(Streams::$cache['canWriteToStream'])) {
		return;
	}
	$stream = Streams::$cache['canWriteToStream'];
	$stream->icon = Q_Request::baseUrl().'/'.$data[''];
	$to_save = array('icon' => $stream->icon);
	$sizes = array_keys($save);
	$stream->setAttribute('sizes', $sizes);
	$stream->save();
	$stream->post($user->id, array(
		'type' => 'Streams/edited',
		'content' => '',
		'instructions' => $to_save
	));
}