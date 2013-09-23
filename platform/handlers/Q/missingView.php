<?php

function Q_missingView($params)
{
	extract($params);
	/**
	 * @var string $view_name
	 */
	return "Missing view $view_name";
}
