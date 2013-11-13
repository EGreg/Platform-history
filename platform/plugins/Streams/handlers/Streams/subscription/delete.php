<?php

/**
 * Delete rule or subscription
 */

function Streams_subscription_delete($params) {
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	if (!empty($_REQUEST['rules'])) {
		$rule = new Streams_Rule();
		$rule->ofUserId = $user->id;
		$rule->publisherId = $publisherId;
		$rule->streamName = Streams::requestedName(true);
		$rule->ordinal = Streams::requestedField('ordinal', true);
		if (!$rule->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'rule',
				'criteria' => "{ofUserId: '{$user->id}', publisherId: '$publisherId', name: '$name', ordinal: '$ordinal'}"
			));
		}
		if (!$rule->remove()) {
			throw new Q_Exception("Could not delete rule");
		}
		return true;
	} else {
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = Streams::requestedName(true);
		return $stream->unsubscribe();
	}
}

