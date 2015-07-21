<?php

/**
 * Removes a contact from the system.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.label The label of the contact
 * @param {string} $_REQUEST.contactUserId The contactUserId of the contact
 * @param {string} [$_REQUEST.userId=Users::loggedInUser(true)->id] You can override the user id, if another plugin adds a hook that allows you to do this
 */
function Users_contact_delete($params = array())
{
	$req = array_merge($_REQUEST, $params);
	Q_Request::requireFields(array('label', 'contactUserId'), $req, true);
	$loggedInUserId = Users::loggedInUser(true)->id;
	$userId = Q::ifset($req, 'userId', $loggedInUserId);
	$label = $req['label'];
	$contactUserId = $req['contactUserId'];
	
	Users::canManageContacts($loggedInUserId, $userId, $label, true);
	
	$contact = new Users_Contact();
	$contact->userId = $userId;
	$contact->label = $label;
	$contact->contactUserId = $contactUserId;
	return $contact->remove();
}