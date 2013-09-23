<?php

function Q_init()
{
	// the following statement causes the session to be opened for every request
	if (!empty($_SERVER['HTTP_HOST'])) {
		Q_Session::setNonce();
	}
	
	$logging = Q_Config::get('Db', 'logging', true);
	if ($logging) {
		Q::log("\n-----");
		Q_Config::set('Q', 'handlersBeforeEvent', 'Db/query/execute', 'temp_query');
	}
}

function temp_query($params)
{
	$query = $params['query'];
	$begin = $query->getClause('BEGIN');
	if ($begin) {
		Q::log($begin);
	}
	$query->getSql("Q::log");
	$commit = $query->getClause('COMMIT');
	if ($commit) Q::log($commit);
	$rollback = $query->getClause('ROLLBACK');
	if ($rollback) Q::log($rollback);
}