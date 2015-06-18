(function (Q, $, window, document, undefined) {

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
Q.Tool.define("Streams/form", function (options) {
	var tool = this;
	var state = tool.state;

},

{

}

);

})(Q, jQuery, window, document);