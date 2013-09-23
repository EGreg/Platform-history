<?php

function Users_activate_response_content()
{
	$email = $mobile = $type = $user = $emailAddress = $mobileNumber = null;
	extract(Users::$cache, EXTR_IF_EXISTS);

	$complete = false;
	if ($user and !empty($user->passphraseHash)) {
		if ($emailAddress and $user->emailAddress == $emailAddress) {
			$complete = true;
		} else if ($mobileNumber and $user->mobileNumber = $mobileNumber) {
			$complete = true;
		}
	}
	
	if (!empty(Users::$cache['success'])) {
		$app = Q_Config::expect('Q', 'app');
		$home = Q_Config::get('Users', 'uris', "$app/home", "$app/home");
		if (Q_Request::method() === 'POST') {
			Q_Response::redirect(
				Q_Config::get('Users', 'uris', "$app/afterActivate", $home)
				.'?Q.fromSuccess=Users/activate&'.$_SERVER['QUERY_STRING']
			);
			return true;
		}
	}
	
	$view = Q_Config::get('Users', 'activateView', 'Users/content/activate.php');
	$t = $email ? 'e' : 'm';
	$identifier = $email ? $emailAddress : $mobileNumber;

	// Generate 10 passphrase suggestions
	$suggestions = array();
	$arr = include(USERS_PLUGIN_FILES_DIR.DS.'Users'.DS.'passphrases.php');
	for ($i=0; $i<10; ++$i) {
		$pre1 = $arr['pre'][mt_rand(0, count($arr['pre'])-1)];
		$noun1 = $arr['nouns'][mt_rand(0, count($arr['nouns'])-1)];
		$verb = $arr['verbs'][mt_rand(0, count($arr['verbs'])-1)];
		$pre2 = $arr['pre'][mt_rand(0, count($arr['pre'])-1)];
		$adj = $arr['adjectives'][mt_rand(0, count($arr['adjectives'])-1)];
		$noun2 = $arr['nouns'][mt_rand(0, count($arr['nouns'])-1)];
		//$suggestions[] = strtolower("$pre1 $noun1 $verb $pre2 $adj $noun2");
		$suggestions[] = strtolower("$pre1 $noun1 $verb $pre2 $noun2");
	}
	$noun_ue = urlencode($arr['nouns'][mt_rand()%count($arr['nouns'])]);
	$code = Q::ifset($_REQUEST['code']);

	Q_Response::addScriptLine("Q.onReady.set(function () {
		Q.Notices.hide('Users/email');
	});"); // shh! not while I'm activating! lol
	
	return Q::view($view, compact(
		'identifier', 'type', 'user', 'code', 'suggestions', 'noun_ue', 't',
		'app', 'home'
	));
}