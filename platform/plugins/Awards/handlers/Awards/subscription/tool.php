<?php

/*
TODO: make this into a YUIDoc-style comment to document the tool properly!

common options list to retrieve from user

    $options['payments'] => 'authorize.net',   //'stripe',
    $options['currency'] => 'usd',
    $options['amount'] => '579',
    $options['subscription'] => $subscription

        $subscription['FirstName'] => 'John',
        $subscription['LastName'] => 'Smith',

        $subscription['number'] => '4242424242424242',
        $subscription['exp_year'] => 2018,
        $subscription['exp_month'] => 8,

        $subscription['cvc'] => 101

    Stripe\StripeObject JSON: {
      "id": "sub_7T9hIJATZmCQDa",
      "object": "subscription",
      "application_fee_percent": null,
      "cancel_at_period_end": false,
      "canceled_at": null,
      "current_period_end": 1451879026,
      "current_period_start": 1449200626,
      "customer": "cus_7T9Yc7UmzMDQeJ",
      "discount": null,
      "ended_at": null,
      "metadata": {
      },
      "plan": {
        "id": "gold575",
        "object": "plan",
        "amount": 2000,
        "created": 1386247539,
        "currency": "usd",
        "interval": "month",
        "interval_count": 1,
        "livemode": false,
        "metadata": {
        },
        "name": "New plan name",
        "statement_descriptor": null,
        "trial_period_days": null
      },
      "quantity": 1,
      "start": 1449200626,
      "status": "active",
      "tax_percent": null,
      "trial_end": null,
      "trial_start": null
    }
*/

function Awards_subscription_tool($options)
{
	if (empty($options['payments'])) {
		throw new Q_Exception_RequiredField(array('field' => 'payments'));
	}
	$payments = ucfirst($options['payments']);
	$className = "Awards_Payments_$payments";
	$adapter = new $className($options);
    $token = $adapter->authToken();
	$button = Q::ifset($options, 'button', 'Start Subscription');
	Q::view("Awards/tool/subscription/$payments.php", compact('button', 'token'));
    Q_Response::setToolOptions($options);
};