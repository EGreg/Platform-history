<?php

function Streams_subscription_response_form()
{
	if (isset(Streams::$cache['rule'])) {
		return Streams::$cache['rule'];
	} else {
		return Streams::$cache['subscription'];
	}
}