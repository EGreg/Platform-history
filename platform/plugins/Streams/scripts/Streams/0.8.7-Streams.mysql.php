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
	
	foreach (array('images', 'image', 'file') as $suffix) {
		Streams_Stream::insert(array(
			'publisherId' => '', 
			'name' => "Streams/$suffix/",
			'type' => 'Streams/template', 
			'title' => 'Untitled File',
			'icon' => 'files/_blank',
			'content' => '',
			'attributes' => null,
			'readLevel' => Streams::$READ_LEVEL['messages'], 
			'writeLevel' => Streams::$WRITE_LEVEL['close'], 
			'adminLevel' => Streams::$ADMIN_LEVEL['invite']
		))->execute();
		Streams_Access::insert(array(
			'publisherId' => '', 
			'streamName' => "Streams/$suffix/",
			'ofUserId' => '',
			'grantedByUserId' => null,
			'ofContactLabel' => "$app/admins",
			'readLevel' => Streams::$READ_LEVEL['messages'], 
			'writeLevel' => Streams::$WRITE_LEVEL['close'], 
			'adminLevel' => Streams::$ADMIN_LEVEL['invite']
		))->execute();
	}
}

Streams_0_8_7_Streams_mysql();