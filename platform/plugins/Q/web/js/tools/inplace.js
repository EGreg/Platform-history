(function (Q, $, window, document, undefined) {

/**
 * Q Tools
 * @module Q-tools
 * @main Q-tools
 */
	
/**
 * Inplace text editor tool
 * @class Q inplace
 * @constructor
 * @param {Object} [options] This is an object of parameters for this function
 *  @param {String} [options.method] The HTTP verb to use.
 *  @default 'put'
 *  @param {String} [options.type] The type of the input field. Can be "textarea" or "text"
 *  @default 'textarea'
 *  @param {Boolean} [options.editOnClick] Whether to enter editing mode when clicking on the text.
 *  @default true
 *  @param {Boolean} [options.selectOnEdit] Whether to select everything in the input field when entering edit mode.
 *  @default true
 *  @param {Number} [options.maxWidth] The maximum width that the field can grow to
 *  @default null
 *  @param {Number} [options.minWidth] The minimum width that the field can shrink to
 *  @default 100
 *  @param {String} [options.placeholder] Text to show in the staticHtml or input field when the editor is empty
 *  @default null
 *  @param {Object} [options.template]  Can be used to override info for the tool's view template.
 *    @param {String} [options.template.dir]
 *    @default 'plugins/Q/views'
 *    @param {String} [options.template.name]
 *    @default 'Q/inplace/tool'
 *  @param {Event} [options.onSave] This event triggers after save
 *  @default Q.Event()
 *  @param {Event} [options.onCancel] This event triggers after canceling
 *  @default Q.Event()
 */
Q.Tool.define("Q/inplace", function (options) {
	var tool = this, 
		$te = $(tool.element), 
		container = $('.Q_inplace_tool_container', $te);
	if (container.length) {
		return _Q_inplace_tool_constructor.call(tool, this.element, options);
	}
	
	// if activated with JS should have following options:
	//	- action: required. the form action to save tool value
	//	- name: required. the name for input field
	//	- method: request method, defaults to 'PUT'
	//	- type: type of the input - 'text' or 'textarea', defaults to 'textarea'

	var o = options;
	if (!o || !o.action) {
		return console.error("Q/inplace tool: missing option 'action'", o);
	}
	if (!o.field) {
		return console.error("Q/inplace tool: missing option 'field'", o);
	}
	var staticHtml = o.staticHtml || $te.html();
	var staticClass = o.type === 'textarea' ? 'Q_inplace_tool_blockstatic' : 'Q_inplace_tool_static';
	Q.Template.render(
		'Q/inplace/tool',
		{
			'classes': function () { return o.editing ? 'Q_editing Q_nocancel' : ''; },
			staticClass: staticClass,
			staticHtml: staticHtml
				|| '<span class="Q_placeholder">'+tool.state.placeholder.encodeHTML()+'</div>'
				|| '',
			method: o.method || 'put',
			action: o.action,
			field: o.field,
			textarea: (o.type === 'textarea'),
			placeholder: tool.state.placeholder,
			text: function (field) {
				return staticHtml.decodeHTML();
			},
			type: o.type || 'text'
		},
		function (err, html) {
			if (!html) return;
			$te.html(html);
			return _Q_inplace_tool_constructor.call(tool, this.element, options);
		}, 
		o.template
	);
},

{
	method: 'put',
	type: 'textarea',
	editOnClick: true,
	selectOnEdit: true,
	maxWidth: null,
	minWidth: 100,
	placeholder: 'Type something...',
	template: {
		dir: 'plugins/Q/views',
		name: 'Q/inplace/tool'
	},
	onSave: new Q.Event(),
	onCancel: new Q.Event()
},

{
	/**
	 * Hide Q/actions, if any
	 * @method hideActions
	 */
	hideActions: function () { // Temporarily hide Q/actions if any
		this.actionsContainer = $('.Q_actions_container');
		this.actionsContainerVisibility = this.actionsContainer.css('visibility');
		this.actionsContainer.css('visibility', 'hidden');
	},
	
	/**
	 * Restore Q/actions, if any
	 * @method restoreActions
	 */
	restoreActions: function () { // Restore Q/actions if any
		if (!this.actionsContainer) return;
		this.actionsContainer.css('visibility', this.actionsContainerVisibility);
		delete this.actionsContainer;
		delete this.actionsContainerVisibility;
	}
}

);

function _setSelRange(inputEl, selStart, selend) {
	if ('setSelectionRange' in inputEl) {
		inputEl.focus();
		inputEl.setSelectionRange(selStart, selend);
	} else if (inputEl.createTextRange) {
		var range = inputEl.createTextRange();
		range.collapse(true);
		range.moveEnd('character', selend);
		range.moveStart('character', selStart);
		range.select();
	}
}

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
	$('.Q_inplace_tool_editbuttons', $te).css({ 
		'margin-top': static_span.outerHeight() + 'px',
		'line-height': '1px'
	});
	var edit_button = $('button.Q_inplace_tool_edit', $te);
	var save_button = $('button.Q_inplace_tool_save', $te);
	var cancel_button = $('button.Q_inplace_tool_cancel', $te);
	var fieldinput = $(':input[type!=hidden]', $te).not('button').eq(0)
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
		maxWidth: tool.state.maxWidth || $te.parent().innerWidth(),
		minWidth: tool.state.minWidth || 0
	});
	if (!fieldinput.data('inplace')) {
		fieldinput.data('inplace', {});
	}
	if (container_span.hasClass('Q_editing')) {
		fieldinput.data('inplace').widthWasAdjusted = true;
		fieldinput.data('inplace').heightWasAdjusted = true;
	}
	function onClick() {
		fieldinput.plugin('Q/autogrow', {
			maxWidth: tool.state.maxWidth || $te.parent().innerWidth(),
			minWidth: tool.state.minWidth || 0
		});
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

		tool.hideActions();
		
		previousValue = fieldinput.val();
		container_span.addClass('Q_editing');
		container_span.addClass('Q_discouragePointerEvents');
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
	function onSave () {
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
		var method = options.method || (form.length && form.attr('method')) || 'post';
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
	function onSaveErrors (message) {
		alert(message);
		fieldinput.focus();
		undermessage.css('display', 'none');
		/*
			.html(message)
			.css('whiteSpace', 'nowrap')
			.css('bottom', (-undermessage.height()-3)+'px');
		*/
	};
	function onSaveSuccess (response) {
		var newval = fieldinput.val();
		if ('slots' in response) {
			if ('Q_inplace' in response.slots) {
				newval = response.slots.Q_inplace;
			}
		}
		static_span.html(newval
			|| '<span class="Q_placeholder">'+tool.state.placeholder.encodeHTML()+'</div>'
			|| ''
		);
		undermessage.empty().css('display', 'none').addClass('Q_error');
		tool.restoreActions();
		container_span.removeClass('Q_editing')
			.removeClass('Q_nocancel')
			.removeClass('Q_discouragePointerEvents');
		_hideEditButtons();
		noCancel = false;
		Q.handle(tool.state.onSave, tool, [response.slots.Q_inplace]);
	};
	function onCancel (dontAsk) {
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
		tool.restoreActions();
		container_span.removeClass('Q_editing')
			.removeClass('Q_discouragePointerEvents');;
		_hideEditButtons();
		Q.handle(tool.state.onCancel, tool);
	};
	function onBlur() {
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
	function _editButtons() {
		if (Q.info.isTouchscreen) {
			if (!tool.state.editOnClick) {
				$('.Q_inplace_tool_editbuttons', $te).css({ 
					'margin-top': static_span.outerHeight() + 'px',
					'line-height': '1px',
					'display': 'inline'
				});
			}
		} else {
			container_span.mouseover(function() {
				container_span.addClass('Q_hover');
				$('.Q_inplace_tool_editbuttons', $te).css({ 
					'margin-top': static_span.outerHeight() + 'px',
					'line-height': '1px',
					'display': 'inline'
				});
			}).mouseout(function () {
				$('.Q_inplace_tool_editbuttons', $te).css({ 
					'display': 'none'
				});
			});
		}
	}
	function _hideEditButtons() {
		if (!Q.info.isTouchscreen) {
			$('.Q_inplace_tool_editbuttons', container_span).css('display', 'none');
		}
	}
	_editButtons();
	container_span.mouseout(function() {
		container_span.removeClass('Q_hover');
	});
	container_span.on([Q.Pointer.end, '.Q_inplace'], function (event) {
		if (Q.Pointer.canceledClick) {
			// could have been canceled by Q/sortable for instance
			return;
		}
		if ((tool.state.editOnClick && event.target === static_span[0])
		|| $(event.target).is('button')) {
			Q.Pointer.cancelClick(event);
			Q.Pointer.ended();
			event.stopPropagation();
		}
	})
	edit_button.on(Q.Pointer.start, function (event) {
		Q.Pointer.cancelClick(event);
	});
	if (this.state.editOnClick) {
		static_span.click(onClick); // happens despite canceled click
	}
	edit_button.click(onClick); // happens despite canceled click
	cancel_button.click(function() { onCancel(true); return false; });
	cancel_button.on('focus mousedown', function() { setTimeout(function() {
		focusedOn = 'cancel_button'; }, 50);
	});
	cancel_button.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	save_button.click(function() { onSave(); return false; });
	save_button.on('focus mousedown', function() { setTimeout(function() {
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
	fieldinput.click(function (event) {
		event.stopPropagation();
	});

}

})(Q, jQuery, window, document);
