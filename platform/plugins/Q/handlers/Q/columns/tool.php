<?php

/**
 * This tool contains functionality to show things in columns
 * @class Q columns
 * @constructor
 * @param {Object}   [options] Provide options for this tool
 *  @param {Object}  [options.animation] For customizing animated transitions
 *  @param {Number}  [options.animation.duration] The duration of the transition in milliseconds, defaults to 500
 *  @param {Object}  [options.animation.hide] The css properties in "hide" state of animation
 *  @param {Object}  [options.animation.show] The css properties in "show" state of animation
 *  @param {Object}  [options.back] For customizing the back button on mobile
 *  @param {String}  [options.back.src] The src of the image to use for the back button
 *  @param {Boolean} [options.back.triggerFromTitle] Whether the whole title would be a trigger for the back button. Defaults to true.
 *  @param {Boolean} [options.back.hide] Whether to hide the back button. Defaults to false, but you can pass true on android, for example.
 *  @param {Object}  [options.close] For customizing the back button on desktop and tablet
 *  @param {String}  [options.close.src] The src of the image to use for the close button
 *  @param {Object}  [options.close.clickable] If not null, enables the Q/clickable tool with options from here. Defaults to null.
 *  @param {Object}  [options.scrollbarsAutoHide] If not null, enables Q/scrollbarsAutoHide functionality with options from here. Enabled by default.
 *  @param {Boolean} [options.fullscreen] Whether to use fullscreen mode on mobile phones, using document to scroll instead of relying on possibly buggy "overflow" CSS implementation. Defaults to true on Android, false everywhere else.
 *  @param {Array}   [options.columns] In PHP only, an array of $name => $column pairs, where $column is in the form array('title' => $html, 'content' => $html, 'close' => true)
 * @return Q.Tool
 */
function Q_columns_tool($options)
{
	$jsOptions = array(
		'animation', 'back', 'close', 'scrollbarsAutoHide', 'fullscreen'
	);
	Q_Response::setToolOptions(Q::take($options, $jsOptions));
	if (!isset($options['columns'])) {
		return '';
	}
	$result = '<div class="Q_columns_container Q_clearfix">';
	$columns = array();
	$i=0;
	foreach ($options['columns'] as $name => $column) {
		$close = Q::ifset($column, 'close', $i > 0);
		$title = Q::ifset($column, 'title', '[title]');
		$column = Q::ifset($column, 'column', '[column]');
		$closeSrc = Q::ifset($column, 'close', 'src', "plugins/Q/img/x.png");
		$backSrc = Q::ifset($column, 'back', 'src', "plugins/Q/img/back-v.png");
		$Q_close = Q_Request::isMobile() ? 'Q_close' : 'Q_close Q_back';
		$closeHtml = !$close ? '' : (Q_Request::isMobile()
			? '<div class="Q_close Q_back">'.Q_Html::img($backSrc, 'Back').'</div>'
			: '<div class="Q_close">'.Q_Html::img($closeSrc, 'Close').'</div>');
		$n = Q_Html::text($name);
		$columnClass = 'Q_column_'.Q_Utils::normalize($name) . ' _Q_column_'.$i;
		$columns[] = <<<EOT
	<div class="Q_columns_column $columnClass" data-name="$n">
		<div class="Q_columns_title">
			$closeHtml
			<h2 class="title_slot">$title</h2>
		</div>
		<div class="column_slot">$column</div>
	</div>
EOT;
		++$i;
	}
	$result .= "\n" . implode("\n", $columns) . "\n</div>";
	return $result;
}