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
	/*
	 * This is where you would place all the static methods for the models,
	 * the ones that don't strongly pertain to a particular row or table.
	 * * * */

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
		if(!$duplicate && self::hasAward($awardName, $userId)) return;
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

	static function topUpAwards($options) {

		// todo: Awards_Credits::pay($currency, $amount, $options);

		$balance = Awards_Credits::amount();
		Awards_Credits::earn((int) $options['amount'], 'Awards/purchased');

		echo "<div>Balance : " . $balance . "</div>";

	}

//     todo: subcription for stripe

	static function stripeSubscription($options) {
	}

	static function stripeToken($options) {
	}

	static function stripeCharge($options) {

		$sub = $options;
		$sub['amount'] = (int) $options['amount'] . '00';

		try {

			$stripeKey = Q_Config::expect('Awards', 'pay', 'stripe', 'secret');

			\Stripe\Stripe::setApiKey($stripeKey);

			$myCard = array(
				'number' => '4242424242424242',
				'exp_year' => 2018,
				'exp_month' => 8,
				'cvc' => 101
			);

			$charge = \Stripe\Charge::create(
				array(
					'card' => $myCard,
					'amount' => $sub['amount'],
					'currency' => $sub['currency'],
					'description' => 'test transaction'
				)
			);

			if ($charge->paid == true) {

				var_dump($charge);
				print_r('</br>');
				print_r('</br>');
			}

		} catch (\Stripe\Error\Card $e) {}

		return $charge;
	}

	static function awardsPaySetup($options)
	{

		require Q_PLUGINS_DIR . '/Awards/classes/Composer/vendor/autoload.php';

//		define("AUTHORIZENET_LOG_FILE", "/var/log/authnet.log");
//		$logger = LogFactory::getLog(get_class($this));

		$options['authname'] = Q_Config::expect('Awards', 'pay', 'authorize.net', 'name');
		$options['authkey'] = Q_Config::expect('Awards', 'pay', 'authorize.net', 'transactionKey');
		$options['server'] = net\authorize\api\constants\ANetEnvironment::SANDBOX;

		return $options;
	}

	static function authCharge($options) {

		$options = Awards::awardsPaySetup($options) + array(
			'service' => 'authorize.net',
			'currency' => 'usd',
			'amount' => '1.99',
			'subscription' => ''
		);

		$customerProfileId = Awards::authCustomerId($options);

		$customerPayId = Awards::authCustomerPaymentProfileId($options, $customerProfileId);

		$transaction = Awards::authChargeCustomer($options, $customerProfileId, $customerPayId);

	}

	static function authSubscription($options) {

		//    $merchantAuthentication->setSessionToken($refId);

		/*
        // Subscription Type Info
        $subscription = new AnetAPI\ARBSubscriptionType();
        $subscription->setName($name);

        $interval = new AnetAPI\PaymentScheduleType\IntervalAType();
        $interval->setLength("1");
        $interval->setUnit("months");

        $paymentSchedule = new AnetAPI\PaymentScheduleType();
        $paymentSchedule->setInterval($interval);
        $paymentSchedule->setStartDate(new DateTime('2020-08-30'));  //date("Y-m-d")));
        $paymentSchedule->setTotalOccurrences("12");
        $paymentSchedule->setTrialOccurrences("1");

        $subscription->setPaymentSchedule($paymentSchedule);
        $subscription->setAmount($sub['amount']);
        $subscription->setTrialAmount("0.00");

        $creditCard = new AnetAPI\CreditCardType();
        $creditCard->setCardNumber("4111111111111111");
        $creditCard->setExpirationDate("2020-12");

        $payment = new AnetAPI\PaymentType();
        $payment->setCreditCard($creditCard);

        $subscription->setPayment($payment);

        //    $subscription->setCustomerID($refId);

        $billTo = new AnetAPI\NameAndAddressType();
        $billTo->setFirstName("John");
        $billTo->setLastName("Smith");

        $subscription->setBillTo($billTo);

        $request = new AnetAPI\ARBCreateSubscriptionRequest();
        $request->setMerchantAuthentication($merchantAuthentication);

        $request->setRefId($refId);

        $order = new AnetAPI\OrderType();
        $order->setInvoiceNumber($refId);
        $order->setDescription($refId);

        $subscription->setOrder($order);

        $request->setSubscription($subscription);

        $controller = new AnetController\ARBCreateSubscriptionController($request);

        $response = $controller->executeWithApiResponse(\net\authorize\api\constants\ANetEnvironment::SANDBOX);

        if (($response != null) && ($response->getMessages()->getResultCode() == "Ok")) {
            echo "SUCCESS: Subscription ID : " . $response->getSubscriptionId() . "\n" . "</br>" . "</br>";
        } else {
            echo "ERROR :  Invalid response\n" . "</br>" . "</br>";
            echo "Response : " . $response->getMessages()->getMessage()[0]->getCode() . "  " . $response->getMessages()->getMessage()[0]->getText() . "\n"  . "</br>" . "</br>";
            print "Details : ";
            var_dump($request);
        }
        */

	}

	static function authCustomerPaymentProfileId($options, $customerId) {

		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);

		$request = new AnetAPI\GetCustomerProfileRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setCustomerProfileId($customerId);
		$controller = new AnetController\GetCustomerProfileController($request);
		$response = $controller->executeWithApiResponse($options['server']);
		if (($response != null) && ($response->getMessages()->getResultCode() == "Ok")) {
			$profileSelected = $response->getProfile();
			$paymentProfilesSelected = $profileSelected->getPaymentProfiles();

			if ($paymentProfilesSelected == null) {

				echo "Please add valid payment method." . "<br>";
				return 0;

			} else {
				$customerPaymentProfileId = $paymentProfilesSelected[0]->getCustomerPaymentProfileId();
			}
//            echo "PayProfileId: " . $customerPaymentProfileId . "<br>";

			return $customerPaymentProfileId;

		} else {
			echo "ERROR :  GetCustomerProfile: Invalid response\n";
			echo "Response : " . $response->getMessages()->getMessage()[0]->getCode() . "  " .$response->getMessages()->getMessage()[0]->getText() . "\n";

			return false;
		}
	}

	static function authChargeCustomer($options, $customerId, $customerPayId) {

		// Common setup for API credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		$paymentProfile = new AnetAPI\PaymentProfileType();
		$paymentProfile->setPaymentProfileId($customerPayId);

		$profileToCharge = new AnetAPI\CustomerProfilePaymentType();
		$profileToCharge->setCustomerProfileId($customerId);
		$profileToCharge->setPaymentProfile($paymentProfile);

		$transactionRequestType = new AnetAPI\TransactionRequestType();
		$transactionRequestType->setTransactionType("authCaptureTransaction");
		$transactionRequestType->setAmount($options['amount']);
		$transactionRequestType->setProfile($profileToCharge);

		$request = new AnetAPI\CreateTransactionRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setRefId($refId);
		$request->setTransactionRequest($transactionRequestType);
		$controller = new AnetController\CreateTransactionController($request);

//    $rows = Awards_Charge::select('*')
//                ->where(array(
//                    'locale' => $params['locale'],
//                    'input' => $r['input']
//                ))
//        ->fetchDbRows();
//    var_dump($rows);

		$response = $controller->executeWithApiResponse($options['server']);
		if ($response != null)
		{
			$tresponse = $response->getTransactionResponse();

			if (($tresponse != null) && ($tresponse->getResponseCode()=="1") )
			{

//            echo " Charge Customer Profile APPROVED  :" . "\n";
//            echo "AUTH CODE: " . $tresponse->getAuthCode() . "<br>";
//            echo "TRANS ID: " . $tresponse->getTransId() . "<br>";

				$charge = new Awards_Charge();

				//$charge->insert($fields);

				$charge->save();

//				echo ('<br>-------------<br>');
//				echo ($customerProfileId);
//				echo ('<br>-------------<br>');
//				echo ($customerPayId);
//				echo ('<br>-------------<br>');
//				var_dump($payment);
//				echo ('<br>-------------<br>');

				$results = $tresponse;

				return $results;

			}
			elseif (($tresponse != null) && ($tresponse->getResponseCode()=="3") )
			{
//				echo "A duplicate transaction has been submitted";
				return null;
			}
			elseif (($tresponse != null) && ($tresponse->getResponseCode()=="4") )
			{
//				echo  "ERROR: HELD FOR REVIEW";
				return null;
			}
			else
			{
				return null;
//				return $tresponse->getResponseCode();
			}
		}
		else
		{
			echo "no response returned";
			return false;
		}
	}

	static function authCustomerId($options) {

		$sub = $options;
		$sub['amount'] = (int) $options['amount'];

		// Common Set Up for API Credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		// TODO: check if customer with corresponding e-mail exists before creating new one

		$merchantCustomerId = Users::loggedInUser()->id;

		$customerprofile = new AnetAPI\CustomerProfileType();
		$customerprofile->setMerchantCustomerId($merchantCustomerId);
		$customerprofile->setDescription("Customer registered for hosted form payments");
		$customerprofile->setEmail(Users::loggedInUser()->emailAddress);

		$request = new AnetAPI\CreateCustomerProfileRequest();
		$request->setMerchantAuthentication($merchantAuthentication);
		$request->setRefId($refId);
		$request->setProfile($customerprofile);

		$controller = new AnetController\CreateCustomerProfileController($request);

		$response = $controller->executeWithApiResponse($options['server']);

		if (($response != null) && ($response->getMessages()->getResultCode() == "Ok")) {

			return $response->getCustomerProfileId();

		} elseif (($response != null) && ($response->getMessages()->getMessage()[0]->getCode() == "E00039")) {

			// workaround to get customerProfileId
			// https://community.developer.authorize.net/t5/Integration-and-Testing/How-to-lookup-customerProfileId-and-paymentProfileId-by/td-p/52501

			return explode(" ", $response->getMessages()->getMessage()[0]->getText())[5];

		} else {
			echo "ERROR :  Invalid response\n";
			echo "Response : " . $response->getMessages()->getMessage()[0]->getCode() . "  " .$response->getMessages()->getMessage()[0]->getText() . "\n";

			return false;
		}
	}

	static function authToken($options, $customerProfileId) {

		$sub = $options;
		$sub['amount'] = (int) $options['amount'];

		// Common Set Up for API Credentials
		$merchantAuthentication = new AnetAPI\MerchantAuthenticationType();
		$merchantAuthentication->setName($options['authname']);
		$merchantAuthentication->setTransactionKey($options['authkey']);
		$refId = 'ref' . time();

		$setting = new AnetAPI\SettingType();

		// 2do: fix domain name and path for iframe popup

		$setting->setSettingName("hostedProfileIFrameCommunicatorUrl");
		$setting->setSettingValue('https://' . $_SERVER['HTTP_HOST'] . 'authnet_iframe_communicator.html'

//        baseUrl()
//
//        $_SERVER['REQUEST_SCHEME']
//        wish/authnet_iframe_communicator.html"

		);

		$setting->setSettingName("hostedProfilePageBorderVisible");
		$setting->setSettingValue("false");

		$frequest = new AnetAPI\GetHostedProfilePageRequest();
		$frequest->setMerchantAuthentication($merchantAuthentication);
		$frequest->setCustomerProfileId($customerProfileId);
		$frequest->addToHostedProfileSettings($setting);

		$controller = new AnetController\GetHostedProfilePageController($frequest);
		$fresponse = $controller->executeWithApiResponse($options['server']);

		if (($fresponse != null) && ($fresponse->getMessages()->getResultCode() == "Ok")) {
//                echo $fresponse->getMessages()->getMessage()[0]->getCode()."\n";
//                echo $fresponse->getMessages()->getMessage()[0]->getText()."\n";
//                echo $fresponse->getToken()."\n";

			return $fresponse->getToken();

		} else {
			echo "ERROR :  Failed to get hosted profile page\n";
			echo "Response : " . $fresponse->getMessages()->getMessage()[0]->getCode() . "  " .$fresponse->getMessages()->getMessage()[0]->getText() . "\n";

			return false;
		}
	}

	static function authForm($options, $token) {

		echo (
			'<form'
			.' method="POST"'
			.' action="https://test.authorize.net/profile/manage"'
			.' target="authnet"'
			.' id="authnetform"'
			.' name="authnetform"'
			.' >'
		);

		echo ('<input type="hidden" name="Token" value="' . $token . '">' );
		echo ('<input class="Q_button Awards_auth" type="submit" value="Payment info"/>' );
		echo ('</form>' );

		echo ('<button class="Q_button Awards_confirm">Make subscription</button>' );

	}

	/* * * */
};