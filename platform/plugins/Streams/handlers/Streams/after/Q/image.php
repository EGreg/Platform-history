<?php

function Streams_after_Q_image($params)
{
	extract($params);
	
	/**
	 * @var $user
	 * @var $path
	 * @var $subpath
	 * @var $data
	 */
	if (empty(Streams::$cache['canWriteToStream'])) {
		return;
	}
	$stream = Streams::$cache['canWriteToStream'];
	$stream->icon = Q_Request::baseUrl().'/'.$data[''];
	$stream->save();
	$to_save = $stream->toArray();
	$stream->post($user->id, array(
		'type' => 'Streams/edited',
		'content' => '',
		'instructions' => json_encode($to_save)
	));
}