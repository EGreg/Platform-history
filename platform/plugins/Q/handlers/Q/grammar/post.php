<?php

function Q_grammar_post()
{
	//$url = $_REQUEST['url'];
	$text = $_REQUEST['text'];
	$comment = $_REQUEST['comment'];
	$author = $_REQUEST['author'];
	$url = $_SERVER['HTTP_REFERER'];
	
	$smtp = Q_Config::get('Q', 'email', 'smtp', array('host' => 'sendmail'));
	$transport = new Zend_Mail_Transport_Smtp($smtp['host'], $smtp);
	
	$body = "<p>Someone pointed out an error in your documentation at <a href=\"$url\">$url</a></p>"
	      . "<p>Incorrect text:</p><p style=\"padding: 5px; border: dashed 1px #CCC\">$text</p>";
	if ($comment)
	{
		$body .= "<p>Reader comment:</p><p style=\"padding: 5px; border: dashed 1px #CCC\">$comment</p>";
	}
	
	$mail = new Zend_Mail('UTF-8');
	$result = $mail->setBodyHtml($body, 'UTF-8')
	               ->setSubject('Q/grammar: error in documentation')
	               ->addTo($author)
	               ->setFrom('no-reply@qbix.com', 'Q platform')
	               ->send($transport);
	
	$_SESSION['Q_grammar_post_succes'] = $result;
}
