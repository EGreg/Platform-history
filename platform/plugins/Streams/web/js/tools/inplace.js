(function ($, window, document, undefined) {

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
			tool.stream = this;
		});

		function _setContent(content) {
			Q.Streams.get(state.publisherId, state.streamName, function () {
				tool.stream = this;
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
			var ipo = state.inplace = Q.extend(state.inplace, {
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
						'&lt;br&gt;': "\n",
						'&lt;br /&gt;': "\n",
						'&nbsp;': ' '
					});
					break;
				default:
					throw "Streams/inplace tool: inplaceType must be 'textarea' or 'text'";
			}

			if (state.editable === false || !stream.testWriteLevel('suggest')) {
				tool.element.innerHTML = ipo.staticHtml;
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
				tool.stream.refresh(function () {
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
