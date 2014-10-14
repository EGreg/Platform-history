<?php

function Streams_after_Streams_post_Streams_category($params)
{
	$message = $params['message'];
	$types = array(
		'Streams/relatedTo', 
		'Streams/unrelatedTo', 
		'Streams/updatedRelateTo'
	);
	if (!in_array($message->type, $types)) {
		return;
	}
	$type = $message->getInstruction('type', null);
	$rtypes = Q_Config::get(
		'Streams', 'categories', 'relationTypesToAccelerate', array()
	);
	if (!in_array($type, $rtypes)) {
		return;
	}
	
	$stream = $params['stream'];
	$c = new Streams_Category();
	$c->publisherId = $stream->publisherId;
	$c->streamName = $stream->name;
	
	$fromPublisherId = $message->getInstruction('fromPublisherId', null);
	$fromStreamName = $message->getInstruction('fromStreamName', null);
	if (!isset($type)
	or !isset($fromPublisherId)
	or !isset($fromStreamName)) {
		return;
	}
	$relatedTo = $c->retrieve(null, null, array('ignoreCache' => true))
		? json_decode($c->relatedTo, true)
		: array();
	
	switch ($message->type) {
	case 'Streams/relatedTo':
		$weight = (double)$message->getInstruction('weight', null);
		if (!isset($weight)) {
			$rt = new Streams_RelatedTo();
			$rt->toPublisherId = $stream->publisherId;
			$rt->toStreamName = $stream->name;
			$rt->type = $type;
			$rt->fromPublisherId = $fromPublisherId;
			$rt->fromStreamName = $fromStreamName;
			$rt->retrieve(null, null, array('ignoreCache' => true));
			$weight = $rt->weight;
		}
		$fs = Streams::fetchOne($message->byUserId, $fromPublisherId, $fromStreamName);
		$weight = floor($weight);
		$relatedTo[$type][$weight] = array(
			$fromPublisherId, $fromStreamName, $fs->title, $fs->icon
		);
		break;
	case 'Streams/unrelatedTo':
		if (isset($relatedTo[$type])) {
 			foreach ($relatedTo[$type] as $weight => $info) {
 				if ($info[0] === $fromPublisherId
 				and $info[1] === $fromStreamName) {
					unset($relatedTo[$type][$weight]);
					break;
				}
 			}
			$o = $message->getInstruction('options', null);
			$w = $message->getInstruction('weight', null);
			if (!empty($o['adjustWeights'])) {
				$rt = array();
				foreach ($relatedTo[$type] as $weight => $info) {
					if ($weight > $w) {
						$rt[$weight-1] = $info;
					} else {
						$rt[$weight] = $info;
					}
				}
				$relatedTo[$type] = $rt;
			}
 		}
		break;
	case 'Streams/updatedRelateTo':
		$weight = (double)$message->getInstruction('weight', null);
		$previousWeight = (double)$message->getInstruction('previousWeight', null);
		$adjustWeightsBy = $message->getInstruction('adjustWeightsBy', null);
		if (isset($relatedTo[$type])) {
			$prev = $relatedTo[$type][$previousWeight];
			$rt = array();
			foreach ($relatedTo[$type] as $w => $info) {
				if ($weight < $previousWeight
				and ($w < $weight or $previousWeight <= $w)) {
					$rt[$w] = $info;
				} else if ($weight >= $previousWeight
				and ($w <= $previousWeight or $weight < $w)) {
					$rt[$w] = $info;
				} else {
					$rt[$w+$adjustWeightsBy] = $info;
				}
			}
			$rt[$weight] = $prev;
			$relatedTo[$type] = $rt;
		}
		break;
	default:
		break;
	}
	$c->relatedTo = Q::json_encode($relatedTo);
	$c->save();
}