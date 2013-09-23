<?php

function Users_avatar_response()
{
	$uids = is_array($_REQUEST['userIds'])
		? $_REQUEST['userIds']
		: explode(",", $_REQUEST['userIds']);
	$users = Users_User::select('id, icon, username')
		->where(array('id' => $uids))
		->fetchDbRows();
	Q_Request::setSlot('avatars', Db::exportArray($users));
}