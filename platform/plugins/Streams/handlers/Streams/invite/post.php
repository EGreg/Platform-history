<?php

/**
 * Invites a user (or a future user) to a stream .
 * @static
 * @param {string} $publisherId
 *  The id of the stream publisher
 * @param {string} $streamName
 *  The name of the stream the user will be invited to
 * @param {array} $who
 *  Array that can contain the following keys:
 *  'userId' => user id or an array of user ids
 *  'fb_uid' => fb user id or array of fb user ids
 *  'label' => label or an array of labels
 *  'identifier' => identifier or an array of identifiers
 * @param {mixed} $options
 *  Array that can contain the following keys:
 *	'label' => the contact label to add to the invited users
 *  'readLevel' => the read level to grant those who are invited
 *  'writeLevel' => the write level to grant those who are invited
 *  'adminLevel' => the admin level to grant those who are invited
 *	'displayName' => the name of inviting user
 * @see Users::addLink()
 *  
 */
function Streams_invite_post()
{
	$publisherId = Streams::requestedPublisherId(true);
	$streamName = Streams::requestedName(true);
	
	Streams::$cache['invited'] = Streams_Stream::invite(
		$publisherId, 
		$streamName, 
		$_REQUEST, 
		$_REQUEST
	);
}
