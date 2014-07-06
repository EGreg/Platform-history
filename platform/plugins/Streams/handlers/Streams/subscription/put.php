<?php

/**
 * Create or update subscription
 */
function Streams_subscription_put($params) {
	$messageTypes  = array();
	$stoppingAfter = array();
	$devices 	   = array();
	$subscribed    = 'no';

	$streamName    = Streams::requestedName();
	$publisherId   = Streams::requestedPublisherId(true);

	extract($_REQUEST);

	$user = Users::loggedInUser();
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}

	$stream = Streams::fetchOne($user->id, $publisherId, $streamName);
	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => compact('publisherId', 'streamName')
		));
	}

	$deliver  = json_encode(json_decode($devices));
	$filter   = json_encode(array(
		'types' 	 	=> $messageTypes,
		'notifications' => $stoppingAfter
	));

	$streams_subscription 			   = new Streams_Subscription();
	$streams_subscription->streamName  = $streamName;
	$streams_subscription->publisherId = $publisherId;
	$streams_subscription->ofUserId    = $user->id;
	$streams_subscription->retrieve();
	$streams_subscription->filter      = $filter;
	$streams_subscription->save();

	$streams_rule 					   = new Streams_Rule();
	$streams_rule->streamName  		   = $streamName;
	$streams_rule->publisherId 		   = $publisherId;
	$streams_rule->ofUserId    		   = $user->id;
	$streams_rule->retrieve();
	$streams_rule->filter  	   		   = $filter;
	$streams_rule->deliver     		   = $deliver;
	$streams_rule->relevance   		   = 1;
	$streams_rule->save();

	$streams_participant 			   = new Streams_Participant();
	$streams_participant->publisherId  = $publisherId;
	$streams_participant->streamName   = $streamName;
	$streams_participant->userId  	   = $user->id;
	$streams_participant->retrieve();
	$streams_participant->subscribed   = $subscribed;
	$streams_participant->save();
}