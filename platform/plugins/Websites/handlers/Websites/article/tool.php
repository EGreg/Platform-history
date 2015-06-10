<?php

/**
 * Websites tools
 * @module Websites-tools
 */

/**
 * This tool generates an HTML article viewer that lets authorized users edit the article.
 * @class Websites article
 * @constructor
 * @param {Object} [$options] parameters for the tool
 *   @param {String} $options.publisherId The article publisher's user id
 *   @param {String} $options.streamName The article's stream name
 *   @param {String} [$options.html=array()] Any additional for the Streams/html editor
 *   @param {String} [$options.getintouch=array()] Additional options for the Users/getintouch tool, in case it's rendered
 */
function Websites_article_tool($params)
{
	$publisherId = $params['publisherId'];
	$streamName = $params['streamName'];
	$article = Streams::fetchOne(null, $publisherId, $streamName);
	$getintouch = array_merge(array(
		'user' => $article->userId,
		'email' => true,
		'sms' => true,
		'call' => true,
		'between' => "",
		'emailSubject' => 'Reaching out from your website',
		'classes' => 'Q_button Q_clickable'
	), Q::ifset($params, 'getintouch', array()));
	$edit = $article->testWriteLevel('edit');
	if ($article->getintouch) {
		if (is_array($git = json_decode($article->getintouch, true))) {
			$getintouch = array_merge($getintouch, $git);
		}
	}
	$html = Q::ifset($params, 'html', array());
	$article->addPreloaded();
	Q_Response::addStylesheet('plugins/Websites/css/Websites.css');
	Q_Response::addScript("plugins/Websites/js/Websites.js");
	Q_Response::setToolOptions($params);
	return Q::view("Websites/tool/article.php", 
		compact('article', 'getintouch', 'edit', 'html')
	);
}