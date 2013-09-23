<?php

function Q_grammar_tool($options)
{
	Q_Response::addScript('plugins/Q/js/tools/grammar.js');
	Q_Response::addStylesheet('plugins/Q/css/Ui.css');
	Q_Response::setToolOptions($options);
	$authors = Q_Config::get('Q', 'grammar', 'authors', array());
	return Q::view('Q/tool/grammar.php', compact('authors'));
}
