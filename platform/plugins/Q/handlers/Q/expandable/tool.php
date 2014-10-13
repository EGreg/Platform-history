<?php

/**
 * This tool implements expandable containers that work on most modern browsers,
 * including ones on touchscreens.
 *
 * @param array $options
 * An associative array of options, containing:
 *   "title" => Required. The title for the expandable.
 *   "content" => The content. Required unless you pass "items" instead.
 *   "items" => An array of strings to wrap in <span> elements and render in the content
 *   "class" => If you use "items", optionally specify the class of the container elements for each item
 *   "count" => A number, if any, to display when collapsed
 *   "autoCollapseSiblings" =>  Whether, when expanding an expandable, its siblings should be automatically collapsed.
 */
function Q_expandable_tool($options)
{
	if (isset($options['items'])) {
		$classString = isset($options['class'])
			? "class='$options[class]'"
			: '';
		$lines = array();
		foreach ($options['items'] as $key => $value) {
			$lines[] = "<span $classString>$key</span>";
		}
		$between = Q::ifset($options, 'between', '');
		$options['content'] = implode($between, $lines);
	}
	foreach (array('title', 'content') as $field) {
		if (!isset($options[$field])) {
			throw new Q_Exception_RequiredField(compact('field'));
		}
	}
	$count = Q::ifset($options, 'count', '');
	$h2 = "<h2>\n\t<span class='Q_expandable_count'>$count</span>\n\t$options[title]\n</h2>";
	$div = "<div class='Q_expandable_content'>\n\t$options[content]\n</div>";
	return $h2.$div;
}