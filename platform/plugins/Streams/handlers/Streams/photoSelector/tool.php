<?php

/**
 * Renders a photo selector tool
 * @param $options
 *   An associative array of parameters, which can include:
 *   "onSelect" => a string naming the function to call when a photo is clicked. 
 *   "onLoad" => Optional. This callback is called when bunch of photos has been loaded.
 *   "provider" => Optional. Has to be "facebook" for now
 *   "uid" => Optional. The uid of the user on the provider whose photos are shown.
 *   "prompt" => Prompt that appears if the tool is shown but user hasn't granted sufficient permissions yet
 *   "oneLine" => Defaults to false. If true, all the images are shown in a large horizontally scrolling line.
 * @return {void}
 */
function Streams_photoSelector_tool($options)
{
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
	Q_Response::setToolOptions($options);
	return '';
}
