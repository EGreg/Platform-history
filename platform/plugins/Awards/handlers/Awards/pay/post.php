<?php

function Awards_pay_post($params = array())
{
//qbox.local/dent/action.php/Awards/pay?Q.ajax=1&Q.method=POST&Q.slotNames=payment
    $req = array_merge($_REQUEST, $params);

    $payment = Awards::authCharge(
//        $req['providerId'],
        $params
    );

    Q_Response::setSlot('payment', $payment);
}