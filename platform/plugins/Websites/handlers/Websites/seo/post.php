<?php

function Websites_seo_post()
{
	if (empty($_REQUEST['streamName'])) {
		throw new Q_Exception_RequiredField(array('field' => 'streamName'));
	}
	$prefix = "Websites/seo/";
	if (substr($_REQUEST['streamName'], 0, strlen($prefix)) !== $prefix) {
		throw new Q_Exception_WrongValue(array(
			'field' => 'streamName',
			'range' => "string beginning with $prefix"
		));
	}
	$user = Users::loggedInUser(true);
	$publisherId = Q_Config::expect("Websites", "user", "id");
	$type = "Websites/seo";
	if (!Streams::isAuthorizedToCreate($user->id, $publisherId, $type)) {
		throw new Users_Exception_NotAuthorized();
	}
	$stream = new Streams_Stream($publisherId);
	$stream->publisherId = $publisherId;
	$stream->name = $_REQUEST['streamName'];
	$stream->type = $type;
	$stream->save();
	
	// should we subscribe to this stream?
	
	Q_Response::setSlot('stream', $stream->exportArray());
}