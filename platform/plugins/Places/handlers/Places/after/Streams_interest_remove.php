<?php

function Places_after_Streams_interest_remove($params)
{
	$location = Places::userLocationStream();
	if ($location) {
		Places::unsubscribe(
			$location->getAttribute('latitude'),
			$location->getAttribute('longitude'),
			$location->getAttribute('miles'),
			$params['publisherId'],
			array(
				'transform' => array('Places', '_transformInterest'),
				'title' => $params['title'],
				'skipAccess' => true
			)
		);
	}
}