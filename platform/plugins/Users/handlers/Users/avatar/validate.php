<?php

function Users_avatar_validate()
{
	if (!isset($_REQUEST['userIds'])) {
		throw new Q_Exception_RequiredField(array('field' => 'userIds'), 'userIds');
	}
}