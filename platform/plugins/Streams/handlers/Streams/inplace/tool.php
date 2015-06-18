<?php

/**
 * @module Streams-tools
 */

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @class Streams inplace
 * @constructor
 * @param {array} $options Options for the tool
 *  An associative array of parameters, containing:
 * @param {string} $options.inplaceType The type of the fieldInput. Can be "textarea" or "text"
 * @param {array} [$options.convert] The characters to convert to HTML. Pass an array containing zero or more of "\n", " "
 * @param {Streams_Stream} $options.stream A Streams_Stream object
 * @param {boolean} [$options.editing] If true, then renders the inplace tool in editing mode.
 * @param {string} [$options.field] Optional, name of an field to change instead of the content of the stream
 * @param {string} [$options.attribute] Optional, name of an attribute to change instead of any field.
 * @param {string} [$options.beforeSave] Reference to a callback to call after a successful save. This callback can cancel the save by returning false.
 * @param {string} [$options.onSave] Reference to a callback or event to run after a successful save.
 * @param {string} [$options.onCancel] Reference to a callback or event to run after cancel.
 * @param {array} [$options.inplace=array()] Additional fields to pass to the child Q/inplace tool, if any
 */
function Streams_inplace_tool($options)
{
	$stream = $options['stream'];
	if (empty($stream)) {
		throw new Q_Exception_RequiredField(array('field' => 'stream'));
	}
	$inplace = array(
		'action' => $stream->actionUrl(),
		'method' => 'PUT',
		'type' => $options['inplaceType']
	);
	if (isset($options['inplace'])) {
		$inplace = array_merge($options['inplace'], $inplace);
	}
	if (!empty($options['attribute'])) {
		$field = 'attributes['.urlencode($options['attribute']).']';
	} else {
		$field = !empty($options['field']) ? $options['field'] : 'content';
	}
	$convert = Q::ifset($options, 'convert', array("\n"));
	switch ($options['inplaceType']) {
		case 'text':
			$inplace['fieldInput'] = Q_Html::input($field, $stream->content);
			$inplace['staticHtml'] = Q_Html::text($stream->content);
			break;
		case 'textarea':
			$inplace['fieldInput'] = Q_Html::textarea($field, 5, 80, $stream->content);
			$inplace['staticHtml'] = Q_Html::text($stream->content, $convert);
			break;
		default:
			return "inplaceType must be 'textarea' or 'text'";
	}
	if (!$stream->testWriteLevel('suggest')) {
		if (!isset($options['classes'])) {
			$options['classes'] = '';
		}
		$staticClass = ($options['inplaceType'] === 'textarea')
			? 'Q_inplace_tool_blockstatic'
			: 'Q_inplace_tool_static';
		return "<span class='Q_inplace_tool_container $options[classes]' style='position: relative;'>"
			. "<div class='$staticClass'>$inplace[staticHtml]</div></span>";
	}
	$toolOptions = array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'inplaceType' => $options['inplaceType']
	);
	Q::take($options, array('attribute', 'field'), $toolOptions);
	$toolOptions['inplace'] = $inplace;
	Q_Response::setToolOptions($toolOptions);
	return Q::tool("Q/inplace", $inplace);
}
