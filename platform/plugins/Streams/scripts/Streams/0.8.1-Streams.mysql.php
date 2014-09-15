<?php

function Streams_0_8_1_Streams_mysql()
{
	// template for announcements
	$stream = new Streams_Stream();
	$stream->publisherId = '';
	$stream->name = 'Streams/announcement/';
	$stream->type = 'Streams/template';
	$stream->title = 'Announcements';
	$stream->content = '';
	$readLevel = Streams::$READ_LEVEL['none'];
	$writeLevel = Streams::$WRITE_LEVEL['join'];
	$adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$stream->save();
	
	// app announcements
	$stream = new Streams_Stream();
	$stream->publisherId = Q_Config::expect('Q', 'app');
	$stream->name = 'Streams/announcement/main';
	$stream->type = 'Streams/announcement';
	$stream->save();
}

Streams_0_8_1_Streams_mysql();