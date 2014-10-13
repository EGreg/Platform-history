<?php

/**
 * Used to create a new stream
 *
 * @param array $_REQUEST 
 *   title (of the interest) is required,
 *   publisherId is optional
 * @return void
 */
function Streams_interest_post()
{
	$user = Users::loggedInUser(true);
	$title = Q::ifset($_REQUEST, 'title', null);
	if (!isset($title)) {
		throw new Q_Exception_RequiredField(array('field' => 'title'));
	}
	$app = Q_Config::expect('Q', 'app');
	$publisherId = Q::ifset($_REQUEST, 'publisherId', $app);
	$name = 'Streams/interest/' . Q_Utils::normalize($title);
	$stream = Streams::fetchOne(null, $publisherId, $name);
	if (!$stream) {
		$stream = new Streams_Stream();
		$stream->publisherId = $publisherId;
		$stream->name = $name;
		$stream->type = 'Streams/interest';
		$stream->title = $title;
		$stream->save();
	}
	
	$myInterests = Streams::fetchOne($user, $user, 'Streams/user/interests');
	if (!$myInterests) {
		$myInterests = new Streams_Stream();
		$myInterests->publisherId = $user->id;
		$myInterests->name = 'Streams/user/interests';
		$myInterests->type = 'Streams/category';
		$myInterests->title = 'My Interests';
		$myInterests->save();
	}
	
	$weight = "+1";
	Streams::relate(
		$user->id,
		$user->id,
		'Streams/user/interests',
		'Streams/interest',
		$publisherId,
		$name,
		compact('weight')
	);
}