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
		Q_Config::set('Q', 'handlersBeforeEvent', 'Db/query/execute', 'log_query');
//		Q_Config::set('Q', 'handlersAfterEvent', 'Db/query/execute', 'log_shard_query');
	}
}

function log_query($params)
{
	$query = $params['query'];
	$begin = $query->getClause('BEGIN');
	if ($begin) {
		Q::log($begin);
	}
	Q::log("\n\n".$query->getSql()."\n");
	$commit = $query->getClause('COMMIT');
	if ($commit) {
		Q::log($commit);
	}
}
function log_shard_query($params)
{
	Q::log("\nQuerying shard:");
	$sql = $params['sql'];
	$query = $params['query'];
	$begin = $query->getClause('BEGIN');
	if ($begin) Q::log($begin);
	Q::log($sql);
	$commit = $query->getClause('COMMIT');
	if ($commit) Q::log($commit);
	$rollback = $query->getClause('ROLLBACK');
	if ($rollback) Q::log($rollback);
}