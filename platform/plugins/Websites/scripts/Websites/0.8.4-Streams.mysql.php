<?php

function Websites_0_8_4_Streams_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	
	// allow inserting images in articles
	$r = new Streams_RelatedTo();
	$r->toPublisherId = $app;
	$r->toStreamName = 'Websites/article/';
	$r->type = 'images';
	$r->fromPublisherId = $app;
	$r->fromStreamName = 'Streams/image/';
	$r->save();
}

Websites_0_8_4_Streams_mysql();