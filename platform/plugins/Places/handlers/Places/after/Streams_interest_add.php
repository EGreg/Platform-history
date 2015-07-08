<?php

function Places_after_Streams_interest_add($params)
{
	$location = Places::userLocationStream();
	if ($params['subscribe'] and $location) {
		Places::subscribe(
			$location->getAttribute('latitude'),
			$location->getAttribute('longitude'),
			$location->getAttribute('miles'),
			$params['publisherId'],
			array(
				'transform' => array('Places', '_transformInterest'),
				'create' => array('Places', '_createInterest'),
				'title' => $params['title'],
				'skipAccess' => true
			)
		);
	}
}