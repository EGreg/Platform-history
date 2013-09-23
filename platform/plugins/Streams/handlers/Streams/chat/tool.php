<?php

/**
 * Renders chat tool.
 * @param $options
 * An associative array of parameters, which can include:
 *   "publisherId" => Required. Publisher id of the stream to get messsages from.
 *   "streamName" => Required. Name of the stream to get messsages from.
 *   "loadMore" => Optional. May have one these values: 'scroll', 'click' or 'pull' which indicates what kind of algorithm
 *     will be used for loading new messages. 'scroll' means that new messages will be loaded when scrollbar
 *     of the chat cointainer reaches the top (for desktop) or whole document scrollbar reaches the top (for android).
 *     'click' will show label with 'Click to see earlier messages' and when user clicks it, new messages will be loaded.
 *     Finally, 'pull' implements 'pull-to-refresh' behavior used in many modern applications today when new messages
 *     loaded by rubber-scrolling the container by more amount than it actually begins.
 *     Defaults to 'scroll' for desktop and Android devices and 'pull' for iOS devices.
 *   "amountToLoad" => Optional. Amount of messages to load on each request. Defaults to 3.
 * @return string
*/
function Streams_chat_tool($options)
{
	$user = Users::loggedInUser(true);
	if (!$user) return '';
	
	if (empty($options['publisherId']))
	{
		throw new Q_Exception("Streams/chat: please provide 'publisherId' parameter.");
	}
	if (empty($options['streamName']))
	{
		throw new Q_Exception("Streams/chat: please provide 'streamName' parameter.");
	}
	$defaults = array(
		'loadMore' => (Q_Request::isTouchscreen() && Q_Request::platform() != 'android') ? 'pull' : 'scroll',
		'amountToLoad' => 3
	);
	$options = array_merge($defaults, $options);
	
	// fetching existing messages
	$stream = new Streams_Stream();
	$stream->publisherId = $options['publisherId'];
	$stream->name = $options['streamName'];
	$messages = $stream->getMessages(array('type' => 'Streams/chat/message', 'max' => -1, 'limit' => 10));
	$messages = array_reverse($messages);
	
	Q_Response::addScript('plugins/Q/js/phpjs.js');
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	Q_Response::addStylesheet('plugins/Streams/css/Streams.css');
	Q_Response::setToolOptions($options);
	return Q::view('Streams/tool/chat.php', compact('params', 'user', 'messages'));
}
