<?php

function Websites_0_8_Streams_mysql()
{
	$userId = Q_Config::get("Websites", "user", "id", null);
	if (!$userId) {
		throw new Q_Exception('Websites: Please fill in the config field "Websites"/"user"/"id"');
	}
	
	// $now = Streams::db()->toDateTime(Streams::db()->getCurrentTimestamp());
	
	$publisherId = $userId;
	$ofUserId = '';
	$ofContactLabel = 'Websites/admins';
	$grantedByUserId = null;
	
	$streams = array(
		"Streams/images/" => array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
		"Streams/image/" => array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
		"Websites/article/" => array('type' => "Streams/template", "title" => "", "icon" => "default", "content" => "", "deletable" => true),
		"Websites/seo/" => array('type' => "Streams/template", "title" => "Website SEO", "icon" => Q_Html::themedUrl("plugins/Websites/img/seo"), "content" => "", "deletable" => true),
		"Websites/header" => array('type' => "Streams/image/icon", "title" => "Header image", "icon" => Q_Html::themedUrl("plugins/Websites/img/header"), "content" => ""),
		"Websites/slogan" => array('type' => "Streams/text/small", "title" => "Website slogan", "icon" => "default", "content" => "The coolest website"),
		"Websites/title" => array('type' => "Streams/text/small", "title" => "Website title", "icon" => "default", "content" => "Website Title"),
		"Websites/menu" => array('type' => "Streams/category", "title" => "Website Menu", "icon" => "default", "content" => ""),
		"Websites/articles" => array('type' => "Streams/category", "title" => "Articles", "icon" => "default", "content" => "Articles"),
		"Websites/images" => array('type' => "Streams/category", "title" => "Articles", "icon" => "default", "content" => "Articles"),
	);
	
	$readLevel = Streams::$READ_LEVEL['messages'];
	$writeLevel = Streams::$WRITE_LEVEL['edit'];
	$adminLevel = Streams::$ADMIN_LEVEL['manage'];
	
	$rows = array();
	foreach ($streams as $streamName => $stream) {
		$writeLevel = (!empty($stream['deletable'])) ? 40 : 30;
		$rows[] = compact(
			'publisherId', 'streamName', 'ofUserId', 'ofContactLabel', 
			'grantedByUserId', 'readLevel', 'writeLevel', 'adminLevel'
		);
	}
	
	Streams_Access::insertManyAndExecute($rows);
	
	$attributes = null;
	$closedTime = null;
	$readLevel = Streams::$READ_LEVEL['messages'];
	$writeLevel = Streams::$WRITE_LEVEL['join'];
	$adminLevel = Streams::$ADMIN_LEVEL['invite'];
	$inheritAccess = null;
	
	$rows = array();
	foreach ($streams as $name => $s) {
		extract($s);
		$rows[] = compact(
			'publisherId', 'name', 'type', 'title', 'icon', 'content', 'attributes',
			'readLevel', 'writeLevel', 'adminLevel', 'inheritAccess', 'participantCount'
		);
	}
	
	Streams_Stream::insertManyAndExecute($rows);
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => $publisherId,
		'toStreamName' => 'Streams/images/',
		'type' => 'images',
		'fromPublisherId' => $publisherId,
		'fromStreamName' => 'Streams/image/'
	))->execute();
	
	Streams_RelatedTo::insert(array(
		'toPublisherId' => $publisherId,
		'toStreamName' => 'Streams/articles',
		'type' => 'articles',
		'fromPublisherId' => $publisherId,
		'fromStreamName' => 'Streams/article'
	))->execute();
}

Websites_0_8_Streams_mysql();