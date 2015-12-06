<?php

function Streams_0_8_7_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	$user = Users_User::fetch($app, true);
	
	$simulated = array(
		'row' => $user,
		'inserted' => true,
		'modifiedFields' => $user->fields
	);
	Q::event('Db/Row/Users_User/saveExecute', $simulated, 'after');
}

Streams_0_8_7_Streams_mysql();