<?php

function Q_errors_native($params)
{
	echo Q::view('Q/errors.php', $params);
	$app = Q_Config::expect('Q', 'app');
	Q::log("$app: Errors in " . ceil(Q::microseconds()) . "ms\n" );
	Q::log($params);
}
