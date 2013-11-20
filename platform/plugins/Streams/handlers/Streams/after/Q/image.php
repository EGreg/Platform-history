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
	$to_save = array('icon' => $stream->icon);
	$stream->save();
	$stream->post($user->id, array(
		'type' => 'Streams/edited',
		'content' => '',
		'instructions' => $to_save
	));
}