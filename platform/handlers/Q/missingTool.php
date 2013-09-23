<?php

function Q_missingTool($params)
{
	// By default, render an empty tool element with all the options passed
	unset($params['fields']['Q_prefix']);
	Q_Response::setToolOptions($params['fields']);
	return '';
}
