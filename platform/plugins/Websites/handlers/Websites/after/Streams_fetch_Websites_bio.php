<?php

function Websites_after_Streams_fetch_Websites_bio($params, &$streams)
{
	$bios = Websites_Bio::select('*')
		->where(array(
			'publisherId' => $params['publisherId'],
			'streamName' => array_keys($params['retrieved'])
		))->fetchDbRows(null, '', 'streamName');

	foreach ($bios as $name => $bio) {
		$streams[$name]->bio = $bio->bio;
		$streams[$name]->userId = $bio->userId;
	}
}