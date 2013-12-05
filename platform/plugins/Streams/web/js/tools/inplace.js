(function ($, window, document, undefined) {

Q.Tool.define("Streams/inplace", function (options) {
	var tool = this, 
		$te = $(tool.element), 
		container = $('.Q_inplace_tool_container', $te);
	
	// if activated with JS should have following options:
	//  - stream: a Streams.Stream object that was already constructed
	//  - publisherId, streamName: alternative to stream
	//  - field: the name of the field to bind to, defaults to "content"
	//  - attribute: alternatively, the name of an attribute to bind to

	function _construct(err) {
		if (err) {
			console.warn(err);
			return;
		}
		var stream = this, state = tool.state;
		state.publisherId = stream.fields.publisherId;
		state.streamName = stream.fields.name;

		function _setContent(content) {
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
		
		if (container.length) {
			return;
		}

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
		
		if (!stream.testWriteLevel('suggest')) {
			tool.element.innerHTML = ipo.staticHtml;
			return; // leave the html that is currently in the element
		}
		
		var inplace = Q.Tool.element('div', 'Q/inplace', ipo);
		Q.activate(tool.element.appendChild(inplace), function () {
			var inplace = tool.child('Q/inplace');
			if (!inplace) {
				return;
			}
			inplace.state.onSave.set(function () {
				Q.Streams.Message.wait(
					state.publisherId,
					state.streamName,
					-1,
					function () {
						state.onUpdate.handle.call(tool);
					}
				);
			}, 'Streams/inplace');
		});
	}

	if (tool.state.stream) {
		_construct.apply(tool.state.stream);
	} else {
		if (!tool.state.publisherId || !tool.state.streamName) {
			throw "Streams/inplace tool: stream is undefined";
		}
		Q.Streams.get(tool.state.publisherId, tool.state.streamName, _construct);
	}
},

{
	inplaceType: 'textarea',
	onUpdate: new Q.Event()
}

);

})(jQuery, window, document);
