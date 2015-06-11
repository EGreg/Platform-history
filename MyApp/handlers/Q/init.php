<?php

function Q_init()
{
	if (!empty($_SERVER['HTTP_HOST'])) {
		// the following statement causes the session to be opened for every request
		Q_Session::setNonce();
	}
	
	if (Q_Config::get('First', 'testing', false)) {
		// sometimes the APC can cause files to appear missing
		// if they were created after it tried to load them once
		apc_clear_cache('user');
	}
	
	if (Q_Config::get('Db', 'logging', true)) {
		// logging database queries
		Q::log("\n-----");
		Q_Config::set('Q', 'handlersAfterEvent', 'Db/query/execute', 'log_shard_query');
	}
}

function log_shard_query($params)
{
	foreach ($params['queries'] as $shard => $query) {
		$connection = $query->db->connectionName();
		if ($begin = $query->getClause('BEGIN')
		and $query->nestedTransactionCount == 1) {
			Q::log($begin);
		}
		Q::log("\nQuery $connection on shard \"$shard\":\n$params[sql]\n");
		if ($commit = $query->getClause('COMMIT')
		and $query->nestedTransactionCount == 0) {
			Q::log($commit);
		}
		if ($rollback = $query->getClause('ROLLBACK')) {
			Q::log($rollback);
		}
	}
}