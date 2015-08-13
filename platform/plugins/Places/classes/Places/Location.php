<?php
	
class Places_Location
{
	/**
	 * Get the logged-in user's location stream
	 * @method userStream
	 * @param {boolean} [$throwIfNotLoggedIn=false]
	 *   Whether to throw a Users_Exception_NotLoggedIn if no user is logged in.
	 * @return {Streams_Stream|null}
	 * @throws {Users_Exception_NotLoggedIn} If user is not logged in and
	 *   $throwIfNotLoggedIn is true
	 */
	static function userStream($throwIfNotLoggedIn = false)
	{
		$user = Users::loggedInUser($throwIfNotLoggedIn);
		if (!$user) {
			return null;
		}
		$streamName = "Places/user/location";
		$stream = Streams::fetchOne($user->id, $user->id, $streamName);
		if (!$stream) {
			$stream = new Streams_Stream();
			$stream->publisherId = $user->id;
			$stream->name = $streamName;
			$stream->type = "Places/location";
			$stream->title = "User location";
			$stream->save();
			$stream->join();
		}
		return $stream;
	}
	
	/**
	 * Get a Places/location stream published by a publisher for a given placeId.
	 * This is used to cache information from the Google Places API.
	 * @method stream
	 * @static
	 * @param {string} $publisherId
	 * @param {string} $placeId The id of the place in Google Places
	 * @param {boolean} $throwIfBadValue
	 *  Whether to throw Q_Exception if the result contains a bad value
	 * @return {Streams_Stream|null}
	 * @throws {Q_Exception} if a bad value is encountered and $throwIfBadValue is true
	 */
	static function stream($publisherId, $placeId, $throwIfBadValue = false)
	{
		if (empty($placeId)) {
			if ($throwIfBadValue) {
				throw new Q_Exception_RequiredField(array('field' => 'id'));
			}
			return null;
		}
		
		// sanitize the ID
		$characters = '/[^A-Za-z0-9]+/';
		$result = preg_replace($characters, '_', $placeId);
		
		// see if it's already in the system
		$location = new Streams_Stream();
		$location->publisherId = $publisherId;
		$location->name = "Places/location/$placeId";
		if ($location->retrieve()) {
			$ut = $location->updatedTime;
			if (isset($ut)) {
				$db = $location->db();
				$ut = $db->fromDateTime($ut);
				$ct = $db->getCurrentTimestamp();
				$cd = Q_Config::get('Places', 'cache', 'duration', 60*60*24*30);
				if ($ct - $ut < $cd) {
					// there is a cached location stream that is still viable
					return $location;
				}
			}
		}
		
		$key = Q_Config::expect('Places', 'google', 'keys', 'server');
		$query = http_build_query(array('key' => $key, 'placeid' => $placeId));
		$url = "https://maps.googleapis.com/maps/api/place/details/json?$query";
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$json = curl_exec($ch);
		curl_close($ch);
		$response = json_decode($json, true);
		if (empty($response['result'])) {
			throw new Q_Exception("Places_Location::stream: Couldn't obtain place information for $placeId");
		}
		if (!empty($response['error_message'])) {
			throw new Q_Exception("Places_Location::stream: ".$response['error_message']);
		}
		$result = $response['result'];
		$attributes = array(
			'name' => $result['name'],
			'latitude' => $result['geometry']['location']['lat'],
			'longitude' => $result['geometry']['location']['lng'],
			// 'icon' => $result['icon'],
			'phoneNumber' => Q::ifset($result, 'international_phone_number', null),
			'phoneFormatted' => Q::ifset($result, 'formatted_phone_number', null),
			'rating' => Q::ifset($result, 'rating', null),
			'address' => Q::ifset($result, 'formatted_address', null)
		);
		$location->setAttribute($attributes);
		$location->type = 'Places/location';
		$location->save();
		return $location;
	}
}