<?php

function Users_0_8_4_Users_mysql()
{
	$app = Q_Config::expect('Q', 'app');
	Users_Label::addLabel("$app/admins", $app, '$app Admins', "Users/admins", false);
}

Users_0_8_4_Users_mysql();