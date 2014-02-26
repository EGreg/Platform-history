<?php

function Websites_before_Q_responseExtras()
{
	Q_Response::setScriptData('Q.plugins.Websites.userId', Q_Config::expect('Websites', 'user', 'id'));
}
