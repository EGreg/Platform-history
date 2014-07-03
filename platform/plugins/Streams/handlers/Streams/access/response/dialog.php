<?php

function Streams_access_response_dialog()
{
	Q_Html::pushIdPrefix(Q::ifset($_REQUEST, 'idPrefix', 'dialog_'));
	$result = Q::event('Streams/access/response/content');
	Q_Html::popIdPrefix();
	return $result;
}