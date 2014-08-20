<?php

function Q_response_dashboard()
{
	$main_items = array(
		'SmartApp/welcome' => 'Welcome', // front page of the website
		'SmartApp/about' => 'About Us', // who we are and how to contact us
	);
	$docs_items = array(
		'SmartApp/tutorials' => 'Tutorials', // just an example
		'SmartApp/guide' => 'Guide', // another example
	);
	$home = Q_Uri::url('SmartApp/home');
	return Q::view('SmartApp/dashboard.php', compact('main_items', 'docs_items', 'home'));
}