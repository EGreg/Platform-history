<?php

function Q_before_Q_view ($params, &$result) {
	extract($params);
	if (strtolower(substr($view_name, -9)) === '.mustache') {
		$result = Q_Mustache::render($view_name, $params);
		return false;
	}
	if (strtolower(substr($view_name, -11)) === '.handlebars') {
		$result = Q_Handlebars::render($view_name, $params);
		return false;
	}
}