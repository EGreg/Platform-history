<?php

function Q_grammar_response_data()
{
	if (isset($_SESSION['Q_grammar_post_succes']))
	{
		return array('sent' => $_SESSION['Q_grammar_post_succes']);
		unset($_SESSION['Q_grammar_post_succes']);
	}
	return array('sent' => false);
}
