<?php

function Q_after_Q_tool_render($params, &$result)
{	
	$tool_name = $params['tool_name'];
	// $options = $params['options'];
	$options = Q_Response::getToolOptions();
	$extra = $params['extra'];
	if (!is_array($extra)) {
		$extra = array();
	}

	$tag = !empty($extra['tag']) ? $extra['tag'] : 'div';
	if (empty($extra['inner'])) {
		$classes = implode('_', explode('/', $tool_name)) . '_tool';
		if (isset($extra['classes'])) {
			$classes .= ' ' . $extra['classes'];
		}
		if (isset($options)) {
			$friendly_options = str_replace(
				array('&quot;', '\/'),
				array('"', '/'),
				Q_Html::text(json_encode($options))
			);
			$normalized = Q_Utils::normalize($tool_name, '-');
			$data_options = " data-$normalized='$friendly_options'";
		} else {
			$data_options = '';
		}
		$id_prefix = Q_Html::getIdPrefix();
		$data_cache = isset($extra['cache']) || Q_Response::shouldCacheTool($id_prefix)
			? " data-Q-cache='document'"
			: '';
		$result = "<!--\n\nstart tool $tool_name\n\n-->"
		 . "<$tag id='{$id_prefix}tool' class='Q_tool $classes'$data_options$data_cache>"
		 . $result 
		 . "</div><!--\n\nend tool $tool_name \n\n-->";
	}
	
	$prefix = Q_Html::popIdPrefix();
}
