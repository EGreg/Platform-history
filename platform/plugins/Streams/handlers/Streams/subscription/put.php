<?php

/**
 * Create or update subscription
 */

function Streams_subscription_put($params) {

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
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream', 
			'criteria' => "{publisherId: '$publisherId', name: '$name'}"
		));
	}
	$stream = reset($stream);

	if (empty($_REQUEST['template'])) {
		if (checkdate($more_fields['untilTime_month'], $more_fields['untilTime_day'], $more_fields['untilTime_year'])) {
			$untilTime =  date('c', mktime(0, 0, 0, $more_fields['untilTime_month'], $more_fields['untilTime_day'], $more_fields['untilTime_year']));
		} else $untilTime = null;

		return Streams::$cache['subscription'] = $stream->subscribe(array(
			'types' => !empty($more_fields['types']) ? $more_fields['types'] : array(),
			'notifications' => !empty($more_fields['notifications']) ? $more_fields['notifications'] : 0,
			'untilTime' => $untilTime
		));
	} else {
		$subscription = new Streams_Subscription();
		// skip userId setting
		$subscription->ofUserId = $user->id;
		$subscription->publisherId = $publisherId;
		$subscription->streamName = $name;

		$subscription->filter = Q::json_encode(array(
			'types' => !empty($more_fields['types']) ? $more_fields['types'] : array(),
			'notifications' => !empty($more_fields['notifications']) ? $more_fields['notifications'] : 0
		));

		$duration = !empty($_REQUEST['duration']) ? strtotime($_REQUEST['duration']) : false;
		if ($duration) {
			$duration = $duration - time();
		} else {
			$duration = 0;
		}
		$subscription->duration = $duration;

		if (!$subscription->save(true)) throw new Q_Exception("Error saving subscription template");
		Streams::$cache['subscription'] = $subscription;
		return true;
	}
}
