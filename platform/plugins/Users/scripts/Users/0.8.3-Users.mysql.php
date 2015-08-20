<?php

function Users_0_8_3_Users_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	$user = new Users_User();
	$user->id = $app;
	$user->username = $app;
	$user->url = Q_Config::expect('Q', 'web', 'appRootUrl');
	$user->signedUpWith = 'none';
	$user->save();
}

Users_0_8_3_Users_mysql();