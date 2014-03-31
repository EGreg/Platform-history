<?php

/**
 * Post one or more fields here to change the corresponding basic streams for the logged-in user. Fields can include:
 * "firstName": specify the first name directly
 * "lastName": specify the last name directly
 * "fullName": the user's full name, which if provided will be split into first and last name and override them
 * "sex": the user's gender
 * "birthday_year": the year the user was born
 * "birthday_month": the month the user was born
 * "birthday_day": the day the user was born
 */
function Streams_basic_post()
{
	$user = Users::loggedInUser(true);
	$request = $_REQUEST;
	$fields = array();
	if (isset($request['birthday_year']) && isset($request['birthday_month']) && isset($request['birthday_day'])) {
		$request['birthday'] = sprintf("%04d-%02d-%02d",
			$_REQUEST['birthday_year'],
			$_REQUEST['birthday_month'],
			$_REQUEST['birthday_day']
		);
	}
//	$request['icon'] = $user->icon;
	if (isset($request['fullName'])) {
		$name = Streams::splitFullName($request['fullName']);
		$request['firstName'] = $name['first'];
		$request['lastName'] = $name['last'];
	}
	foreach (array('firstName', 'lastName', 'birthday', 'sex') as $field) {
		if (isset($request[$field])) {
			$fields[] = $field;
		}
	}
	$p = new Q_Tree();
	$p->load(STREAMS_PLUGIN_CONFIG_DIR.DS.'streams.json');
	$p->load(APP_CONFIG_DIR.DS.'streams.json');
	foreach ($fields as $field) {
		$type = $p->get("Streams/user/$field", "type", null);
		if (!$type) {
			throw new Q_Exception("Missing Streams/user/$field type", $field);
		}
		$title = $p->get("Streams/user/$field", "title", null);
		if (!$title) {
			throw new Q_Exception("Missing Streams/user/$field title", $field);
		}
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = "Streams/user/$field";
		$stream->retrieve();
		$stream->content = (string)$request[$field];
		$stream->type = $type;
		$stream->title = $title;
		$stream->save();
		$stream->post($user->id, array(
			'type' => $stream->wasRetrieved() ? 'Streams/edited' : 'Streams/created',
			'content' => '',
			'instructions' => array(
				'content' => $stream->content,
				'type' => $stream->type,
				'title' => $stream->title
			)
		), true);
	}
}
