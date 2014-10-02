<?php

function Places_before_Q_responseExtras()
{
	Q_Response::addScript('plugins/Places/js/Places.js');
	Q_Response::addStylesheet("plugins/Places/css/Places.css");
}
