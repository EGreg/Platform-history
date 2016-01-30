<?php

function Awards_pay_post($options) // $options ->>> $params
{

    $result = Awards::authCharge($options);

    return $result;

}