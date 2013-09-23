<?php
/**
 * @module Users
 */
/**
 * Class representing 'Vote' rows in the 'Users' database
 * You can create an object of this class either to
 * access its non-static methods, or to actually
 * represent a vote row in the Users database.
 *
 * @class Users_Vote
 * @extends Base_Users_Vote
 */
class Users_Vote extends Base_Users_Vote
{
	/**
	 * The setUp() method is called the first time
	 * an object of this class is constructed.
	 * @method setUp
	 */
	function setUp()
	{
		parent::setUp();
	}
	/**
	 * Calculates total votes
	 * @method beforeSave
	 * @param {array} $modified_fields
	 * @return {array}
	 */
	function beforeSave($modified_fields)
	{
		$total = new Users_Total();
		$total->forType = $this->forType;
		$total->forId = $this->forId;
		if (!$total->retrieve('*', false, array("begin" => true))) {
			$total->weightTotal = 0;
			$total->voteCount = 0;
			$total->value = 0;
		}
		$total->set('transaction', true);
		
		$vote = new Users_Vote();
		$vote->userId = $modified_fields['userId'];
		$vote->forType = $modified_fields['forType'];
		$vote->forId = $modified_fields['forId'];
		$weightTotal = $total->weightTotal;
		if ($vote->retrieve()) {
			if (!$total->voteCount) {
				// something is wrong
				$total->voteCount = 1;
			}
			$total->weightTotal += ($modified_fields['weight'] - $vote->weight);
			if (!$total->weightTotal) {
				throw new Q_Exception_BadValue(array('internal' => 'Users_Vote_Total table', 'problem' => 'weight is 0'));
			}
			$total->value = 
				($total->value * $weightTotal 
					- $vote->value * $vote->weight 
					+ $modified_fields['value'] * $modified_fields['weight'])
				/ ($total->weightTotal);
		} else {
			$total->weightTotal += $modified_fields['weight'];
			$total->voteCount += 1;
			$total->value = ($total->value * $weightTotal + $modified_fields['value'] * $modified_fields['weight'])
				/ ($total->weightTotal);
		}
	
		$this->set('total', $total);
		return parent::beforeSave($modified_fields);
	}
	
	/**
	 * Updates total votes in Total table
	 * @method afterSaveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @param {array} $modified_fields
	 * @param {array} $where
	 * @return {Db_Result}
	 */
	function afterSaveExecute($result, $query, $modified_fields, $where)
	{
		$total = $this->get('total', false);
		if (!$total) return;
		
		if ($total->get('transaction', false)) {
			$total->save(true, true); // this commits the transaction
		} else {
			$total->save(true); // this simply saves the total
		}
		return $result;
	}
	
	/**
	 * Calculates total votes
	 * @method beforeRemove
	 * @param {array} $pk
	 * @return {boolean}
	 */
	function beforeRemove($pk)
	{	
		$vote = new Users_Vote();
		$vote->userId = $this->userId;
		$vote->forType = $this->forType;
		$vote->forId = $this->forId;
		if ($vote->retrieve()) {
			$total = new Users_Total();
			$total->forType = $vote->forType;
			$total->forId = $vote->forId;
			if ($total->retrieve('*', false, array('begin' => true))) {
				$weightTotal = $total->weightTotal;
				$total->set('transaction', true);
				$total->weightTotal -= $vote->weight;
				if (!$total->weightTotal) {
					$total->value = 0;
				} else {
					$total->value = 
						($total->value * $weightTotal - $vote->value * $vote->weight)
						/ ($total->weightTotal);
				}
				$total->voteCount -= 1;
			} else {
				// something is wrong ... if there are votes, there should have been a total
				$total->weightTotal = 0;
				$total->voteCount = 0;
				$total->value = 0;
			}
			$this->set('total', $total);
		}
		return true;
	}
	
	/**
	 * Updates total votes in Total table
	 * @method afterRemoveExecute
	 * @param {Db_Result} $result
	 * @param {Db_Query} $query
	 * @return {Db_Result}
	 */
	function afterRemoveExecute($result, $query)
	{
		$total = $this->get('total', false);
		if (!$total) return $result;

		if ($total->get('transaction', false)) {
			$total->save(true, true); // this commits the transaction
		} else {
			$total->save(true); // this simply saves the total
		}
		return $result;
	}

	/* * * */
	/**
	 * Implements the __set_state method, so it can work with
	 * with var_export and be re-imported successfully.
	 * @method __set_state
	 * @param {array} $array
	 * @return {Users_Vote} Class instance
	 */
	static function __set_state(array $array) {
		$result = new Users_Vote();
		foreach($array as $k => $v)
			$result->$k = $v;
		return $result;
	}
};