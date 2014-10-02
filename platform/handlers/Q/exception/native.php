<?php

function Q_exception_native($params)
{
	extract($params);
	/**
	 * @var Exception $exception 
	 */

	$message = $exception->getMessage();
	$file = $exception->getFile();
	$line = $exception->getLine();
	if (is_callable(array($exception, 'getTraceAsStringEx'))) {
		$trace_string = $exception->getTraceAsStringEx();
	} else {
		$trace_string = $exception->getTraceAsString();
	}
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
			$colors = Q_Config::get('Q', 'exception', 'colors', array());
			Q::autoload('Q_Utils');
			$fields = array(
				'message' => $message,
				'fileAndLine' => "in $file ($line)",
				'trace' => $trace_string
			);
			foreach ($fields as $f => $v) {
				$c0 = isset($colors[$f][0]) ? $colors[$f][0] : null;
				$c1 = isset($colors[$f][1]) ? $colors[$f][1] : null;
				$fields[$f] = Q_Utils::colored($v, $c0, $c1);
			}
			
			$content = "$fields[message]\n$fields[fileAndLine]\n$fields[trace]";
			echo $content;
			echo "\n";
			exit;
		} else {
			if (($exception instanceof Q_Exception_PhpError) or !empty($exception->messageIsHtml)) {
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
	}
	$app = Q_Config::get('Q', 'app', null);
	Q::log("$app: Exception in " . ceil(Q::milliseconds()) . "ms\n" );
	Q::log("$message\n  in $file ($line)");
	Q::log("$trace_string\n");
}
