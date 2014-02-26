<?php

function Streams_after_Users_User_saveExecute($params)
{
	// If the username or icon was somehow modified,
	// update all the avatars for this publisher
	$modified_fields = $params['modified_fields'];
	$user = $params['row'];
	$updates = array();
	if (isset($modified_fields['username'])) {
		$updates['username'] = $modified_fields['username'];
	}
	if (isset($modified_fields['icon'])) {
		$updates['icon'] = $modified_fields['icon'];
	}
	$query = $params['query'];
	if ($query->type === Db_Query::TYPE_INSERT) {
		// we are inserting a new user.
		// make a public avatar for them
		$avatar = new Streams_Avatar();
		$avatar->publisherId = $user->id;
		$avatar->toUserId = '';
		$avatar->username = Q::ifset($modified_fields, 'username', $user->username);
		$avatar->icon = Q::ifset($modified_fields, 'icon', $user->icon);
		$avatar->firstName = '';
		$avatar->lastName = '';
		$avatar->save();
		
		// we are inserting a new user.
		// make a full-access avatar for themselves
		$avatar = new Streams_Avatar();
		$avatar->publisherId = $user->id;
		$avatar->toUserId = $user->id;
		$avatar->username = Q::ifset($modified_fields, 'username', $user->username);
		$avatar->icon = Q::ifset($modified_fields, 'icon', $user->icon);
		$avatar->firstName = '';
		$avatar->lastName = '';
		$avatar->save();
		
		// create some standard streams for them
		$onInsert = Q_Config::get('Streams', 'onInsert', 'Users_User', array());
		if (!$onInsert) {
			return;
		}
		$p = new Q_Tree();
		$p->load(STREAMS_PLUGIN_CONFIG_DIR.DS.'streams.json');
		$p->load(APP_CONFIG_DIR.DS.'streams.json');
		foreach ($onInsert as $name) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $name;
			$stream->retrieve('*', false, true)
				->noCache(true)
				->resume(); // try retrieving it
			$stream->type = $p->expect($name, "type");
			$stream->title = $p->expect($name, "title");
			$stream->content = $p->get($name, "content", '');
			$stream->readLevel = $p->get($name, 'readLevel', Streams_Stream::$DEFAULTS['readLevel']);
			$stream->writeLevel = $p->get($name, 'writeLevel', Streams_Stream::$DEFAULTS['writeLevel']);
			$stream->adminLevel = $p->get($name, 'adminLevel', Streams_Stream::$DEFAULTS['adminLevel']);
			$stream->save();
			$stream->join(array('userId' => $user->id));
		}
	} else if ($updates) {
		Streams_Avatar::update()
			->set($updates)
			->where(array('publisherId' => $user->id))
			->execute();
		foreach ($updates as $field => $value) {
			$name = Q_Config::get('Streams', 'onUpdate', 'Users_User', $field, null);
			if (!$name) continue;
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $name;
			$stream->retrieve(); // it should probably already exist
			$stream->content = $value;
			$stream->save();
			$stream->post($user->id, array(
				'type' => 'Streams/edited',
				'content' => '',
				'instructions' => array(
					'content' => $value
				)
			), true);
		}
	}
}