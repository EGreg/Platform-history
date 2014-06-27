<?php

/**
 * @param array $options
 *  The parameters to pass to the tool. They include:
 *  "tabs" => An associative array of name => title pairs.
 *  "urls" => An associative array of name => url pairs to override the default urls.
 *  "classes" => An associative array of the form name => classes, for adding classes to tabs
 *  "titleClasses" => An associative array for adding classes to tab titles
 *  "field" => Defaults to "tab". Uses this field when urls doesn't contain the tab name.
 *  "selector" => CSS style selector indicating the element to update with javascript. Can be a parent of the tabs. Set to null to reload the page.
 *    (if multiple slots defined parameter is required and shall be array of the same length as slot)
 *  "slot" => The name of the slot to request when changing tabs with javascript.
 *    (may be array to update multiple slots)
 *  "defaultTab" => Here you can specify the name of the tab to show by default
 *  "after" => Name of an event that will return HTML to place after the generated HTML in the tabs tool element
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
	$slot = 'content,title,notices';
	$selector = '#content_slot';
	$urls = array();
	$defaultTab = null;
	$beforeSwitch = null; 
	$beforeScripts = null;
	$onActivate = null;
	extract($options);
	if (!isset($tabs)) {
		return '';
	}
	/**
	 * @var array $tabs
	 */
	$sel = isset($_REQUEST[$field]) ? $_REQUEST[$field] : $defaultTab;
	$result = '';
	$i = 0;
	foreach ($tabs as $name => $title) {
		if (isset($urls[$name])) {
			$urls[$name] = Q_Uri::url($urls[$name]);
		} else {
			$urls[$name] = Q_Uri::url(Q_Request::url(array(
				$field => $name, 
				"/Q\.(.*)/" => null
			)));
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
		$titleClasses_string = '';
		if (isset($titleClasses[$name])) {
			if (is_string($titleClasses[$name])) {
				$titleClasses_string = $titleClasses[$name];
			} else if (is_array($titleClasses[$name])) {
				$titleClasses_string = implode(' ', $titleClasses[$name]);
			}
		}
		$title_container = Q_Html::div(
			null, 
			'Q_tabs_title', 
			array('class' => $titleClasses_string), 
			isset($title) ? $title : $name
		);
		$result .= Q_Html::tag('li', array(
			'id' => 'tab_'.++$i,
			'class' => 'Q_tabs_tab '.$classes_string.$selected_class, 
			'data-name' => $name
		), Q_Html::a(
			$urls[$name],
			$title_container
		));
	}
	Q_Response::setToolOptions(compact(
		'selector', 'slot', 'tabs', 'urls', 'field', 'loader', 'beforeSwitch', 'beforeScripts', 'onActivate'
	));
	Q_Response::addScript('plugins/Q/js/tools/tabs.js');
	$after = isset($options['after']) ? Q::event($options['after'], $options) : '';
	return "<div class='Q_tabs_tabs Q_clearfix'>$result$after</div>";
}
