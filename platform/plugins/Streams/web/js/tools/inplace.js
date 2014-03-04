(function ($, window, document, undefined) {

/**
 * This tool generates an inline editor to edit the content or attribute of a stream.
 * @param array $options
 *  An associative array of parameters, containing:
 *  "inplaceType" => Required. The type of the fieldInput. Can be "textarea" or "text"
 *  "publisherId": Required if stream option is empty. The publisher's user id.
 *  "streamName": Required if stream option is empty. The name of the stream.
 *  "stream" => Optionally pass a Streams.Stream object here if you have it already
 *  "field" => Optional, name of an field to change instead of the content of the stream
 *  "attribute" => Optional, name of an attribute to change instead of any field.
 *  "inplace" => Additional fields to pass to the child Q/inplace tool, if any
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
		var stream = this;
		state.publisherId = stream.fields.publisherId;
		state.streamName = stream.fields.name;

		Q.Streams.get(state.publisherId, state.streamName, function () {
			state.stream = this;
		});

		function _setContent(content) {
			Q.Streams.get(state.publisherId, state.streamName, function () {
				state.stream = this;
			});
			switch (state.inplaceType) {
				case 'text':
					tool.$('input').val(content);
					tool.$('.Q_inplace_tool_static').html(content.encodeHTML());
					break;
				case 'textarea':
					tool.$('textarea').val(content);
					tool.$('.Q_inplace_tool_blockstatic').html(content.encodeHTML().replaceAll({
						"\n": '<br>',
					 	' ': '&nbsp;'
					}));
					break;
				default:
					throw "Streams/inplace tool: inplaceType must be 'textarea' or 'text'";
			}
		};

		var field;
		if (state.attribute) {
			field = 'attributes['+encodeURIComponent(state.attribute)+']';
			stream.onUpdated(o.attribute).set(function (fields, changed) {
				_setContent(changed[o.attribute])
			}, tool);
		} else {
			field = state.field || 'content';
			stream.onFieldChanged(field).set(function (fields, field) {
				_setContent(fields[field]);
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
			switch (state.inplaceType) {
				case 'text':
					ipo.fieldInput = $('<input />').attr('name', field).val(stream.fields[field]);
					ipo.staticHtml = stream.fields[field].encodeHTML();
					break;
				case 'textarea':
					ipo.fieldInput = $('<textarea rows="5" cols="80" />').attr('name', field).text(stream.fields[field]);
					ipo.staticHtml = stream.fields[field].encodeHTML().replaceAll({
						'&lt;br&gt;': "<br>",
						'&lt;br /&gt;': "<br>",
						'&nbsp;': ' '
					});
					break;
				default:
					throw "Streams/inplace tool: inplaceType must be 'textarea' or 'text'";
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
		_construct.apply(state.stream);
	} else {
		if (!state.publisherId || !state.streamName) {
			throw "Streams/inplace tool: stream is undefined";
		}
		Q.Streams.retainWith(tool).get(state.publisherId, state.streamName, _construct);
	}
},

{
	inplaceType: 'textarea',
	editable: true,
	inplace: {},
	onUpdate: new Q.Event()
}

);

})(jQuery, window, document);
