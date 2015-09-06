<?php

function Streams_after_Q_file_save($params)
{
	$user = Users::loggedInUser(true);
	$path = $subpath = $basename = $writePath = $data = null;
	extract($params, EXTR_OVERWRITE);
	if (!empty(Streams::$cache['canWriteToStream'])) {
		// some stream's associated file was being changed
		$stream = Streams::$cache['canWriteToStream'];
	}
	if (empty($stream)) {
		return;
	}
	$filesize = filesize($writePath.DS.$basename);
	$url = $data[$basename];
	$url = Q_Valid::url($url) ? $url : Q_Request::baseUrl().'/'.$url;
	$stream->setAttribute('file.url', $url);
	$stream->setAttribute('file.size', $filesize);
	if (empty(Streams::$beingSavedQuery)) {
		$stream->changed($user->id);
	} else {
		$stream->save();
	}
}