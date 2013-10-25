<?php

/**
 * Create or update rule
 */

function Streams_subscription_post($params) {

	$retrieved = false;
	$more_fields = array_merge($_REQUEST, $params);
	$user = Users::loggedInUser(true);
	$publisherId = Streams::requestedPublisherId();
	if (empty($publisherId)) {
		$publisherId = $_REQUEST['publisherId'] = $user->id;
	}
	$name = Streams::requestedName(true);
	// get the stream
	$stream = Streams::fetch($user->id, $publisherId, $name);
	if (!count($stream)) {
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => compact('publisherId', 'name')));
	}
	$stream = reset($stream);
	$rule = new Streams_Rule();
	// skip userId setting
	$rule->ofUserId = $user->id;
	// skip relevance
	$rule->relevance = 1;

	$rule->publisherId = $publisherId;
	$rule->streamName = $name;
	if ($ordinal = Streams::requestedField('ordinal')) {
		$rule->ordinal = $ordinal;
		if (!$rule->retrieve()) {
			throw new Q_Exception_MissingRow(array(
				'table' => 'rule',
				'criteria' => "ofUserId='{$user->id}', publisherId='$publisherId', name='$name', ordinal='$ordinal'"
			));
		} else $retrieved = true;
	}

	if (checkdate($more_fields['readyTime_month'], $more_fields['readyTime_day'], $more_fields['readyTime_year'])) {
		$more_fields['readyTime'] = date('c', mktime(0, 0, 0, $more_fields['readyTime_month'], $more_fields['readyTime_day'], $more_fields['readyTime_year']));
	} else {
		$more_fields['readyTime'] = null;
	}

	$rule->readyTime = $more_fields['readyTime'];

	// filter
	$rule->filter = Q::json_encode(array(
		'types' => !empty($more_fields['types']) ? $more_fields['types'] : array(),
		'labels' => !empty($more_fields['labels']) ? $more_fields['labels'] : array()
	));

	if (!$retrieved && empty($more_fields['deliver'])) {
		throw new Q_Exception_InvalidInput(array('source' => 'deliver'));
	}
	if (!empty($more_fields['deliver'])) $rule->deliver = $more_fields['deliver'];
	if (!$rule->save()) throw new Q_Exception("Error saving rule");
	Streams::$cache['rule'] = $rule;
	return true;
}
