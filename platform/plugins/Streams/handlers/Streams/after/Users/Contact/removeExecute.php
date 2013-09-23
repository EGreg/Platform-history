<?php

function Streams_after_Users_Contact_removeExecute($params)
{	
	// Update avatar as viewed by everyone who was in that contacts list
	$contacts =	Streams::$cache['contacts_removed'];
	foreach ($contacts as $contact) {
		Streams::updateAvatar($contact->userId, $contact->contactUserId);
	}
}