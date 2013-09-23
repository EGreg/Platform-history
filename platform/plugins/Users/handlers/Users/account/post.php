<?php

function Users_account_post()
{
	Q_Session::start();
	Q_Valid::nonce(true);

	extract($_REQUEST);

	// Implement the action

	$user = Users::loggedInUser(true);

	/*
      if (!isset($gender) and isset($user->gender)) {
              $gender = $user->gender;                                                                                        
      }
      if (isset($orientation)) {
              if (isset($gender) and $orientation == 'straight') {
                      $desired_gender = ($gender == 'male') ? 'female' : 'male';
              } else if (isset($gender) and $orientation == 'gay') {
                      $desired_gender = $gender;
              } else {
                      $desired_gender = 'either';
              }
      }

      if (isset($firstName)) $user->firstName = $firstName;
      if (isset($lastName)) $user->lastName = $lastName;
      if (isset($gender)) $user->gender = $gender;
      if (isset($desired_gender)) $user->desired_gender = $desired_gender;
      if (isset($username)) $user->username = $username;
      if (isset($relationship_status)) {
              $user->relationship_status = $relationship_status;
      }
      if (isset($birthday_year)) {
              $user->birthday = date("Y-m-d", mktime(
                      0, 0, 0, $birthday_month, $birthday_day, $birthday_year
              ));
      }
      if (isset($zipcode)) $user->zipcode = $zipcode;

		$user->save(true);
	*/
	
      // the $_SESSION['Users']['user'] is now altered
}
