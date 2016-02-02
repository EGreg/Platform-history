<?php

/**
 * HTTP method for starting a subscription
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 *  @param {String} $_REQUEST.planStreamName the name of the subscription plan's stream
 *  @param {String} [$_REQUEST.planPublisherId=Users::communityId()] the publisher of the subscription plan's stream
 */
function Awards_subscription_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::nonce(true);
	$token = $req['signature'];
	
	// to be safe, we only start subscriptions from existing plans
	$planPublisherId = Q::ifset($req, 'planPublisherId', Users::communityId());
	$plan = Streams::fetchOne($planPublisherId, $planPublisherId, $req['planStreamName'], true);
	
	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	
	$subscription = Awards::startSubscription($plan, $payment);
	Q_Response::setSlot('subscription', $subscription);
}