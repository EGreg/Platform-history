<?php

function Q_response_notices()
{
	$result = "";
	$notices = Q_Response::getNotices();
	
	// Get any notices that we should know about
	if (!empty($notices)) {
		$result .= "<ul class='Q_notices'>";
		foreach ($notices as $k => $n) {
			$result .= "<li data-key=\"$k\">$n</li>\n";
		}
		$result .= "</ul>";
	}

	// Get any errors that we should display
	$errors = Q_Response::getErrors();
	if (!empty($errors)) {
		$result .= "<ul class='Q_errors'>";
		foreach ($errors as $e) {
			$field = '';
			if ($e instanceof Q_Exception and $fields = $e->inputFields()) {
				$field .= '<div class="Q_field_name">'.Q_Html::text(reset($fields)).'</div>';
			}
			$result .= "<li>".$e->getMessage()."$field</li>";
		}
		$result .= "</ul>";
	}
	
	$removed_notices = Q_Response::getRemovedNotices();
	if (!empty($removed_notices)) {
		$json = json_encode($removed_notices);
		Q_Response::addScriptLine("if (Q.Notices) Q.handle(Q.Notices.add($json));");
	}

	return $result ? "<div id='notices'>$result</div>" : '';
}
