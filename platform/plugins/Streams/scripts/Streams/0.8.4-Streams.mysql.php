<?php

function Streams_0_8_4_Streams_mysql()
{	
	$app = Q_Config::expect('Q', 'app');
	
	$user = new Users_User();
	$user->id = $app;
	$user->username = $app;
	$user->url = Q_Config::expect('Q', 'web', 'appRootUrl');
	$user->signedUpWith = 'none';
	$user->save(true); // insert avatar rows and other stuff
	
	// access stream for managing app roles
	$stream = new Streams_Stream();
	$stream->publisherId = $app;
	$stream->name = 'Streams/contacts';
	$stream->type = 'Streams/access';
	$stream->title = "Contacts";
	$stream->setAttribute('prefixes', array("Users/", "$app/"));
	$stream->save(true);
	
	// access stream for managing app roles
	$stream = new Streams_Stream();
	$stream->publisherId = $app;
	$stream->name = 'Streams/labels';
	$stream->type = 'Streams/access';
	$stream->title = "Labels";
	$stream->setAttribute('prefixes', array("Users/", "$app/"));
	$stream->save(true);
	
	// access for managing app contacts
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/contacts';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save(true);
	
	// access for managing app roles
	$access = new Streams_Access();
	$access->publisherId = $app;
	$access->streamName = 'Streams/labels';
	$access->ofUserId = '';
	$access->ofContactLabel = "$app/admins";
	$access->readLevel = Streams::$READ_LEVEL['messages'];
	$access->writeLevel = Streams::$WRITE_LEVEL['edit'];
	$access->adminLevel = Streams::$ADMIN_LEVEL['manage'];
	$access->save(true);
}

Streams_0_8_4_Streams_mysql();