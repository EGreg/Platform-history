<?php

function Streams_avatar_response()
{
	$user = Users::loggedInUser();
	$asUserId = $user ? $user->id : "";
	if (isset($_REQUEST['prefix'])) {
		$prefix = $_REQUEST['prefix'];
		$limit = isset($_REQUEST['limit']) ? $_REQUEST['limit'] : null;
		$offset = isset($_REQUEST['offset']) ? $_REQUEST['offset'] : null;
		$avatars = Streams_Avatar::fetchByPrefix($asUserId, $prefix, compact('limit', 'offset'));
	} else {
		$uids = is_array($_REQUEST['userIds'])
			? $_REQUEST['userIds']
			: explode(",", $_REQUEST['userIds']);
		$avatars = Streams_Avatar::fetch($asUserId, $uids);
	}
	Q_Response::setSlot('avatars', Db::exportArray($avatars));
}