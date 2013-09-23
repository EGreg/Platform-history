<?php

function SmartApp_welcome_response_column2()
{
	if ($page = Q_Dispatcher::uri()->page) {
		return Q::view("SmartApp/column2/welcome/$page.php");
	}
	return Q::view('SmartApp/column2/welcome/about.php');
}
