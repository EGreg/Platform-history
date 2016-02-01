<?php

function Awards_pay_response_payment($options)
{
//    return Awards::startSubscription($_REQUEST['patientId']);
    Awards::startSubscription();

    return true;
}