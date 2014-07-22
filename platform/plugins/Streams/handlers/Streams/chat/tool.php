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

	extract($options);

	$options = array_merge(array(
		'loadMore'         => (Q_Request::isTouchscreen() && Q_Request::platform() != 'android') ? 'click' : 'scroll',
		'messagesToLoad'   => 5,
		'messageMaxHeight' => 200
	), $options);

	if (!isset($publisherId)) {
		$publisherId = Streams::requestedPublisherId(true);
	}

	if (!isset($streamName)) {
		$streamName = Streams::requestedName();
	}

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => compact('publisherId', 'streamName')
		));
	}

	$options['userId'] = $user->id;

	if (!isset($options['notLoggedIn'])) {
		$options['notLoggedIn'] = 'You Not Logged In';
	}

	if (!isset($options['notAuthorized'])) {
		$options['notAuthorized'] = 'You Not Authorized';
	}

	Q_Response::setToolOptions($options);
}