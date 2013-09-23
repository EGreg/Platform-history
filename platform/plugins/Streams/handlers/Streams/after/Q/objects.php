<?php

function Streams_after_Q_objects () {
	$user = Users::loggedInUser();
	if (!$user) return;
	$invite = Streams::$followedInvite;
	if (!$invite) return;
	$displayName = $user->displayName();
	if ($displayName) return;

	$stream = new Streams_Stream();
	$stream->publisherId = $invite->publisherId;
	$stream->name = $invite->streamName;
	if (!$stream->retrieve()) {
		throw new Q_Exception_MissingRow(array(
			'table' => 'stream',
			'criteria' => 'that name'
		), 'streamName');
	}

	// Prepare the redeem invite dialog
	$defaults = new Q_Tree(
		Q_Config::get("Streams", "types", $stream->type, "invite", "dialog",
			Q_Config::get("Streams", "defaults", "invite", "dialog", array())
		)
	);

	$by_user = Users_User::getUser($invite->invitingUserId);
	$relations = Streams::related(
		$user->id,
		$stream->publisherId,
		$stream->name,
		false,
		array('relationsOnly' => true)
	);
	$related = array();
	foreach ($relations as $name => $relation) {
		$stream = new Streams_Stream();
		$stream->publisherId = $relation->toPublisherId;
		$stream->name = $relation->toStreamName;
		if (!$stream->retrieve()) continue;
		$related[str_replace("/", "_", $stream->type)] = $stream->exportArray();
	}
	
	$params = array(
		'displayName' => $displayName,
		'action' => 'Streams/basic',
		'icon' => "plugins/Users/img/icons/{$user->icon}/80w.png",
		'token' => $invite->token,
		'user' => array(
			'icon' => "plugins/Users/img/icons/{$by_user->icon}/80w.png",
			'name' => $by_user->displayName()
		),
		'stream' => $stream->exportArray(),
		'related' => $related
	);

	if ($defaults->merge($params)) {
		$dialog_data = $defaults->getAll();
		if ($dialog_data) {
			Q_Response::setScriptData("Q.plugins.Streams.invite.dialog", $dialog_data);
		}
	}
}
