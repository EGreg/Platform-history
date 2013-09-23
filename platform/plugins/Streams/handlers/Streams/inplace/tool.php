<?php

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @param array $options
 *  An associative array of parameters, containing:
 *  "field_type" => Required. The type of the field_input. Can be "textarea" or "text"
 *  "stream" => A Streams_Stream object
 *  "editing" => If true, then renders the inplace tool in editing mode.
 *  "editOnClick" => Defaults to true. If true, then edit mode starts only if "Edit" button is clicked.
 *  "selectOnEdit" => Defaults to true. If true, selects all the text when entering edit mode.
 *  "beforeSave" => Optional, reference to a callback to call after a successful save.
 *     This callback can cancel the save by returning false.
 *  "onSave" => Optional, reference to a callback or event to run after a successful save.
 *  "onCancel" => Optional, reference to a callback or event to run after cancel.
 */
function Streams_inplace_tool($options)
{
	extract($options);
	$options['action'] = $stream->actionUrl();
	$options['method'] = 'put';
	if (!empty($attribute)) {
		$field = 'attributes['.urlencode($attribute).']';
	}
	$field = 'content';
	switch ($field_type) {
		case 'text':
			$options['field_input'] = Q_Html::input($field, $stream->content);
			$options['static_html'] = Q_Html::text($stream->content);
			break;
		case 'textarea':
			$options['field_input'] = Q_Html::textarea($field, 5, 80, $stream->content);
			$options['static_html'] = Q_Html::text($stream->content, array("\n"));
			break;
		default:
			return "field_type must be 'textarea' or 'text'";
			break;
	}
	if (!$stream->testWriteLevel('editPending')) {
		return $options['static_html'];
	}
	return Q::tool("Q/inplace", $options, Q_Utils::normalize($stream->publisherId.'_'.$stream->name));
}
