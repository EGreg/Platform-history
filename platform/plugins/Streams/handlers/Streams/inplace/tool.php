<?php

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @param array $options
 *  An associative array of parameters, containing:
 *  "inplaceType" => Required. The type of the fieldInput. Can be "textarea" or "text"
 *  "stream" => A Streams_Stream object
 *  "staticHtml" => Optional. The static HTML to display when there is nothing to edit
 *  "editing" => If true, then renders the inplace tool in editing mode.
 *  "attribute" => Optional, name of an attribute to change instead of the content of the stream
 *  "editOnClick" => Defaults to true. If true, then edit mode starts only if "Edit" button is clicked.
 *  "selectOnEdit" => Defaults to true. If true, selects all the text when entering edit mode.
 *  "beforeSave" => Optional, reference to a callback to call after a successful save.
 *     This callback can cancel the save by returning false.
 *  "onSave" => Optional, reference to a callback or event to run after a successful save.
 *  "onCancel" => Optional, reference to a callback or event to run after cancel.
 *  "inplace" => Additional fields to pass to the child Q/inplace tool, if any
 */
function Streams_inplace_tool($options)
{
	$stream = $options['stream'];
	if (empty($stream)) {
		throw new Q_Exception_RequiredField(array('field' => 'stream'));
	}
	$toolOptions = array(
		'publisherId' => $stream->publisherId,
		'streamName' => $stream->name,
		'inplaceType' => $options['inplaceType']
	);
	Q::take($options, 'inplace', $toolOptions);
	Q_Response::setToolOptions($toolOptions);
	$options['action'] = $stream->actionUrl();
	$options['method'] = 'PUT';
	$options['type'] = $options['inplaceType'];
	$field = empty($attribute) ? 'content' : 'attributes['.urlencode($attribute).']';
	switch ($options['inplaceType']) {
		case 'text':
			$options['fieldInput'] = Q_Html::input($field, $stream->content);
			$options['staticHtml'] = Q_Html::text($stream->content);
			break;
		case 'textarea':
			$options['fieldInput'] = Q_Html::textarea($field, 5, 80, $stream->content);
			$options['staticHtml'] = Q_Html::text($stream->content, array("\n"));
			break;
		default:
			return "inplaceType must be 'textarea' or 'text'";
	}
	if (!$stream->testWriteLevel('suggest')) {
		if (!isset($options['classes'])) {
			$options['classes'] = '';
		}
		return "<span class='Q_inplace_tool_container $options[classes]' style='position: relative;'>$options[staticHtml]</span>";
	}
	return Q::tool("Q/inplace", $options);
}
