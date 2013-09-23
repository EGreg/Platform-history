<?php

function Streams_related_validate()
{
	switch (Q_Request::method()) {
		case 'POST':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName');
			break;
		case 'DELETE':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName');
			break;
		case 'PUT':
			$required = array('toPublisherId', 'toStreamName', 'type', 'fromPublisherId', 'fromStreamName', 'weight');
			if (isset($_REQUEST['adjust_weights'])) {
				if (!is_numeric($_REQUEST['adjust_weights'])) {
					Q_Response::addError(new Q_Exception_WrongValue(
						array('field' => 'adjust_weights', 'range' => 'a numeric value'),
						'adjust_weights'
					));
				}
			}
			break;
		case 'GET':
			$required = array();
			break;
	}
	foreach ($required as $r) {
		if (!isset($_REQUEST[$r])) {
			Q_Response::addError(new Q_Exception_RequiredField(array('field' => $r)));
		}
	}
}
