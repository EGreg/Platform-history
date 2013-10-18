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
	//	- fieldType: type of the input - 'text' or 'textarea', defaults to 'textarea'

	var stream = options.stream;
	if (!stream) {
		throw "Streams/inplace tool: stream is undefined";
	}
	if (!stream.testWriteLevel('editPending')) {
		return; // leave the html that is currently in the element
	}
	
	var ipo = this.state.inplace = Q.extend(this.state.inplace, {
		action: stream.actionUrl(),
		method: 'put',
		fieldName: options.attribute ? 'attributes['+encodeURIComponent(options.attribute)+']' : 'content'
	});
	switch (options.fieldType) {
		case 'text':
			ipo.fieldInput = $('<input />').attr('name', ipo.fieldName).val(stream.fields.content);
			ipo.staticHtml = stream.fields.content.htmlentities();
			break;
		case 'textarea':
			ipo.fieldInput = $('<textarea rows="5" cols="80" />').attr('name', ipo.fieldName).val(stream.fields.content);
			ipo.staticHtml = stream.fields.content.htmlentities().replace("\n", "<br>");
			break;
		default:
			return "fieldType must be 'textarea' or 'text'";
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
	fieldType: 'textarea',
	onUpdate: new Q.Event()
}

);

function _Q_inplace_tool_constructor(element, options) {

	// constructor & private declarations
	var tool = this;
	var blurring = false;
	var focusedOn = null;
	var dialogMode = false;
	var previousValue = null;
	var noCancel = false;
	var $te = $(tool.element);

	var container_span = $('.Q_inplace_tool_container', $te);
	var static_span = $('.Q_inplace_tool_static', $te);
	if (!static_span.length) {
		static_span = $('.Q_inplace_tool_blockstatic', $te);
	}
	var editButtons = $('.Q_inplace_tool_editbuttons', $te);
	editButtons.css({ 
		'margin-top': container_span.outerHeight() + 'px',
		'line-height': '1px'
	});
	var edit_button = $('button.Q_inplace_tool_edit', $te);
	var save_button = $('button.Q_inplace_tool_save', $te);
	var cancel_button = $('button.Q_inplace_tool_cancel', $te);
	var fieldinput = $(':input', $te).not('button').eq(0)
		.addClass('Q_inplace_tool_fieldinput');
	var undermessage = $('.Q_inplace_tool_undermessage', $te);
	var throbber_img = $('<img />')
		.attr('src', Q.url('plugins/Q/img/throbbers/bars16.gif'));
	if (container_span.hasClass('Q_nocancel')) {
		noCancel = true;
	}
	fieldinput.css({
		fontSize: static_span.css('fontSize'),
		fontFamily: static_span.css('fontFamily'),
		fontWeight: static_span.css('fontWeight'),
		letterSpacing: static_span.css('letterSpacing')
	});
	fieldinput.plugin('Q/autogrow', {
		maxWidth: $te.parent().innerWidth()
	});
	if (!fieldinput.data('inplace')) {
		fieldinput.data('inplace', {});
	}
	if (container_span.hasClass('Q_editing')) {
		fieldinput.data('inplace').widthWasAdjusted = true;
		fieldinput.data('inplace').heightWasAdjusted = true;
	}
	var onClick = function() {
		var field_width = static_span.outerWidth();
		var field_height = static_span.outerHeight();
		if (fieldinput.is('select')) {
			field_width += 40;
		} else if (fieldinput.is('input[type=text]')) {
			field_width += 5;
			field_height = static_span.css('line-height');
		} else if (fieldinput.is('textarea')) {
			field_height = Math.max(field_height, 10);
		}
		fieldinput.css({
			fontSize: static_span.css('fontSize'),
			fontFamily: static_span.css('fontFamily'),
			fontWeight: static_span.css('fontWeight'),
			letterSpacing: static_span.css('letterSpacing'),
			width: field_width + 'px'
		});
		previousValue = fieldinput.val();
		container_span.addClass('Q_editing');
		if (!fieldinput.is('select')) {
			fieldinput.data('inplace').widthWasAdjusted = true;
			try {
				fieldinput.data('inplace').heightWasAdjusted = true;
			} catch (e) {

			}
			fieldinput.trigger('autogrowCheck');
		}
		undermessage.empty().css('display', 'none').addClass('Q_error');
		focusedOn = 'fieldinput';
		fieldinput.focus();
		var selStart = 0;
		if (tool.state.selectOnEdit) {
			if (fieldinput.attr('type') == 'text' && fieldinput.select) {
				fieldinput.select();
			}
		} else {
			selStart = fieldinput.val().length;
		}
		if (fieldinput.is('textarea')) {
			_setSelRange(
				fieldinput[0],
				selStart,
				fieldinput.val().length
			);
		}
		$('.Q_inplace_tool_buttons', $te).css({ 'width': container_span.outerWidth() + 'px' });
		return false;
	};
	var onSave = function() {
		var form = $('.Q_inplace_tool_form', $te);
		if (tool.state && tool.state.beforeSave) {
			if (false === Q.handle(tool.state.beforeSave, this, [form])) {
				return false;
			}
		}
		undermessage.html(throbber_img)
			.css('display', 'block')
			.removeClass('Q_error');
		focusedOn = 'fieldinput';
		var method = (form.length) ? form.attr('method') : 'post';
		var url = form.attr('action');

		var used_placeholder = false;
		if (fieldinput.attr('placeholder')
		&& fieldinput.val() === fieldinput.attr('placeholder')) {
			// this is probably due to a custom placeholder mechanism
			// so clear the field, rather than saving the placeholder text
			fieldinput.val('');
			used_placeholder = true;
		}

		$.ajax({
			url: Q.ajaxExtend(url, 'Q_inplace', {'method': method}),
			type: 'POST',
			data: form.serialize(),
			dataType: 'json',
			error: function(xhr, status, except) {
				onSaveErrors('ajax status: ' + status + '... try again');
			},
			success: function(response) {
				if (typeof response !== 'object') {
					onSaveErrors("returned data is not an object");
					return;
				}
				if (response.errors && response.errors.length) {
					onSaveErrors(response.errors[0].message);
					return;
				}

				function afterLoad(alreadyLoaded) {
					if (('scriptLines' in response) && ('Q_inplace' in response.scriptLines)) {
						eval(response.scriptLines.Q_inplace);
					}
				}

				if(response.scripts && response.scripts.Q_inplace && response.scripts.Q_inplace.length) {
					Q.addScript(response.scripts.Q_inplace, afterLoad);
				} else {
					afterLoad();
				}

				onSaveSuccess(response);
			}
		});

		if (used_placeholder) {
			fieldinput.val(fieldinput.attr('placeholder'));
		}
	};
	var onSaveErrors = function(message) {
		alert(message);
		fieldinput.focus();
		undermessage.css('display', 'none');
		/*
			.html(message)
			.css('whiteSpace', 'nowrap')
			.css('bottom', (-undermessage.height()-3)+'px');
		*/
	};
	var onSaveSuccess = function(response) {
		var newval = fieldinput.val();
		if ('slots' in response) {
			if ('Q_inplace' in response.slots) {
				newval = response.slots.Q_inplace;
			}
		}
		static_span.html(newval);
		undermessage.empty().css('display', 'none').addClass('Q_error');
		container_span.removeClass('Q_editing').removeClass('Q_nocancel');
		noCancel = false;
		Q.handle(tool.state.onSave, tool, [response.slots.Q_inplace]);
	};
	var onCancel = function(dontAsk) {
		if (noCancel) {
			return;
		}
		if (!dontAsk && fieldinput.val() != previousValue) {
			dialogMode = true;
			var continueEditing = confirm(
				"Would you like to save your changes?"
			);
			dialogMode = false;
			if (continueEditing) {
				onSave();
				return;
			}
		}
		fieldinput.val(previousValue);
		fieldinput.blur();
		focusedOn = null;
		container_span.removeClass('Q_editing');
		Q.handle(tool.state.onCancel, tool);
	};
	var onBlur = function() {
		setTimeout(function () {
			if (focusedOn
			 || dialogMode
			 || !container_span.hasClass('Q_editing')) {
				return;
			}
			if (fieldinput.val() == previousValue) {
				onCancel(); return;
			}
			onCancel();
		}, 100);
	};
	container_span.mouseover(function() {
		container_span.addClass('Q_hover');
		$('.Q_inplace_tool_editbuttons', $te).css({ 
			'margin-top': container_span.outerHeight() + 'px',
			'line-height': '1px'
		});
	});
	container_span.mouseout(function() {
		container_span.removeClass('Q_hover');
	});
	if (this.options.editOnClick) static_span.click(onClick);
	edit_button.click(onClick);
	cancel_button.click(function() { onCancel(true); return false; });
	cancel_button.bind('focus mousedown', function() { setTimeout(function() {
		focusedOn = 'cancel_button'; }, 50);
	});
	cancel_button.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	save_button.click(function() { onSave(); return false; });
	save_button.bind('focus mousedown', function() { setTimeout(function() {
		focusedOn = 'save_button'; }, 50);
	});
	save_button.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	fieldinput.keyup(function() {
		var invisible_span = $('.Q_inplace_tool_invisible_span', $te);
		invisible_span
			.css('font-family', fieldinput.css('font-family'))
			.css('font-size', fieldinput.css('font-size'));
		invisible_span.text(fieldinput.val());
		save_button.attr('display', (fieldinput.val() == previousValue) ? 'none' : 'inline');
	});
	fieldinput.focus(function() { focusedOn = 'fieldinput'; });
	fieldinput.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	fieldinput.change(function() { fieldinput.attr(fieldinput.val().length.toString() + 'em;') });
	fieldinput.keydown(function(event) {
		if (!focusedOn) {
			return false;
		}
		if (event.keyCode == 13) {
			if (! fieldinput.is('textarea')) {
				onSave(); return false;
			}
		} else if (event.keyCode == 27) {
			onCancel(); return false;
		}
	});
	fieldinput.closest('form').submit(function () {
		onSave();
	});
	fieldinput.click(function () {
		return false;
	});

}

})(jQuery, window, document);
