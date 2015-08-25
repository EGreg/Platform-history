<?php

function Streams_0_8_6_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	
	// access for managing app contacts
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/community*';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
}

Streams_0_8_6_Streams_mysql();