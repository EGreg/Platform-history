<?php

/**
 * Create or update subscription
 */
function Streams_subscription_put($params) {
	$items		    = array();
	$subscribed     = 'no';
	$updateTemplate = true;
	$streamName     = Streams::requestedName();
	$publisherId    = Streams::requestedPublisherId(true);
	$user  		    = Users::loggedInUser(true);

	extract($_REQUEST);

	$items  = json_decode($items);
	$stream = Streams::fetchOne(
		$user->id,
		$publisherId,
		$streamName,
		'*',
		array('includeTemplate' => $updateTemplate )
	);

	if (!$stream) {
		throw new Q_Exception_MissingRow(array(
			'table'    => 'stream',
			'criteria' => compact('publisherId', 'streamName')
		));
	}

	$rules = Streams_Rule::select('*')->where(array(
		'ofUserId'    => $user->id,
		'publisherId' => $publisherId,
		'streamName'  => $streamName
	))->fetchDbRows(null, '', 'name');

	$types = Q_Config::get('Streams', 'types', $stream->type, 'messages', array());

	if ($stream->isTemplate() and $updateTemplate or !$stream->isTemplate()) {
			/*
			* update rules
			*/
			while ($item = array_pop($items)) {
				/*
				* join "grouped" message types to $items
				*/
				foreach ($types as $type => $msg) {
					if ($msg['title'] == $item->filter->labels and $type != $item->filter->types) {
						$items[] = (object) array(
							'deliver' => $item->deliver,
							'filter'  => array(
								'types'  		=> $type,
								'labels' 		=> $msg['title'],
								'notifycations' => $item->filter->notifycations
							)
						);
					}
				}

				if (!$rule = array_pop($rules)) {
					$rule 			   = new Streams_Rule();
					$rule->ofUserId    = $user->id;
					$rule->publisherId = $publisherId;
					$rule->streamName  = $streamName;
					$rule->relevance   = 1;
				}

				$rule->filter		   = json_encode($item->filter);
				$rule->deliver		   = json_encode($item->deliver);
				$rule->save();
			}

			foreach ($rules as $rule) {
				$rule->remove();
			}
	}

	$streams_subscription 			   = new Streams_Subscription();
	$streams_subscription->streamName  = $streamName;
	$streams_subscription->publisherId = $publisherId;
	$streams_subscription->ofUserId    = $user->id;
	$streams_subscription->filter      = json_encode(array());
	$streams_subscription->retrieve();
	$streams_subscription->save();

	$streams_participant 			   = new Streams_Participant();
	$streams_participant->publisherId  = $publisherId;
	$streams_participant->streamName   = $streamName;
	$streams_participant->userId  	   = $user->id;
	$streams_participant->state        = 'participating';
	$streams_participant->reason       = '';
	$streams_participant->retrieve();
	$streams_participant->subscribed   = $subscribed;
	$streams_participant->save();
}