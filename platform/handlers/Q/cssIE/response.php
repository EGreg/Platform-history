<?php

function Q_cssIE_response()
{
	header('Content-Type: text/css');
	$base_url = Q_Request::baseUrl();
	$contents = '';
	$css = $_REQUEST['f'];
	$path = Q::realPath($css);
	if (!$path)
	{
		$css = "web/css/$css";
		$path = Q::realPath($css);
	}
	if (!$path)
	{
		$css = "plugins/Q/web/css/$css";
		$path = Q::realPath($css);
	}
	if ($path)
	{
		$contents = file_get_contents($path);
	}
	$contents = preg_replace("/behavior:\s?url\([\'\"]?/i", "$0$base_url", $contents);
	echo $contents;
	return false;
}
