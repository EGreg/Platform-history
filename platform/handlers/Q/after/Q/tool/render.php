<?php

function Q_after_Q_tool_render($params, &$result)
{	
	$tool_name = $params['tool_name'];
	$fields = $params['fields'];
	$options = Q_Response::getToolOptions();
	$Q_options = $params['Q_options'];
	if (!is_array($Q_options)) {
		$Q_options = array();
	}

	$tag = !empty($Q_options['tag']) ? $Q_options['tag'] : 'div';
	if (empty($Q_options['inner'])) {
		$classes = implode('_', explode('/', $tool_name)) . '_tool';
		if (isset($Q_options['classes'])) {
			$classes .= ' ' . $Q_options['classes'];
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
		$data_cache = isset($Q_options['cache']) || Q_Response::shouldCacheTool($id_prefix)
			? " data-Q-cache='document'"
			: '';
		$result = "<!--\n\nstart tool $tool_name\n\n-->"
		 . "<$tag id='{$id_prefix}tool' class='Q_tool $classes'$data_options$data_cache>"
		 . $result 
		 . "</div><!--\n\nend tool $tool_name \n\n-->";
	}
	
	$prefix = Q_Html::popIdPrefix();
}
