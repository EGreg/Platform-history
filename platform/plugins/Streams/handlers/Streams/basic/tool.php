<?php

function Streams_basic_tool($options)
{
	$show_access = false;
	$prompt = 'Fill out your basic information to complete your signup.';
	extract($options);
	Q_Response::addScript('plugins/Streams/js/Streams.js');
	return Q::view('Streams/tool/basic.php', compact('show_access', 'prompt'));
}