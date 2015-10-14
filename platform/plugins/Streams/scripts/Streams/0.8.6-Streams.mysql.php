<?php

function Streams_0_8_6_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	
	// access for managing communities
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/community*';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
	
	// access for managing categories
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/category/';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save();
	
	// template to help app admins relate things to Streams/category streams
	Streams_Stream::insert(array(
		'publisherId' => $app, 
		'name' => 'Streams/category/',
		'type' => 'Streams/template', 
		'title' => '',
		'icon' => 'Streams/category',
		'content' => '',
		'attributes' => null,
		'readLevel' => Streams::$READ_LEVEL['messages'], 
		'writeLevel' => Streams::$WRITE_LEVEL['relate'], 
		'adminLevel' => Streams::$ADMIN_LEVEL['invite']
	))->execute();
	
	// template to help app admins create subcategories for things
	Streams_RelatedTo::insert(array(
		'toPublisherId' => $app,
		'toStreamName' => 'Streams/category/',
		'type' => 'subcategories',
		'fromPublisherId' => $app,
		'fromStreamName' => 'Streams/category/'
	))->execute();
}

Streams_0_8_6_Streams_mysql();