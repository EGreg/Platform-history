<?php

function Q_before_Q_tool_render($params, &$result)
{
	static $prefix_was_rendered = array();
	static $temp_id = 0;
	
	$tool_name = $params['tool_name'];
	$extra = $params['extra'];
	$prefix = implode('_', explode('/', $tool_name)) . '_';
	if (is_string($extra)) {
		$id = $extra;
		$extra = array();
	} else {
		$id = isset($extra['id']) ? $extra['id'] : '';
	}
	if (!empty($id)) {
		$prefix = $prefix.'_'.$id;
	}
	
	$cur_prefix = isset($extra['prefix']) ? $extra['prefix'] : Q_Html::getIdPrefix();
	$tool_prefix = $cur_prefix . $prefix;

	if (isset($prefix_was_rendered[$tool_prefix])) {
		trigger_error("A tool with prefix \"$tool_prefix\" was already rendered.", E_USER_NOTICE);
	}
	$prefix_was_rendered[$tool_prefix] = true;
	$prev_prefix = Q_Html::pushIdPrefix($tool_prefix);

	$Q_prefix = $prefix;
	$result = compact('Q_prefix');
}
