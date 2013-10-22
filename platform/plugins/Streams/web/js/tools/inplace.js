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
	//  - field: the name of the field to bind to, defaults to "content"
	//  - attribute: alternatively, the name of an attribute to bind to
	//	- inplaceType: type of the input - 'text' or 'textarea', defaults to 'textarea'

	var stream = options.stream;
	if (!stream) {
		throw "Streams/inplace tool: stream is undefined";
	}
	
	this.state.publisherId = stream.fields.publisherId;
	this.state.streamName = stream.fields.name;
	
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
		}, this);
	} else {
		field = options.field || 'content';
		stream.onFieldChanged(field).set(function (fields, field) {
			_setContent(fields[field]);
		}, this);
	}
	
	if (!stream.testWriteLevel('editPending')) {
		return; // leave the html that is currently in the element
	}
	
	var ipo = this.state.inplace = Q.extend(this.state.inplace, {
		action: stream.actionUrl(),
		method: 'put',
		field: field
	});
	switch (options.inplaceType) {
		case 'text':
			ipo.fieldInput = $('<input />').attr('name', ipo.field).val(stream.fields.content);
			ipo.staticHtml = stream.fields.content.htmlentities();
			break;
		case 'textarea':
			ipo.fieldInput = $('<textarea rows="5" cols="80" />').attr('name', ipo.field).text(stream.fields.content);
			ipo.staticHtml = stream.fields.content.htmlentities().replaceAll({
				'<br>': "\n",
				'<br />': "\n",
				'&nbsp;': ' '
			});
			break;
		default:
			return "inplaceType must be 'textarea' or 'text'";
	}
	this.element.appendChild(Q.Tool.element('div', 'Q/inplace', ipo));

	this.Q_init = function () {
		var tool = this;
		var inplace = this.child('Q/inplace');
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
	};
},

{
	inplaceType: 'textarea',
	onUpdate: new Q.Event()
}

);

})(jQuery, window, document);
