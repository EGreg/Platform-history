<?php

function MyApp_welcome_response_content($params)
{
	// Implement a home page for the user
	$user = Users::loggedInUser();
	
	// For now we will just internally forward to the welcome page
	Q_Dispatcher::forward("Groups/welcome");
}

