<?php

function Q_exception_native($params)
{
	extract($params);
	/**
	 * @var Exception $exception 
	 */

	if ($is_ajax = Q_Request::isAjax()) {
		// Render a JSON layout for ajax
		switch (strtolower($is_ajax)) {
		case 'json':
		default:
			$json = @Q::json_encode(array(
				'errors' => Q_Exception::toArray(array($exception))
			));
			$callback = Q_Request::callback();
			header("Content-type: " . ($callback ? "application/javascript" : "application/json"));
			echo $callback ? "$callback($json)" : $json;
		}
	} else {
		if (Q::textMode()) {
			echo $exception->colored();
			exit;
		}
		$message = $exception->getMessage();
		$file = $exception->getFile();
		$line = $exception->getLine();
		if (is_callable(array($this, 'getTraceAsStringEx'))) {
			$trace_string = $exception->getTraceAsStringEx();
		} else {
			$trace_string = $exception->getTraceAsString();
		}
		if (($exception instanceof Q_Exception_PhpError)
		or !empty($exception->messageIsHtml)) {
			// do not sanitize $message
		} else {
			$message = Q_Html::text($message);
		}
		$content = "<h1 class='exception_message'>$message</h1>";
		if (Q_Config::get('Q', 'exception', 'showFileAndLine', true)) {
			$content .= "<h3 class='exception_fileAndLine'>in $file ($line)</h3>";
		}
		if (Q_Config::get('Q', 'exception', 'showTrace', true)) {
			$content .= "<pre class='exception_trace'>$trace_string</pre>";
		}
		$content .= str_repeat(' ', 512); // because of chrome
		$title = "Exception occurred";
		$dashboard = "";
		echo Q::view('Q/layout/html.php', compact('content', 'dashboard', 'title'));
	}
	$app = Q_Config::get('Q', 'app', null);
	$colored = $exception->colored();
	Q::log(
		"$app: Exception in " . ceil(Q::milliseconds()) . "ms:\n\n$colored\n",
		null, true, array('maxLength' => 10000)
	);
}
