<?php

/**
 * @module Streams-tools
 */
	
/**
 * Generates a form with inputs that modify various streams
 * @class Streams form
 * @constructor
 * @param {array} $options
 *  An associative array of parameters, containing:
 * @param {array} [$options.fields] an associative array of $id => $fieldinfo pairs,
 *   where $id is the id to append to the tool's id, to generate the input's id,
 *   and fieldinfo is either an associative array with the following fields,
 *   or a regular array consisting of fields in the following order:
 *     "publisherId" => Required. The id of the user publishing the stream
 *     "streamName" => Required. The name of the stream
 *     "field" => The stream field to edit, or "attribute:$attributeName" for an attribute.
 *     "type" => The type of the input (@see Q_Html::smartTag())
 *     "attributes" => Additional attributes for the input
 *     "value" => The initial value of the input
 *     "options" => options for the input (if type is "select", "checkboxes" or "radios")
 */
function Streams_form_tool($options)
{
	$fields = Q::ifset($options, 'fields', array());
	$defaults = array(
		'publisherId' => null,
		'steramName' => null,
		'field' => null,
		'type' => 'text',
		'attributes' => array(),
		'value' => null,
		'options' => array(),
		'params' => array()
	);
	$sections = array();
	$hidden = array();
	foreach ($fields as $id => $field) {
		if (Q::isAssociative($field)) {
			$r = Q::take($field, $defaults);
		} else {
			$c = count($field);
			if ($c < 4) {
				throw new Q_Exception("Streams/form tool: field needs at least 4 values");
			}
			$r = array(
				'publisherId' => $field[0],
				'streamName' => $field[1],
				'field' => $field[2],
				'type' => $field[3],
				'attributes' => isset($field[4]) ? $field[4] : array(),
				'value' => isset($field[5]) ? $field[5] : null,
				'options' => isset($field[6]) ? $field[6] : null,
				'params' => isset($field[7]) ? $field[7] : null,
			);
		}
		$r['attributes']['name'] = "input-$id";
		if (!isset($r['type'])) {
			var_dump($r['type']);exit;
		}
		$sections[] = Q_Html::smartTag(
			$r['type'], $r['attributes'], $r['value'], $r['options'], $r['params']
		);
		$hidden[$id] = array($r['publisherId'], $r['streamName'], $r['field']);
	}
	$sections[] = Q_Html::hidden(array(
		'inputs' => json_encode($hidden)
	));
	return implode('', $sections);
	//
	// $fields = array('onSubmit', 'onResponse', 'onSuccess', 'slotsToRequest', 'loader', 'contentElements');
	// Q_Response::setToolOptions(Q::take($options, $fields));
	// Q_Response::addScript('plugins/Q/js/tools/form.js');
	// Q_Response::addStylesheet('plugins/Q/css/form.css');
	// return $result;
}
