<?php

function SmartApp_welcome_response_column1()
{
	$pages = array(
		'SmartApp/welcome page=about' => array(
			'icon' => "iphone/toolButton.png",
			'title' => "What it's all about"
		),
		'SmartApp/welcome page=business' => array(
			'icon' => "iphone/redButton.png",
			'title' => "For Businesses"
		),
		'SmartApp/welcome page=developer' => array(
			'icon' => "iphone/redButton.png",
			'title' => "For Developers"
		),
		'SmartApp/welcome page=designer' => array(
			'icon' => "iphone/redButton.png",
			'title' => "For Designers"
		),
		'SmartApp/welcome page=agency' => array(
			'icon' => "iphone/redButton.png",
			'title' => "Interactive Marketing Agencies"
		),
		'SmartApp/welcome page=stack' => array(
			'icon' => "iphone/profile-user.png",
			'title' => "Technology stack"
		),
	);
	$page = Q_Dispatcher::uri()->page;
	if (!$page) {
		$page = 'about';
	}
	$uri = "SmartApp/welcome page=$page";
	if (!empty($pages[$uri]) and !Q_Request::isMobile()) {
		$pages[$uri]['selected'] = true;
	}
	return Q::view('SmartApp/column1/welcome.php', compact('pages'));
}
