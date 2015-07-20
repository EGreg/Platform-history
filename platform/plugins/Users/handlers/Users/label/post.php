<?php

/**
 * Adds a label to the system. Fills the "label" slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.title The title of the label
 * @param {string} [$_REQUEST.icon] Optional path to an icon
 */
function Users_label_post()
{
	Q_Request::requireFields('title');
	
	$icon = Q::ifset($_REQUEST, 'icon', null);
	$prefix = 'Streams';
	
	$title = $_REQUEST['title'];
	$label = new Users_Label();
	$label->userId = Users::loggedInUser(true)->id;
	$label->label = 'Users/' . Q_Utils::normalize($title);
	if ($label->retrieve()) {
		throw new Users_Exception_LabelExists();
	}
	$label->icon = 
	$label->title = $title;
	$label->save();
	Q_Response::setSlot('label', $label->exportArray());
}