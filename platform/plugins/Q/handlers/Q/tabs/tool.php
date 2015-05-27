<?php

/**
 * @param {Object} [options] Options to pass to the tool
 *  @param {Array} [options.tabs] An associative array of name: title pairs.
 *  @param {Array} [options.urls] An associative array of name: url pairs to override the default urls.
 *  @param {String} [options.field='tab'] Uses this field when urls doesn't contain the tab name.
 *  @param {Boolean} [options.vertical=false] Stack the tabs vertically instead of horizontally
 *  @param {Boolean} [options.compact=false] Display the tabs interface in a compact space with a contextual menu
 *  @param {String} [options.overflow] Override the text that is displayed when the tabs overflow. You can interpolate {{count}}, {{text}} or {{html}} in the string. 
 *  @param {String} [options.overflowGlyph] Override the glyph that appears next to the overflow text. You can interpolate {{count}} here
 *  @param {String} [options.defaultTab] Here you can specify the name of the tab to show by default
 *  @param {String} [options.selectors] Array of (slotName => selector) pairs, where the values are CSS style selectors indicating the element to update with javascript, and can be a parent of the tabs. Set to null to reload the page.
 *  @param {String} [options.slot] The name of the slot to request when changing tabs with javascript.
 *  @param {String} [options.classes] An associative array of the form name => classes, for adding classes to tabs
 *  @param {String} [options.titleClasses]  An associative array for adding classes to tab titles
 *  @param {String} [options.after] Name of an event that will return HTML to place after the generated HTML in the tabs tool element
 *  @param {Function} [options.loader] Name of a function which takes url, slot, callback. It should call the callback and pass it an object with the response info. Can be used to implement caching, etc. instead of the default HTTP request. This function shall be Q.batcher getter
 *  @param {Q.Event} [options.onClick] Event when a tab was clicked, with arguments (name, element). Returning false cancels the tab switching.
 *  @param {Q.Event} [options.beforeSwitch] Event when tab switching begins. Returning false cancels the switching.
 *  @param {Function} [options.beforeScripts] Name of the function to execute after tab is loaded but before its javascript is executed.
 *  @param {Function} [options.onCurrent] Name of the function to execute after a tab is shown to be selected.
 *  @param {Function} [options.onActivate] Name of the function to execute after a tab is activated.
 */
function Q_tabs_tool($options)
{
	$field = 'tab';
	$slot = 'content,title';
	$selectors = array('content' => '#content_slot');
	$urls = array();
	extract($options);
	if (!isset($tabs)) {
		return '';
	}
	if (!isset($defaultTab)) {
		reset($tabs);
		$defaultTab = key($tabs);
	}
	/**
	 * @var array $tabs
	 * @var boolean $vertical
	 * @var boolean $compact
	 */
	$sel = isset($_REQUEST[$field]) ? $_REQUEST[$field] : null;
	$result = '';
	$i = 0;
	$selectedName = null;
	$uri_string = (string)Q_Dispatcher::uri();
	foreach ($tabs as $name => $title) {
		if ($name === $sel
		or $name === $uri_string
		or $urls[$name] === $uri_string
		or $urls[$name] === Q_Request::url()) {
			$selectedName = $name;
			break;
		}
	}
	foreach ($tabs as $name => $title) {
		if (isset($urls[$name])) {
			$urls[$name] = Q_Uri::url($urls[$name]);
		} else {
			$urls[$name] = Q_Uri::url(Q_Request::url(array(
				$field => $name, 
				"/Q\.(.*)/" => null
			)));
		}
		$selected_class = ($name === $selectedName) ? ' Q_current' : '';
		$classes_string = " Q_tab_".Q_Utils::normalize($name);
		if (isset($classes[$name])) {
			if (is_string($classes[$name])) {
				$classes_string .= ' ' . $classes[$name];
			} else if (is_array($classes[$name])) {
				$classes_string .= ' ' . implode(' ', $classes[$name]);
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
			"Q_tabs_title $titleClasses_string",
			isset($title) ? $title : $name
		);
		$result .= Q_Html::tag('li', array(
			'id' => 'tab_'.++$i,
			'class' => "Q_tabs_tab $classes_string$selected_class", 
			'data-name' => $name
		), Q_Html::a(
			$urls[$name],
			$title_container
		));
	}
	Q_Response::setToolOptions(compact(
		'selectors', 'slot', 'urls', 'defaultTab',
		'vertical', 'compact', 'overflow', 'overflowGlyph',
		'field', 'loader', 'beforeSwitch', 'beforeScripts', 'onActivate'
	));
	Q_Response::addScript('plugins/Q/js/tools/tabs.js');
	Q_Response::addStylesheet('plugins/Q/css/tabs.css');
	$verticalClass = empty($vertical) ? '' : ' Q_tabs_vertical';
	$after = isset($options['after']) ? Q::event($options['after'], $options) : '';
	return "<div class='Q_tabs_tabs Q_clearfix$verticalClass'>$result$after</div>";
}
