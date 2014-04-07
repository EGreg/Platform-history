<?php
	
function Websites_bio_put()
{
	// only a logged-in user can do this
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	$bio = Streams::fetchOne($user->id, $publisherId, $name);
	if (!$bio) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	$bio->getintouch = isset($_REQUEST['getintouch'])
		? $_REQUEST['getintouch']
		: '';
	$bio->save();
	Q_Response::setSlot('form', '');
}