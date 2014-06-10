(function (Q, $, window, document, undefined) {

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @param {Array} options An associative array, containing:
 *  "inplaceType": Required. The type of the fieldInput. Can be "textarea" or "text"
 *  "publisherId": Required if stream option is empty. The publisher's user id.
 *  "streamName": Required if stream option is empty. The name of the stream.
 *  "stream": Optionally pass a Streams.Stream object here if you have it already
 *  "field": Optional, name of an field to change instead of the content of the stream
 *  "attribute": Optional, name of an attribute to change instead of any field.
 *  "inplace": Additional fields to pass to the child Q/inplace tool, if any
 *  "create": Optional. You can pass a function here, which takes the tool as "this"
 *     and a callback as the first parameter, is supposed to create a stream and
 *     call the callback with (err, stream). If omitted, then the tool doesn't render.
 */
Q.Tool.define("Streams/inplace", function (options) {
	var tool = this,
		state = tool.state, 
		$te = $(tool.element), 
		container = $('.Q_inplace_tool_container', $te);
	
	// if activated with JS should have following options:
	//  - stream: a Streams.Stream object that was already constructed
	//  - publisherId, streamName: alternative to stream
	//  - field: the name of the field to bind to, defaults to "content"
	//  - attribute: alternatively, the name of an attribute to bind to

	function _construct(err) {
		if (err) {
			return tool.state.onError.handle(err);
		}
		var stream = state.stream = this;
		state.publisherId = stream.fields.publisherId;
		state.streamName = stream.fields.name;

		function _setContent(content) {
			Q.Streams.get(state.publisherId, state.streamName, function () {
				state.stream = this;
			});
			var html = content.encodeHTML()
				|| '<span class="Q_placeholder">'+tool.child('Q/inplace').state.placeholder.encodeHTML()+'</div>'
				|| '';
			switch (state.inplaceType) {
				case 'text':
					tool.$('input[type!=hidden]').val(content);
					tool.$('.Q_inplace_tool_static').html(html);
					break;
				case 'textarea':
					tool.$('textarea').val(content);
					tool.$('.Q_inplace_tool_blockstatic').html(html.replaceAll({
						"\n": '<br>',
					 	' ': '&nbsp;'
					}));
					break;
				default:
					throw new Q.Error("Streams/inplace tool: inplaceType must be 'textarea' or 'text'");
			}
		};

		var field;
		if (state.attribute) {
			field = 'attributes['+encodeURIComponent(state.attribute)+']';
			stream.onUpdated(state.attribute).set(function (attributes, k) {
				_setContent(attributes[k]);
			}, tool);
		} else {
			field = state.field || 'content';
			stream.onFieldChanged(field).set(function (fields, k) {
				_setContent(fields[k]);
			}, tool);
		}
		
		if (!container.length) {
			// dynamically construct the tool
			var ipo = Q.extend(state.inplace, {
				action: stream.actionUrl(),
				method: 'put',
				field: field,
				type: state.inplaceType
			});
			var value = (state.attribute ? stream.get(state.attribute) : stream.fields[field]) || "";
			switch (state.inplaceType) {
				case 'text':
					ipo.fieldInput = $('<input />').attr('name', field).val(value);
					ipo.staticHtml = value.encodeHTML();
					break;
				case 'textarea':
					ipo.fieldInput = $('<textarea rows="5" cols="80" />').attr('name', field).text(value);
					ipo.staticHtml = value.encodeHTML().replaceAll({
						'&lt;br&gt;': "<br>",
						'&lt;br /&gt;': "<br>",
						'&nbsp;': ' '
					});
					break;
				default:
					throw new Q.Error("Streams/inplace tool: inplaceType must be 'textarea' or 'text'");
			}

			if (state.editable === false || !stream.testWriteLevel('suggest')) {
				var span = document.createElement('span');
				span.setAttribute('class', 'Q_inplace_tool_container');
				var div = document.createElement('div');
				var staticClass = options.inplaceType === 'textarea'
					? 'Q_inplace_tool_blockstatic'
					: 'Q_inplace_tool_static';
				div.setAttribute('class', staticClass);
				div.innerHTML = ipo.staticHtml;
				span.appendChild(div);
				tool.element.appendChild(span);
				return; // leave the html that is currently in the element
			}

			var inplace = tool.setUpElement('div', 'Q/inplace', ipo);
			tool.element.appendChild(inplace);
		}
		
		// Wire up the events
		Q.activate(tool.element, function () {
			var inplace = tool.child('Q/inplace');
			if (!inplace) {
				return;
			}
			inplace.state.onSave.set(function () {
				state.stream.refresh(function () {
					state.onUpdate.handle.call(tool);
				}, {messages: true});
			}, 'Streams/inplace');
		});
	}

	if (state.stream) {
		state.publisherId = state.stream.publisherId;
		state.streamName = state.stream.name;
	}
	if (!state.publisherId || !state.streamName) {
		throw new Q.Error("Streams/inplace tool: stream is undefined");
	}
	Q.Streams.retainWith(tool).get(state.publisherId, state.streamName, _construct);
},

{
	inplaceType: 'textarea',
	editable: true,
	create: null,
	inplace: {},
	onUpdate: new Q.Event(),
	onError: new Q.Event(function (err) {
		var msg = Q.firstErrorMessage(err);
		console.warn("Streams/inplace: ", msg);
	}, "Streams/inplace")
}

);

})(Q, jQuery, window, document);
