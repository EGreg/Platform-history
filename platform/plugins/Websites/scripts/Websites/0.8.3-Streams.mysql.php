<?php

function Websites_0_8_3_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	
	// access for managing app contacts
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/community*';
	$access->ofUserId = '';
	$access->ofContactLabel = "Websites/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
}

Websites_0_8_3_Streams_mysql();