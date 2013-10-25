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
	$to_save = array('icon' => $stream->icon);
	$stream->post($user->id, array(
		'type' => 'Streams/edited',
		'content' => '',
		'instructions' => Q::json_encode($to_save)
	));
}