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

	/* * * */
};