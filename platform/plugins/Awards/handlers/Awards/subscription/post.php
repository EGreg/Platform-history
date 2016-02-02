<?php

/**
 * HTTP method for starting a subscription
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.payments Required. Should be either "authnet" or "stripe"
 * @param {string} $_REQUEST.planStreamName The currency in which to pay
 */
function Awards_subscription_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Q_Valid::nonce(true);
	$token = $req['signature'];
	
	// to be safe, we only start subscriptions from existing plans
	$communityId = Users::communityId();
	$plan = Streams::fetchOne($communityId, $communityId, $req['planStreamName'], true);
	
	// the currency will always be assumed to be "USD" for now
	// and the amount will always be assumed to be in dollars, for now
	
	$subscription = Awards::startSubscription($plan, $payment);
	Q_Response::setSlot('subscription', $subscription);
}