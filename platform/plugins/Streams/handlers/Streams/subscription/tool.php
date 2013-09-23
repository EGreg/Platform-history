<?php

/**
 * This tool generates a subscription selector.
 *
 * @param array $options
 *  An associative array of parameters, containing:
 *  "publisherId" => Optional. publisherId of the stream to present. If "stream" parameter is empty
 *    defaults to Streams::requestedPublisherId(true)
 *  "name" => Optional. the name of the stream to present. If "stream" parameter is empty
 *    defaults to Streams::requestedName(true)
 */

function Streams_subscription_tool($options) {
	extract($options);

	$template = !empty($_REQUEST['template']);

	// user shall be logged in
	$user = Users::loggedInUser();
	if (!$user) {
		throw new Users_Exception_NotLoggedIn();
	}

	// PK of stream
	if (!isset($publisherId)) {
		$publisherId = Streams::requestedPublisherId(true);
	}
	if (!isset($name)) {
		$name = Streams::requestedName(!$template);
	}

	// get the stream
	$stream = Streams::fetch($user->id, $publisherId, $name);
	if (!count($stream)) {
		throw new Q_Exception_MissingRow(array('table' => 'stream', 'criteria' => compact('publisherId', 'name')));
	}
	$stream = reset($stream);

	// if user is not participant, join the stream
	$participant = $stream->join();

	// check if stream has messages
	$types = Q_Config::get('Streams', 'messages', $stream->type, array());
	if (count($types) === 0) throw new Q_Exception("Stream of type '{$stream->type}' does not support subscription");

	if (isset($_REQUEST['rules'])) {
		// generate rules definition interface

		$ordinal = !empty($_REQUEST['ordinal']) ? $_REQUEST['ordinal'] : null;

		if ($ordinal) {
			$rule = new Streams_Rule();
			$rule->ofUserId = $user->id;
			$rule->publisherId = $publisherId;
			$rule->streamName = $name;
			$rule->ordinal = $ordinal;
			if (!$rule->retrieve()) {
				throw new Q_Exception_MissingRow(array(
					'table' => 'rule',
					'criteria' => "ofUserId='{$user->id}', publisherId='$publisherId', name='$name', ordinal='$ordinal'"
				));
			}
			if (!empty($_REQUEST['delete'])) {
				Q::event('Streams/subscription/delete');
				return Q_Response::redirect(Q_Request::url(array('delete' => null, 'rules' => null, 'ordinal' => null)));
			}
		} else {
			$rule = $stream->getTemplate('Streams_Rule', $user->id);
		}

		if ($rule) {
			$filter = json_decode($rule->filter, true);
		}

		$emails = Users_Email::select('address')->where(array(
			'userId' => $user->id,
			'state' => 'active'
		))->fetchAll(PDO::FETCH_COLUMN);

		$mobiles = Users_Mobile::select('number')->where(array(
			'userId' => $user->id,
			'state' => 'active'
		))->fetchAll(PDO::FETCH_COLUMN);

		$deliveries = array('' => 'Select delivery');
		foreach ($emails as $email) {
			$deliveries['{"email":"'.$email.'"}'] = $email;
		}
		foreach ($mobiles as $mobile) {
			$deliveries['{"mobile":"'.$mobile.'"}'] = $mobile;
		}

		$labels = array_map(array('Users_Label', 'getTitle'), Users_Label::select('*')->where(array(
			'userId' => $user->id
		))->fetchDbRows(null, '', 'label'));

		$hidden = array(
			'ofUserId' => $user->id,
			'publisherId' => $publisherId
		);
		if (!$template) $hidden['streamName'] = $name;

		if ($ordinal) $hidden['ordinal'] = $ordinal;

		$fields = array(
			'publisherId' => array(
				'label' => 'Publisher ID:',
				'type' => 'static',
				'value' => $publisherId
			),
			'streamName' => array(
				'label' => 'Stream name:',
				'type' => $template ? 'text' : 'static',
				'value' => $name
			),
			'readyTime' => array(
				'label' => 'Time ready:',
				'type' => 'date',
				'options' => array(
					'year_from' => 2012,
					'year_to' => 2020
				),
				'value' => $rule ? $rule->readyTime : null
			),
			'deliver' => array(
				'label' => 'Deliver',
				'type' => 'select',
				'options' => $deliveries,
				'value' => $rule ? $rule->deliver : ''
			),
			'filter' => array(
				'label' => '',
				'type' => 'h4',
				'value' => 'Filter'
			),
			'types[]' => array(
				'label' => 'Message type:',
				'type' => 'checkboxes',
				'options' => array_combine($types, $types),
				'value' => $rule ? array_flip($filter['types']) : array()
			)
		);

		if (count($labels)) {
			$fields['labels[]'] = array(
				'label' => 'Labels',
				'type' => 'checkboxes',
				'options' => $labels,
				'value' => $rule ? array_flip($filter['labels']) : array()
			);
		}
		$fields['submit'] = array(
			'label' => '',
			'type' => 'submit_buttons',
			'options' => array(
				'submit' => $ordinal ? 'Update' : 'Create'
			)
		);

		return Q_Html::tag('h3', array(), 'Define delivery rule')
			. Q_Html::a(Q_Request::url(array('rules' => null, 'ordinal' => null)), array(), 'back to subscription')
			. Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/subscription', 'post', array(), 
				// userId may be edited in template BUT who has the right to define generic templates???
				Q_Html::hidden($hidden)
				. Q::tool('Q/form', array(
					'fields' => $fields,
					'onSuccess' => 'function (data) {
						if (data.errors) alert(data.errors);
						else {
							var rule = Q.ifSet(data, ["slots", "form", "fields"], null);
							Q.handle(Q.info.baseUrl+"/plugins/Streams/subscription?publisherId="+rule.publisherId+"&name="+rule.streamName);
						}
					}'
				))
			);
	} else {
		// show subscription form
		if (!$template) {
			// gather applicable rules
			$rules = Streams_Rule::select('*')->where(array(
				'ofUserId' => $user->id,
				'publisherId' => $publisherId,
				'streamName' => $name
			))->fetchDbRows(null, '', 'ordinal');
			if (!count($rules)) return Q_Response::redirect(Q_Request::url(array('rules' => true)));
			// check subscription templates or existing subscription
			$subscription = $stream->getTemplate('Streams_Subscription', $user->id, $type);
			if ($type === 0 && !empty($_REQUEST['delete'])) {
				Q::event('Streams/subscription/delete');
				return Q_Response::redirect(Q_Request::url(array('delete' => null, 'rules' => null, 'ordinal' => null)));
			}
		} else {
			$subscription = new Streams_Subscription();
			$subscription->publisherId = $publisherId;
			$subscription->streamName = $name;
			$subscription->ofUserId = $user->id;
			if (!$subscription->retrieve()) $subscription = null;
		}

		if ($subscription) {
			$filter = json_decode($subscription->filter, true);
		}

		$list = array_combine($types, $types);

		$hidden = array(
			'ofUserId' => $user->id,
			'publisherId' => $publisherId
		);
		if (!$template) $hidden['streamName'] = $name;

		$fields = array(
			'publisherId' => array(
				'label' => 'Publisher ID:',
				'type' => 'static',
				'value' => $publisherId
			),
			'streamName' => array(
				'label' => 'Stream name:',
				'type' => $template ? 'text' : 'static',
				'value' => $name
			),
			'types[]' => array(
				'label' => 'Message type:',
				'type' => 'checkboxes',
				'options' => array_combine($types, $types),
				'value' => $subscription ? array_flip($filter['types']) : array()
			),
			'notifications' => array(
				'label' => 'Max notifications:',
				'type' => 'select',
				'value' => $subscription ? $filter['notifications'] : 0,
				'options' => array('Unlimited', 'One', 'Two', 'Three', 'Four', 'Five')
			)
		);

		if ($template) {
			$fields['duration'] = array(
				'label' => 'Duration',
				'type' => 'text',
				'value' => $subscription ? $subscription->duration : '',
				'placeholder' => 'Enter duration'
			);
			$hidden['template'] = true;
		} else {
			$fields['untilTime'] = array(
				'label' => 'Time until:',
				'type' => 'date',
				'options' => array(
					'year_from' => 2010,
					'year_to' => 2020
				),
				'value' => $subscription ? $subscription->untilTime : null
			);
		}

		$fields['submit'] = array(
			'label' => '',
			'type' => 'submit_buttons',
			'options' => array(
				'submit' => $template ? 'Create' : ($participant->subscribed === 'yes' ? 'Modify' : 'Subscribe')
			)
		);

		return Q_Html::tag('h3', array(), 'Subscribe to the stream messages')
			. ($participant->subscribed === 'yes' ? Q_Html::a(Q_Request::url(array('delete' => true)), array(), 'cancel subscription') : '')
			. Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/subscription', 'put', array(), 
				// userId may be edited in template BUT who has the right to define generic templates???
				Q_Html::hidden($hidden)
				. Q::tool('Q/form', array(
					'fields' => $fields,
					'onSuccess' => 'function (data) {
						if (data.errors) alert(data.errors);
						else {
							var sub = Q.ifSet(data, ["slots", "form", "fields"], null);
							Q.handle(Q.info.baseUrl+"/plugins/Streams/subscription?publisherId="+sub.publisherId+"&name="+sub.streamName'.($template ? '&template=1' :'').');
						}
					}'
			))
			. (!$template ?
				Q_Html::tag('h3', array(), 'Applicable rules')
				. Q_Html::a(Q_Request::url(array('rules' => true)), array(), 'add rule')
				. Q::view('Streams/tool/rules.php', compact('rules'))
				: '')
		);
	}
}
