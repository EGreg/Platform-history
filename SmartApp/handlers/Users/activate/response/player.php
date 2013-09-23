<?php

function Users_activate_response_player()
{
	Q::includeFile('handlers/Users/activate/response/content.php', array(), true);
	$contents = Users_activate_response_content();
	return Q::view("SmartApp/slots/player.php", compact('contents'));
}
