<?php

/**
 * Adds a label to the system. Fills the "label" (and possibly "icon") slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.title The title of the label
 * @param {string} [$_REQUEST.label] You can override the label to use
 * @param {string} [$_REQUEST.icon] Optional path to an icon
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_label_post($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('title'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$icon = Q::ifset($req, 'icon', null);
	$title = $req['title'];
	$l = Q::ifset($req, 'label', 'Users/' . Q_Utils::normalize($title));
	
	Users::canManageLabels($loggedInUserId, $userId, $l, true);
	
	$label = new Users_Label();
	$label->userId = $userId;
	$label->label = $l;
	if ($label->retrieve()) {
		throw new Users_Exception_LabelExists();
	}
	$label->title = $title;
	if (is_array($icon)) { // Process any icon that was posted
		$icon['path'] = 'uploads/Users';
		$icon['subpath'] = "$userId/label/$label/icon";
		$data = Q::event("Q/image/post", $icon);
		Q_Response::setSlot('icon', $data);
		$label->icon = Q_Request::baseUrl().'/'.$data[''];
	} else {
		$label->icon = 'default';
	}
	$label->save();
	Q_Response::setSlot('label', $label->exportArray());
}