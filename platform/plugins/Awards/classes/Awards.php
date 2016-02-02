<?php
/**
 * Awards model
 * @module Awards
 * @main Awards
 */
/**
 * Static methods for the Awards models.
 * @class Awards
 * @extends Base_Awards
 */

use net\authorize\api\contract\v1 as AnetAPI;
use net\authorize\api\controller as AnetController;
use net\authorize\util\LogFactory as LogFactory;

abstract class Awards extends Base_Awards
{
	/**
	 * @method giveAward
	 * @static
	 * @param  {string}  $awardName
	 * @param  {string}  $userId
	 * @param  {string}  [$associated_id='']
	 * @param  {boolean} [$duplicate=true]
	 */
	static function giveAward($awardName, $userId, $associated_id='', $duplicate=true)
	{
		if (!$duplicate and self::hasAward($awardName, $userId)) {
			return;
		}
		$earnedBadge = new Awards_Earned();
		$earnedBadge->app = Q_Config::expect('Q', 'app');
		$earnedBadge->badge_name = $awardName;
		$earnedBadge->userId = $userId;
		$earnedBadge->associated_id = $associated_id;
		$earnedBadge->save();
		$earnedBadge = null;
	}

	/**
	 * @method hasAward
	 * @static
	 * @param  {string}  $awardName
	 * @param  {string}  $userId
	 * @return {boolean}
	 */
	static function hasAward($awardName, $userId)
	{
		$exists = new Awards_Earned();
		$exists->app = Q_Config::expect('Q', 'app');
		$exists->userId = $userId;
		$exists->badge_name = $awardName;
		return $exists->retrieve()? true : false;
	}

	/**
	 * @method getAwards
	 * @static
	 * @param $userId {string} User ID
	 * @param  {string|boolean} [$app=false] Application name
	 * @return {array}
	 */
	static function getAwards($userId, $app=false)
	{
		$whereArray = array('ern.userId'=>$userId);
		if($app !== false){
			$whereArray['ern.app'] = $app;
		}

		$awardsEarned = Awards_Earned::select('ern.*,  bdg.pic_small, bdg.pic_big, bdg.title, bdg.points', 'ern')
				->join(Awards_Badge::table().' AS bdg', array('ern.badge_name'=>'bdg.name', 'ern.app'=>'bdg.app'))
				->where($whereArray)
				->fetchDbRows();

		return $awardsEarned;
	}

	/**
	 * Calculates award leaders and update table
	 * @method calculateLeaders
	 * @static
	 * @param {string} $app
	 * @return {boolean}
	 */
	static function calculateLeaders($app)
	{
		$leaders = Awards_Earned::select('ern.app AS app, CURDATE() AS day_calculated, ern.userId AS userId, SUM(bdg.points) AS points', 'ern')
				->join(Awards_Badge::table().' AS bdg', array('ern.badge_name'=>'bdg.name', 'ern.app'=>'bdg.app'))
				->where('ern.app="'.$app.'" AND ern.insertedTime>=ADDDATE(CURDATE(), INTERVAL -7 DAY) AND ern.insertedTime<=CURDATE()')
				->groupBy('ern.userId')
				->fetchDbRows();

		if(!empty($leaders)){
			foreach($leaders as $leader){
				$awardsLeader = new Awards_Leader();
				$awardsLeader->app = $leader->app;
				$awardsLeader->day = $leader->day_calculated;

				$result = $awardsLeader->retrieve();
				if(!empty($result)) return false;

				$awardsLeader->userId = $leader->userId;
				$awardsLeader->points = $leader->points;
				$awardsLeader->save();
			}
			$awardsLeader = null;
			return true;
		}else{
			return false;
		}
	}

	/**
	 * Retrieves total points for user
	 * @method getTotalPoints
	 * @static
	 * @param $userId {string} User ID
	 * @param $app {string} Application name
	 * @return {integer|false} Total points
	 */
	static function getTotalPoints($userId, $app)
	{
		$whereArray = array('ern.userId'=>$userId, 'ern.app'=>$app);

		$totalPoints = Awards_Earned::select('SUM(bdg.points) AS total_points', 'ern')
				->join(Awards_Badge::table().' AS bdg', array('ern.badge_name'=>'bdg.name', 'ern.app'=>'bdg.app'))
				->where($whereArray)
				->fetchDbRows();
		if(!empty($totalPoints)){
			return $totalPoints[0]->total_points;
		}else{
			return false;
		}
	}

	/**
	 * Makes a one-time charge on a customer account using a payments processor
	 * @param {string} $payments The type of payments processor, could be "Authnet" or "Stripe"
	 * @throws Awards_Exception_DuplicateTransaction
	 * @throws Awards_Exception_HeldForReview
	 * @throws Awards_Exception_ChargeFailed
	 * @return {Awards_Charge} the saved database row corresponding to the charge
	 */
	static function charge ($payments, $options = array())
	{
		$className = 'Awards_Payments_' . ucfirst($payments);
		$adapter = new $className($options);
		return $adapter->charge();
	}

	/**
	 * Starts a recurring subscription
	 * @param {Streams_Stream} $plan The subscription plan stream
	 * @param {string} $payments The type of payments processor, could be "Authnet" or "Stripe"
	 * @param {array} [$options=array()] Options for the subscription
	 * @param {date} [$options.startDate=today] The start date of the subscription
	 * @param {date} [$options.endDate=today+year] The end date of the subscription
	 * @throws Awards_Exception_DuplicateTransaction
	 * @throws Awards_Exception_HeldForReview
	 * @throws Awards_Exception_ChargeFailed
	 * @return {Streams_Stream} A stream of type 'Awards/subscription' representing this subscription
	 */
	static function startSubscription($plan, $payments = null, $options = $array())
	{
		$userId = $user = Users::loggedInUser(true)->id;
		
		if (isset($payments)) {
			$amount = $plan->getAttribute('amount', null);
			if (!is_numeric($amount)) {
				throw new Q_Exception_WrongValue(array(
					'field' => 'amount',
					'range' => 'an integer'
				));
			}
			Awards::charge($payments, array(
				'amount' => $amount,
				'currency' => 'usd'
			));
		}

		$startDate = Q::ifset($options, 'startDate', date("Y-m-d"));
		$startDate = date('Y-m-d', strtotime($startDate));
		$endDate = date("Y-m-d", strtotime("-1 day", strtotime("+1 year", strtotime($startDate))));
		$endDate = date('Y-m-d', strtotime($endDate));

		$stream = new Streams_Stream();
		$stream->publisherId = Users::communityId();
		$stream->name = "Awards/subscriptions/$userId/$planStreamName";
		$stream->type = "Awards/subscription";
		$stream->readLevel = 40;
		$stream->writeLevel = 0;
		$stream->adminLevel = 0;
		$stream->setAttribute('startDate', $startDate);
		$stream->setAttribute('endDate', $endDate);
		$stream->save(true);

		return $stream;
	}

	static function stopSubscription($subscriptionStream, $options = array()) {
		// call this if we learn that a subscription has stopped, so we mark it as inactive.
		// the customer could use the credit card info to start a new subscription.
	}

	/* * * */
};

interface iAwards_Payments
{
	/**
	 * Interface class for Awards_Payments adapters
	 * @class iAwards_Payments
	 * @param {array} [$options=array()] Any initial options
	 * @constructor
	 */
	function __construct($options = array());
	
	/**
	 * Make a one-time charge using the payments processor
	 * @method charge
	 * @param {string} [$customerId=null] specify a customer id
	 * @param {string} [$paymentProfileId=null] specify a payment profile
	 * @throws Awards_Exception_DuplicateTransaction
	 * @throws Awards_Exception_HeldForReview
	 * @throws Awards_Exception_ChargeFailed
	 * @return {Awards_Charge} the saved database row corresponding to the charge
	 */
	static function charge($customerId = null, $paymentProfileId = null);
	
	/**
	 * Executes some API calls and obtains a customer id that unifies payment profile ids
	 * @method customerId
	 * @return {string} The customer id
	 */
	function customerId();
	
	/**
	 * Executes some API calls and obtains a payment profile id
	 * @method paymentProfileId
	 * @return {string} The payment profile id
	 */
	function paymentProfileId();
}