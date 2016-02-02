<?php

function Awards_pay_post($params = array())
{
    $req = array_merge($_REQUEST, $params);
	Awards::startSubscription(); // store the subscription info
	$payment = Awards::authCharge($params); // make the first charge
    Q_Response::setSlot('payment', $payment);
}