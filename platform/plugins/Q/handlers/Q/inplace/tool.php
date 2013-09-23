<?php

/**
 * This tool generates an inline editor, along with a form tag.
 * @param array $options
 *  An associative array of parameters, containing:
 *  "field_input" => Required. HTML representing a text input, textarea, or select.
 *  "static_html" => Required. The static HTML to display when the input isn't showing.
 *  "field_type" => Required. The type of the field_input. Can be "textarea", "text" or "select"
 *  "action" => Defaults to "". The uri or url to submit to
 *  "method" => Defaults to "put". The method to use for submitting the form.
 *  "editing" => If true, then renders the inplace tool in editing mode.
 *  "editOnClick" => Defaults to true. If true, then edit mode starts only if "Edit" button is clicked.
 *  "selectOnEdit" => Defaults to true. If true, selects all the text when entering edit mode.
 *  "beforeSave" => Optional, reference to a callback to call after a successful save.
 *     This callback can cancel the save by returning false.
 *  "onSave" => Optional, reference to a callback or event to run after a successful save.
 *  "onCancel" => Optional, reference to a callback or event to run after cancel.
 */
function Q_inplace_tool($options)
{
	$action = '';
	$method = 'put';
	$field_input = '';
	$static_html = '';
	$field_type = 'textarea';
	$editOnClick = true;
	$selectOnEdit = true;
	extract($options);
	$static_class = ($field_type === 'textarea')
		? 'Q_inplace_tool_blockstatic'
		: 'Q_inplace_tool_static';
	Q_Response::addScript('plugins/Q/js/tools/inplace.js');

	$form_tag = Q_Html::form($action, $method, array('class' => 'Q_inplace_tool_form'));

	$classes = !empty($editing) ? 'Q_editing Q_nocancel' : '';
	$options = compact('editOnClick', 'selectOnEdit', 'beforeSave', 'onSave');
	Q_Response::setToolOptions($options);

return <<<EOT
<div class='Q_inplace_tool_container $classes' style="position: relative;">
	<div class='Q_inplace_tool_editbuttons'>
		<button class='Q_inplace_tool_edit basic16 basic16_edit'>Edit</button>
	</div>
	<div class='$static_class'>
		$static_html
	</div>
	$form_tag
		$field_input
		<div class='Q_inplace_tool_buttons'>
			<button class='Q_inplace_tool_save basic16 basic16_save'>Save</button>
			<button class='Q_inplace_tool_cancel basic16 basic16_cancel'>Cancel</button>
		</div>
	</form>
</div>

EOT;
}
