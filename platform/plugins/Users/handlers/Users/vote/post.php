<?php

/**
 * Votes for something
 * @param {string} forType the type of thing to vote for
 * @param {string} forId string uniquely identifying that thing among others of its type
 * @param {integer} value the value the user has voted for, such as a rating etc.
 */
function Users_vote_post()
{
	$user = Users::loggedInUser(true);
	$required = array('forType', 'forId', 'value');
	foreach ($required as $field) {
		if (empty($_REQUEST[$field])) {
			throw new Q_Exception_RequiredField(compact('field'));
		}
	}
	$hinted = Q::ifset($_SESSION, 'Users', 'hinted', array());
	if ($_REQUEST['forType'] === 'Users/hinted'
	and !in_array($_REQUEST['forId'], $hinted)) {
		$_SESSION['Users']['hinted'][] = $_REQUEST['forId'];
	}
	$vote = new Users_Vote();
	$vote->userId = $user->id;
	$vote->forType = $_REQUEST['forType'];
	$vote->forId = $_REQUEST['forId'];
	$vote->value = $_REQUEST['value'];
	$retrieved = $vote->retrieve();
	/**
	 * @event Users/vote {before}
	 * @return {string}
	 */
	if (false === Q::event('Users/vote', compact('user', 'vote'), 'before')) {
		return;
	}
	if (!$retrieved) {
		$vote->save();
	}
	$vote = $vote->exportArray();
	$vote['retrieved'] = $retrieved;
	Users::$cache['vote'] = $vote;
}