<?php

function Streams_after_Users_insertUser ($params) {
	extract($params);
	/**
	 * @var string $during
	 */
	if ($during !== 'register') return;
	if (empty(Streams::$cache['register'])) return;
	extract(Streams::$cache['register']);
	if (empty($first) and empty($last)) return;

	if (isset($first) and isset($last)) $params['user']->fullname = "$first $last";
	else $params['user']->fullname = isset($first) ? $first : $last;
}
