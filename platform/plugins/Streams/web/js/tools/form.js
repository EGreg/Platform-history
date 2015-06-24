(function (Q, $, window, document, undefined) {

/**
 * @module Streams-tools
 */
	
/**
 * Generates a form with inputs that modify various streams
 * @class Streams form
 * @constructor
 * @param {array} options
 *  An associative array of parameters, containing:
 * @param {array} [options.fields] an associative array of {id: fieldinfo} pairs,
 *   where id is the id to append to the tool's id, to generate the input's id,
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
Q.Tool.define("Streams/form", function (options) {
	var tool = this;
	var state = tool.state;

	var $inputs = tool.$('input, select').not('[type="hidden"]');
	var $hidden = tool.$('input[name=inputs]');
	$inputs.on('change', function () {
		var $this = $(this);
		var $parent = $this.parent();
		if ($parent.attr('data-type') === 'date') {
			var notReady = false;
			$parent.find('select').each(function () {
				var value = $(this).val();
				if (!value || value == '0') {
					notReady = true;
					return false;
				}
			});
			if (notReady) {
				return;
			}
		}
		var params = {};
		$parent.find($inputs).each(function () {
			var $this = $(this);
			params[$this.attr('name')] = $this.val();
		});
		params.inputs = $hidden.val();
		Q.req('Streams/form', function () {
			debugger;
		}, {method: 'post', fields: params});
	});

},

{
	
}

);

})(Q, jQuery, window, document);