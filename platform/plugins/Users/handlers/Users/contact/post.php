<?php

/**
 * Adds contacts to the system. Fills the "contacts" slot.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.label The label of the contact
 * @param {string} $_REQUEST.contactUserId The contactUserId of the contact
 * @param {string} [$_REQUEST.nickname] The nickname of the contact
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_contact_post($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('label', 'contactUserId'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$contactUserId = $req['contactUserId'];
	$nickname = Q::ifset($req, 'nickname', null);
	$l = $req['label'];
	
	if ($userId !== $loggedInUserId) {
		Users_User::fetch($userId, true);
	}
	Users_User::fetch($contactUserId, true);
	Users::canManageContacts($loggedInUserId, $userId, $l, true);
	
	$label = new Users_Label();
	$label->userId = $userId;
	$label->label = $l;
	if (!$label->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'Users_Label',
			'criteria' => json_encode($label->fields)
		));
	}
	
	$contacts = Users_Contact::addContact($userId, $l, $contactUserId, $nickname);
	Q_Response::setSlot('contacts', Db::exportArray($contacts));
}