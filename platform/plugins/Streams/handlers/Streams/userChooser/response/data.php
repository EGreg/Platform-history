<?php

// WARNING:
// when Q is distributed, this search will have to happen on an aggregator
// which will need to subscribe to each user's firstName and lastName
// and reflect their updates. 
// This particular search may have to use auxiliary indexes for
// firstName, lastName, username because of the orderBy and the criteria being used.

function Streams_userChooser_response_data()
{
	if (!isset($_REQUEST['query'])) {
		throw new Q_Exception_RequiredField(array('field' => 'query'));
	}
	if (empty($_REQUEST['query'])) {
		return array();
	}
	if (isset($_REQUEST['max'])) {
		$max = $_REQUEST['max'];
	} else {
		$max = Q_Config::get('streams', 'userChooser', 'maxResults', 3);
	}
	
	$user = Users::loggedInUser();
	$toUserId = $user ? $user->id : '';

	// SEARCH: When this is distributed, you will need
	// to make two requests from the front end -- one to the aggregator,
	// and one to the local server, then composite the results and
	// display them. Right now, a local request is the only thing implemented.
	$scope = Q::ifset($_REQUEST, 'scope', '1,local');
	$trimmed = trim($_REQUEST['query']);
	if (empty($trimmed)) {
		return array('avatars' => array());
	}
	$parts = explode(' ', $trimmed);
	
	// First, try to find the avatars that correspond to the first name
	$firstName_query = reset($parts);
	$avatars_firstName = Streams_Avatar::select('*')
		->where(array( // Warning: SECONDARY_LOOKUP
			'toUserId' => array($toUserId, ''),
			'firstName' => new Db_Range($firstName_query, true, false, true)
		))->orderBy('firstName') // WARNING: this orderBy cannot be used across multiple shards
		->limit($max) 
		->fetchDbRows(null, '', 'publisherId');
	$avatars = $avatars_firstName;
	if (($max -= count($avatars_firstName)) === 0) {
		return compact('avatars');
	}
		
	$lastName_query = end($parts);
	$avatars_lastName = Streams_Avatar::select('*')
		->where(array( // Warning: SECONDARY_LOOKUP
			'toUserId' => array($toUserId, ''),
			'lastName' => new Db_Range($lastName_query, true, false, true)
		))->orderBy('lastName') // WARNING: this orderBy cannot be used across multiple shards
		->limit($max)
		->fetchDbRows(null, '', 'publisherId');
	foreach ($avatars_lastName as $k => $v) {
		$avatars[$k] = $v;
	}
	
	$avatars_username = Streams_Avatar::select('*')
		->where(array(
			'toUserId' => '',
		))->andWhere(
			array('username' => new Db_Range($firstName_query, true, false, true)),
			array('username' => new Db_Range($lastName_query, true, false, true))
		)->andWhere(
			array('firstName' => ''),
			array('lastName' => '')
		)->orderBy('username') // WARNING: this orderBy cannot be used across multiple shards
		->limit($max)
		->fetchDbRows(null, '', 'publisherId');
	foreach ($avatars_username as $k => $v) {
		$avatars[$k] = $v;
	}
	if (($max -= count($avatars_username)) === 0) {
		return compact('avatars');
	}

	return compact('avatars');
}
