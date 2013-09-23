<?php

function SmartApp_listing_tool($options)
{
	$result = Q_Html::tag('ul', array('class' => 'Q_listing'));
	foreach ($options['items'] as $action => $item) {
		$result .= Q_Html::tag('li', array('data-action' => Q_Uri::url($action)), $item);
	}
	return $result . "</ul>";
}