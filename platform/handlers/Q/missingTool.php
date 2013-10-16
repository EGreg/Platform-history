<?php

function Q_missingTool($params)
{
	// By default, render an empty tool element with all the options passed
	unset($params['options']['Q_prefix']);
	Q_Response::setToolOptions($params['options']);
	return '';
}
