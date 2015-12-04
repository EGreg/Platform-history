<?php

/**
 * @module Awards
 */
/**
 * Class for manipulating credits
 * @class Awards_Credits
 */
class Awards_Credits
{
	/**
	 * Create award stream for logged-in user
	 * @method createStream
	 * @static
	 * @param {Users_User} $user The user for which stream is created
	 * @return {Streams_Stream}
	 */
	static function createStream($user)
	{
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = 'Awards/credits';
		$stream->type = 'Awards/credits';
		$stream->icon = 'plugins/Awards/img/credits.png';
		$app = Q_Config::expect('Q', 'app');
		$stream->title = 'Credits';
		$stream->content = '';
		$stream->setAttribute('amount', Q_Config::get('Awards', 'credits', 'amounts', 'Users/insertUser', 20));
		$stream->save();
		return $stream;
	}
	
	/**
	 * Amount of credits for logged-in user
	 * @method amount
	 * @static
	 * @return {string} The amount of credits
	 */
	static function amount()
	{
		$user = Users::loggedInUser(true);
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = 'Awards/credits';
		if (!$stream->retrieve()) {
			$stream = self::createStream($user);
		}
		return $stream->getAttribute('amount');
	}
	
	/**
	 * Spend credits as the logged-in user
	 * @method spend
	 * @static
	 * @param {integer} $amount The amount of credits to spend.
	 * @param {array} $more An array supplying more info, including
 	 *  "reason" => Identifies the reason for spending, if any
 	 *  "for_publisherId" => The publisher of the stream representing the purchase
	 *  "for_streamName" => The name of the stream representing the purchase
	 */
	static function spend($amount, $more = array())
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'positive integer'
			));
		}
		$user = Users::loggedInUser(true);
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = 'Awards/credits';
		if (!$stream->retrieve()) {
			$stream = self::createStream($user);
		}
		$existing_amount = $stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Awards_Exception_NotEnoughCredits(array('missing' => $amount -$existing_amount));
		}
		$stream->setAttribute('amount', $stream->getAttribute('amount') - $amount);
		$stream->save();
		
		$instructions_json = Q::json_encode(array_merge(
			array('app' => Q_Config::expect('Q', 'app')),
			$more
		));
		Streams_Message::post($user->id, $user->id, array(
			'type' => 'Awards/credits/spent',
			'content' => $amount,
			'instructions' => $instructions_json
		));
	}
	
	/**
	 * Earn credits as the logged-in user
	 * @method earn
	 * @static
	 * @param {integer} $amount The amount of credits to earn.
	 * @param {string} $reason Identifies the reason you earned them.
	 */
	static function earn($amount, $reason = 'Awards/purchased')
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}
		$user = Users::loggedInUser(true);
		$stream = new Streams_Stream();
		$stream->publisherId = $user->id;
		$stream->name = 'Awards/credits';
		if (!$stream->retrieve()) {
			$stream = self::createStream($user);
		}
		$stream->setAttribute('amount', $stream->getAttribute('amount') + $amount);
		$stream->save();
		
		// Post that this user earned $amount credits by $reason
		$app = Q_Config::expect('Q', 'app');
		Streams_Message::post($user->id, $user->id, array(
			'type' => 'Awards/credits/earned',
			'content' => $amount,
			'instructions' => Q::json_encode(compact('app', 'reason'))
		));
	}
	
	/**
	 * Send credits, as the logged-in user, to another user
	 * @method send
	 * @static
	 * @param {integer} $amount The amount of credits to send.
	 * @param {string} $toUserId The id of the user to whom you will send the credits
	 * @param {array} $more An array supplying more info, including
 	 *  "reason" => Identifies the reason for sending, if any
	 */
	static function send($amount, $toUserId, $more = array())
	{
		if (!is_int($amount) or $amount <= 0) {
			throw new Q_Exception_WrongType(array(
				'field' => 'amount',
				'type' => 'integer'
			));
		}
		$user = Users::loggedInUser(true);
		$from_stream = new Streams_Stream();
		$from_stream->publisherId = $user->id;
		$from_stream->name = 'Awards/credits';
		if (!$from_stream->retrieve()) {
			$from_stream = self::createStream($user);
		}
		$existing_amount = $from_stream->getAttribute('amount');
		if ($existing_amount < $amount) {
			throw new Awards_Exception_NotEnoughCredits(array('missing' => $amount - $existing_amount));
		}
		$to_user = Users_User::fetch($toUserId, true);
		$to_stream = new Streams_Stream();
		$to_stream->publisherId = $toUserId;
		$to_stream->name = 'Awards/credits';
		if (!$to_stream->retrieve()) {
			$to_stream = self::createStream($to_user);
		}
		$to_stream->setAttribute('amount', $to_stream->getAttribute('amount') - $amount);
		$to_stream->save();
		
		// NOTE: we are not doing transactions here mainly because of sharding.
		// If if we reached this point without exceptions, that means everything worked.
		// But if the following statement fails, then someone will get free credits.
		$from_stream->setAttribute('amount', $from_stream->getAttribute('amount') - $amount);
		$from_stream->save();
		
		$instructions_json = Q::json_encode(array_merge(
			array('app' => Q_Config::expect('Q', 'app')),
			$more
		));
		Streams_Message::post($user->id, $userId, array(
			'type' => 'Awards/credits/sent',
			'content' => $amount,
			'instructions' => $instructions_json
		));
		Streams_Message::post($user->id, $toUserId, array(
			'type' => 'Awards/credits/received',
			'content' => $amount,
			'instructions' => $instructions_json
		));
	}
};