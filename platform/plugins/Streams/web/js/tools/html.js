/*
 * Streams/html tool.
 * @param options Object
 * A hash of options, which can include:
 *   "editable": Set to false to avoid showing even authorized users an interface to replace the contents
 *   "ckeditor": The config, if any, to pass to ckeditor
 *   "publisherId": Required. The publisher's user id.
 *   "streamName": If empty, and "creatable" is true, then this can be used to add new related streams.
 *   "field": Required. The name of the stream field used to save the html.
 *   "placeholder": The placeholder HTML
 *   "preprocess": Optional function which takes [callback, tool] and calls callback(objectToExtendAnyStreamFields) 
 */

(function ($, window, document, undefined) {

Q.Tool.define("Streams/html", function (options) {
	var tool = this,
		state = tool.state;

	if (!tool.state.publisherId) {
		throw "Streams/html tool: missing options.publisherId";
	}
	if (!tool.state.field) {
		throw "Streams/html tool: missing options.field";
	}

	if (state.streamName) {
		Q.Streams.get(state.publisherId, state.streamName, function (err1, err2) {
			if (Q.firstErrorMessage(err1, err2)) return false;
			state.stream = this;
			tool.element.innerHTML = this.fields[state.field];
			_proceed();
		});
	} else if (state.placeholder) {
		tool.element.innerHTML = state.placeholder;
		_proceed();
	}

	function _proceed() {
		Q.addScript("plugins/Q/js/ckeditor/ckeditor.js", function () {
			CKEDITOR.disableAutoInline = true;
			tool.element.setAttribute('contenteditable', true);
			var editor = CKEDITOR.inline(tool.element, state.ckeditor || undefined);
			editor.on('blur', function () {
				state.editing = false;
				if (state.stream) {
					state.stream.pendingFields[state.field] = editor.getData();
					state.stream.save(function (err) {
						if (Q.firstErrorMessage(err)) {
							return state.onCancel.handle(err);
						}
						state.onSave.handle.call(this);
					});
				}
			});
			editor.on('focus', function () {
				state.editing = true;
			});
			if (state.stream) {
				state.stream.onFieldChanged(state.field).set(function (fields, field) {
					tool.element.innerHTML = fields[field];
				}, tool);
			}
		});
	}
	
	function _create(overrides) {

		var fields = Q.extend({
			publisherId: state.publisherId,
			type: state.creatable.streamType
		}, overrides);
		Q.Streams.retainWith(tool).create(fields, function (err, stream, icon) {
			if (err) {
				return err;
			}
			state.publisherId = this.fields.publisherId;
			state.streamName = this.fields.name;
			tool.stream = this;
			state.onCreate.handle.call(tool);
			tool.stream.refresh(function () {
				state.onUpdate.handle.call(tool);
			}, {messages: true});
		}, state.related);
	}
	
	function onSave() {
		if (state.creatable && state.creatable.preprocess) {
			Q.handle(state.creatable.preprocess, this, [_proceed, tool, evt]);
		} else {
			_proceed();
		}
		return false;
	}
},

{
	editable: true,
	ckeditor: null,
	streamName: "",
	placeholder: "Enter content here",
	preprocess: null,
	onSave: new Q.Event(),
	onCancel: new Q.Event()
}

);

})(jQuery, window, document);
