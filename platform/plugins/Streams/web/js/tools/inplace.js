(function ($, window, document, undefined) {

Q.Tool.define("Streams/inplace", function (options) {
	var tool = this, 
		$te = $(tool.element), 
		container = $('.Q_inplace_tool_container', $te);
	if (container.length) {
		return;
	}
	
	// if activated with JS should have following options:
	//  - stream: a Streams.Stream object that was already constructed
	//  - publisherId, streamName: alternative to stream
	//  - field: the name of the field to bind to, defaults to "content"
	//  - attribute: alternatively, the name of an attribute to bind to
	//	- inplaceType: type of the input - 'text' or 'textarea', defaults to 'textarea'

	function _construct() {
		var stream = this;
		tool.state.publisherId = stream.fields.publisherId;
		tool.state.streamName = stream.fields.name;

		function _setContent(content) {
			switch (options.inplaceType) {
				case 'text':
					tool.$('input').val(content);
					tool.$('.Q_inplace_tool_static_container').html(content.htmlentities());
					break;
				case 'textarea':
					tool.$('textarea').val(content);
					tool.$('.Q_inplace_tool_static_container').html(content.htmlentities().replaceAll({
						"\n": '<br>',
					 	' ': '&nbsp;'
					}));
					break;
			}
		};

		var field;
		if (options.attribute) {
			field = 'attributes['+encodeURIComponent(options.attribute)+']';
			stream.onUpdated(o.attribute).set(function (fields, changed) {
				_setContent(changed[o.attribute])
			}, tool);
		} else {
			field = options.field || 'content';
			stream.onFieldChanged(field).set(function (fields, field) {
				_setContent(fields[field]);
			}, tool);
		}

		if (!stream.testWriteLevel('editPending')) {
			return; // leave the html that is currently in the element
		}

		var ipo = tool.state.inplace = Q.extend(tool.state.inplace, {
			action: stream.actionUrl(),
			method: 'put',
			field: field
		});
		switch (options.inplaceType) {
			case 'text':
				ipo.fieldInput = $('<input />').attr('name', field).val(stream.fields[field]);
				ipo.staticHtml = stream.fields[field].htmlentities();
				break;
			case 'textarea':
				ipo.fieldInput = $('<textarea rows="5" cols="80" />').attr('name', field).text(stream.fields[field]);
				ipo.staticHtml = stream.fields[field].htmlentities().replaceAll({
					'<br>': "\n",
					'<br />': "\n",
					'&nbsp;': ' '
				});
				break;
			default:
				return "inplaceType must be 'textarea' or 'text'";
		}
		var inplace = Q.Tool.element('div', 'Q/inplace', ipo);
		Q.activate(tool.element.appendChild(inplace), function () {
			var inplace = tool.child('Q/inplace');
			if (!inplace) {
				return;
			}
			inplace.state.onSave.set(function () {
				Q.Streams.Message.wait(
					tool.state.publisherId,
					tool.state.streamName,
					-1,
					function () {
						tool.state.onUpdate.handle.call(tool);
					}
				);
			}, 'Streams/inplace');
		});
	}

	if (options.stream) {
		_construct.apply(options.stream);
	} else {
		if (!options.publisherId || !options.streamName) {
			throw "Streams/inplace tool: stream is undefined";
		}
		Q.Streams.get(options.publisherId, options.streamName, _construct);
	}
},

{
	inplaceType: 'textarea',
	onUpdate: new Q.Event()
}

);

})(jQuery, window, document);
