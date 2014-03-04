<?php

function Q_after_Q_tool_render($params, &$result)
{	
	$info = $params['info'];
	$extra = $params['extra'];
	if (!is_array($extra)) {
		$extra = array();
	}

	$id_prefix = Q_Html::getIdPrefix();
	$tool_ids = Q_Html::getToolIds();

	if (!empty($extra['inner'])) {
		Q_Html::popIdPrefix();
		return;
	}
	
	$tag = !empty($extra['tag']) ? $extra['tag'] : 'div';
	$classes = '';
	$data_options = '';
	$count = count($info);
	foreach ($info as $name => $opt) {
		$classes = ($classes ? "$classes " : $classes)
				. implode('_', explode('/', $name)) . '_tool';
		$options = Q_Response::getToolOptions($name);
		if (isset($options)) {
			$friendly_options = str_replace(
				array('&quot;', '\/'),
				array('"', '/'),
				Q_Html::text(Q::json_encode($options))
			);
		} else {
			$friendly_options = '';
		}
		$normalized = Q_Utils::normalize($name, '-');
		if (isset($options) or $count > 1) {
			$id = $tool_ids[$name];
			$id_string = ($count > 1) ? "$id " : '';
			$data_options .= " data-$normalized='$id_string$friendly_options'";
		}
		$names[] = $name;
	}
	if (isset($extra['classes'])) {
		$classes .= ' ' . $extra['classes'];
	}
	$data_cache = isset($extra['cache']) || Q_Response::shouldCacheTool($id_prefix)
		? " data-Q-cache='document'"
		: '';
	$names = ($count === 1) ? ' '.key($info) : 's '.implode(" ", $names);
	$result = "<!--\n\nbegin tool$names\n\n-->"
	 . "<$tag id='{$id_prefix}tool' class='Q_tool $classes'$data_options$data_cache>"
	 . $result 
	 . "</div><!--\n\nend tool$names \n\n-->";
	
	Q_Html::popIdPrefix();
}
