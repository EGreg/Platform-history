<?php

function Q_before_Q_tool_render($params, &$result)
{
	static $prefix_was_rendered = array();
	static $temp_id = 0;
	
	$tool_name = $params['tool_name'];
	$Q_options = $params['Q_options'];
	$prefix = implode('_', explode('/', $tool_name)) . '_';
	if (is_string($Q_options)) {
		$id = $Q_options;
		$Q_options = array();
	} else {
		$id = isset($Q_options['id']) ? $Q_options['id'] : '';
	}
	if (!empty($id)) {
		$prefix = '_'.$id.'_'.$prefix;
	}
	
	$cur_prefix = isset($Q_options['prefix']) ? $Q_options['prefix'] : Q_Html::getIdPrefix();
	$tool_prefix = $cur_prefix . $prefix;

	if (isset($prefix_was_rendered[$tool_prefix])) {
		trigger_error("A tool with prefix \"$tool_prefix\" was already rendered.", E_USER_NOTICE);
	}
	$prefix_was_rendered[$tool_prefix] = true;
	$prev_prefix = Q_Html::pushIdPrefix($tool_prefix);

	$Q_prefix = $prefix;
	$result = compact('Q_prefix');
}
