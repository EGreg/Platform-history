<?php

function Websites_before_Q_responseExtras()
{
	$user = Users::loggedInUser(false, false);
	$userId = $user ? $user->id : "";
	$websitesUserId = Q_Config::expect("Websites", "user", "id");
	$sha1 = sha1(Q_Dispatcher::uri());
	$seoStreamName = "Websites/seo/$sha1";
	$streams = Streams::fetch($userId, $websitesUserId, array(
		"Websites/header", "Websites/title", "Websites/slogan", $seoStreamName
	));
	foreach ($streams as $name => $s) {
		if ($s) {
			$s->addPreloaded($userId);
		}
	}
	Q_Response::setScriptData('Q.plugins.Websites.userId', Q_Config::expect('Websites', 'user', 'id'));
}
