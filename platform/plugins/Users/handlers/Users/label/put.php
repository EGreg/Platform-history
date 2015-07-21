<?php

/**
 * Edits a label in the system. Fills the "label" (and possibly "icon") slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.label The label
 * @param {string} [$_REQUEST.title] The title of the label
 * @param {string} [$_REQUEST.icon] Optional path to an icon
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_label_put($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('label'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$l = $req['label'];
	$icon = Q::ifset($req, 'icon', null);
	$title = Q::ifset($req, 'title', null);
	
	Users::canManageLabels($loggedInUserId, $userId, $l, true);
	
	$label = new Users_Label();
	$label->userId = $userId;
	$label->label = $l;
	if (!$label->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Label',
			'criteria' => json_encode($label->fields)
		));
	}
	if (isset($title)) {
		$label->title = $title;
	}
	if (is_array($icon)) { // Process any icon data
		$icon['path'] = 'uploads/Users';
		$icon['subpath'] = "$userId/label/$label/icon";
		$data = Q::event("Q/image/post", $icon);
		Q_Response::setSlot('icon', $data);
		$label->icon = Q_Request::baseUrl().'/'.$data[''];
	}
	$label->save();
	Q_Response::setSlot('label', $label->exportArray());
}