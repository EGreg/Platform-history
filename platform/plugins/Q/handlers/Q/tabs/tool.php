<?php

/**
 * @param array $options
 *  The parameters to pass to the tool. They include:
 *  "tabs" => An associative array of name => title pairs.
 *  "urls" => An associative array of name => url pairs to override the default urls.
 *  "classes" => An associative array of the form name => classes, for adding classes to tabs
 *  "title_classes" => An associative array for adding classes to tab titles
 *  "field" => Defaults to "tab". Uses this field in the absence of javascript.
 *  "selector" => CSS style selector indicating the element to update with javascript. Can be a parent of the tabs. Set to null to reload the page.
 *    (if multiple slots defined parameter is required and shall be array of the same length as slot)
 *  "slot" => The name of the slot to request when changing tabs with javascript.
 *    (may be array to update multiple slots)
 *  "default_tab" => Here you can specify the name of the tab to show by default
 *  "loader" => Optional. Name of function which takes url, slot, callback. It should call the callback and 
 *    pass it an object with the response info. Can be used to implement caching, etc. instead of the default 
 *    HTTP request.
 *    If "loader" is Q.getter and request shall be done bypasing cache, assign true to .noCache property of the tool
 *  "beforeSwitch" => Optional. Name of the function to execute before tab switching begins.
 *  "beforeScripts" => Optional. Name of the function to execute after tab is loaded but before its javascript is executed.
 *  "onActivate" => Optional. Name of the function to execute after a tab is activated.
 */
function Q_tabs_tool($options)
{
	$field = 'tab';
	$slot = 'content';
	$selector = '#content_slot';
	$urls = array();
	$default_tab = null;
	$beforeSwitch = null; 
	$beforeScripts = null;
	$onActivate = null;
	extract($options);
	$sel = isset($_REQUEST[$field]) ? $_REQUEST[$field] : $default_tab;
	$result = '';
	$i = 0;
	foreach ($tabs as $name => $title) {
		if (isset($urls[$name])) {
			$urls[$name] = Q_Uri::url($urls[$name]);
		} else {
			$urls[$name] = Q_Uri::url(Q_Request::url(array($field => $name)));
		}
		$selected_class = '';
		$uri_string = (string)Q_Dispatcher::uri();
		if ($sel == $name
		or $urls[$name] === Q_Request::url()
		or $urls[$name] === $uri_string
		or $name === $uri_string) {
			$selected_class = " Q_selected";
		}
		$classes_string = '';
		if (isset($classes[$name])) {
			if (is_string($classes[$name])) {
				$classes_string = $classes[$name];
			} else if (is_array($classes[$name])) {
				$classes_string = implode(' ', $classes[$name]);
			}
		}
		$title_classes_string = '';
		if (isset($title_classes[$name])) {
			if (is_string($title_classes[$name])) {
				$title_classes_string = $title_classes[$name];
			} else if (is_array($title_classes[$name])) {
				$title_classes_string = implode(' ', $title_classes[$name]);
			}
		}
		$title_container = Q_Html::div(
			null, 
			'Q_tabs_title', 
			array('class' => $title_classes_string), 
			isset($title) ? $title : $name
		);
		$result .= Q_Html::a(
			$urls[$name],
			array(
				'id' => 'tab_'.++$i,
				'class' => 'Q_tabs_tab '.$classes_string.$selected_class, 
				'data-name' => $name
			),
			$title_container
		);
	}
	Q_Response::setToolOptions(compact(
		'selector', 'slot', 'tabs', 'urls', 'loader', 'beforeSwitch', 'beforeScripts', 'onActivate'
	));
	Q_Response::addScript('plugins/Q/js/tools/tabs.js');
	return "<div class='Q_tabs_tabs Q_clearfix'>$result</div>";
}
