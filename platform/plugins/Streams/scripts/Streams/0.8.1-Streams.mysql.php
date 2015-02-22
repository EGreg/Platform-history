<?php

function Streams_0_8_1_Streams_mysql()
{	
	// template for community stream
	$stream = new Streams_Stream();
	$stream->publisherId = '';
	$stream->name = 'Streams/community/';
	$stream->type = 'Streams/template';
	$stream->title = "Community";
	$stream->content = '';
	$readLevel = Streams::$READ_LEVEL['content'];
	$writeLevel = Streams::$WRITE_LEVEL['join'];
	$adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$stream->save();
	
	// app community stream, for announcements
	$app = Q_Config::expect('Q', 'app');
	$stream = new Streams_Stream();
	$stream->publisherId = $app;
	$stream->name = 'Streams/community/main';
	$stream->type = 'Streams/community';
	$stream->title = "$app Community";
	$stream->save();
}

Streams_0_8_1_Streams_mysql();