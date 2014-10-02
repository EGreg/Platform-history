<?php

function Streams_after_Users_User_saveExecute($params)
{
	// If the username or icon was somehow modified,
	// update all the avatars for this publisher
	$modifiedFields = $params['modifiedFields'];
	$user = $params['row'];
	$updates = array();
	if (isset($modifiedFields['username'])) {
		$updates['username'] = $modifiedFields['username'];
	}
	if (isset($modifiedFields['icon'])) {
		$updates['icon'] = $modifiedFields['icon'];
	}
	$firstName = Q::ifset(Streams::$cache, 'register', 'first', '');
	$lastName = Q::ifset(Streams::$cache, 'register', 'last', '');
	$query = $params['query'];
	if ($query->type === Db_Query::TYPE_INSERT) {
		
		// create some standard streams for them
		$onInsert = Q_Config::get('Streams', 'onInsert', 'Users_User', array());
		if (!$onInsert) {
			return;
		}
		$p = new Q_Tree();
		$p->load(STREAMS_PLUGIN_CONFIG_DIR.DS.'streams.json');
		$p->load(APP_CONFIG_DIR.DS.'streams.json');
		foreach ($onInsert as $name) {
			$stream = Streams::fetchOne($user->id, $user->id, $name);
			if (!$stream) { // it shouldn't really be in the db yet
				$stream = new Streams_Stream();
				$stream->publisherId = $user->id;
				$stream->name = $name;
			}
			$stream->type = $p->expect($name, "type");
			$stream->title = $p->expect($name, "title");
			$stream->content = $p->get($name, "content", ''); // usually empty
			$stream->readLevel = $p->get($name, 'readLevel', Streams_Stream::$DEFAULTS['readLevel']);
			$stream->writeLevel = $p->get($name, 'writeLevel', Streams_Stream::$DEFAULTS['writeLevel']);
			$stream->adminLevel = $p->get($name, 'adminLevel', Streams_Stream::$DEFAULTS['adminLevel']);
			if ($name === "Streams/user/icon") {
				$sizes = Q_Config::expect('Users', 'icon', 'sizes');
				$stream->setAttribute('sizes', $sizes);
				$stream->icon = $user->iconUrl();
			} else if ($name === 'Streams/user/firstName') {
				$stream->content = Q::ifset(Streams::$cache, 'register', 'first', '');
			} else if ($name === 'Streams/user/lastName') {
				$stream->content = Q::ifset(Streams::$cache, 'register', 'last', '');
			}
			$stream->save(); // this also inserts avatars
			$stream->join(array('userId' => $user->id));
		}
	} else if ($modifiedFields) {
		if ($updates) {
			Streams_Avatar::update()
				->set($updates)
				->where(array('publisherId' => $user->id))
				->execute();
		}
		
		foreach ($modifiedFields as $field => $value) {
			$name = Q_Config::get('Streams', 'onUpdate', 'Users_User', $field, null);
			if (!$name) continue;
			$stream = Streams::fetchOne($user->id, $user->id, $name);
			if (!$stream) { // it should probably already be in the db
				continue;
			}
			$stream->content = $value;
			if ($name === "Streams/user/icon") {
                $sizes = Q_Config::expect('Users', 'icon', 'sizes');
                $stream->setAttribute('sizes', $sizes);
				$stream->icon = $user->iconUrl();
			}
			$stream->save();
			$stream->post($user->id, array(
				'type' => 'Streams/edited',
				'content' => '',
				'instructions' => array('changes' => array(
					'content' => $value
				))
			), true);
		}
	}
}