<?php

function Streams_after_Q_file_save($params)
{
	$user = Users::loggedInUser(true);
	$path = $subpath = $name = $writePath = $data = $tailUrl = null;
	extract($params, EXTR_OVERWRITE);
	if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's associated file was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$filesize = filesize($writePath.DS.$name);
	$url = $tailUrl;
	$url = Q_Valid::url($url) ? $url : Q_Request::baseUrl().'/'.$url;
	$stream->setAttribute('file.url', $url);
	$stream->setAttribute('file.size', $filesize);
	$stream->title = $name;
	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}
}