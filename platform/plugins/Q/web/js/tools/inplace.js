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
 *  @param {String} [options.method='put'] The HTTP verb to use.
 *  @param {String} [options.type='textarea'] The type of the input field. Can be "textarea" or "text"
 *  @param {Boolean=true} [options.editOnClick] Whether to enter editing mode when clicking on the text.
 *  @param {Boolean} [options.selectOnEdit=true] Whether to select everything in the input field when entering edit mode.
 *  @param {Boolean=true} [options.showEditButtons=false] Set to true to force showing the edit buttons on touchscreens
 *  @param {Number} [options.maxWidth=null] The maximum width that the field can grow to
 *  @param {Number} [options.minWidth=100] The minimum width that the field can shrink to
 *  @param {String} [options.staticHtml] The static HTML to start out with
 *  @param {String} [options.placeholder=null] Text to show in the staticHtml or input field when the editor is empty
 *  @param {Object} [options.template]  Can be used to override info for the tool's view template.
 *    @param {String} [options.template.dir='plugins/Q/views']
 *    @param {String} [options.template.name='Q/inplace/tool']
 *  @param {Q.Event} [options.onSave] This event triggers after save
 *  @param {Q.Event} [options.onCancel] This event triggers after canceling
 */
Q.Tool.define("Q/inplace", function (options) {
	var tool = this;
	var state = tool.state;
	var $te = $(tool.element);
	var container = tool.$('.Q_inplace_tool_container');
	if (container.length) {
		return _Q_inplace_tool_constructor.call(tool, this.element, options);
	}
	
	Q.addStylesheet('plugins/Q/css/inplace.css');
	
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
	var staticClass = o.type === 'textarea' 
		? 'Q_inplace_tool_blockstatic' 
		: 'Q_inplace_tool_static';
	Q.Template.render(
		'Q/inplace/tool',
		{
			'classes': function () { 
				return o.editing ? 'Q_editing Q_nocancel' : '';
			},
			staticClass: staticClass,
			staticHtml: staticHtml
				|| '<span class="Q_placeholder">'
					+state.placeholder.encodeHTML()
					+'</div>'
				|| '',
			method: o.method || 'put',
			action: o.action,
			field: o.field,
			textarea: (o.type === 'textarea'),
			placeholder: state.placeholder,
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
	showEditButtons: false,
	maxWidth: null,
	minWidth: 100,
	placeholder: 'Type something...',
	cancelPrompt: "Would you like to save your changes?",
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
	var state = tool.state;
	var blurring = false;
	var focusedOn = null;
	var dialogMode = false;
	var previousValue = null;
	var noCancel = false;
	var $te = $(tool.element);

	var container_span = tool.$('.Q_inplace_tool_container');
	var static_span = tool.$('.Q_inplace_tool_static');
	if (!static_span.length) {
		static_span = tool.$('.Q_inplace_tool_blockstatic');
	}
	tool.$('.Q_inplace_tool_editbuttons').css({ 
		'margin-top': static_span.outerHeight() + 'px',
		'line-height': '1px'
	});
	var edit_button = tool.$('button.Q_inplace_tool_edit');
	var save_button = tool.$('button.Q_inplace_tool_save');
	var cancel_button = tool.$('button.Q_inplace_tool_cancel');
	var fieldinput = tool.$(':input[type!=hidden]').not('button').eq(0)
		.addClass('Q_inplace_tool_fieldinput');
	var undermessage = tool.$('.Q_inplace_tool_undermessage');
	var throbber_img = $('<img />')
		.attr('src', Q.url('plugins/Q/img/throbbers/bars16.gif'));
	if (container_span.hasClass('Q_nocancel')) {
		noCancel = true;
	}
	previousValue = fieldinput.val();
	var maxWidth = state.maxWidth || null;
	if (!maxWidth) {
		$te.parents().each(function () {
			var $this = $(this);
			var display = $this.css('display');
			if (display === 'block' || display === 'table-cell'
			|| (display === 'inline-block' && this.style.width)) {
				maxWidth = this;
				return false;
			}
		});
	}
	setTimeout(function () {
		fieldinput.css({
			fontSize: static_span.css('fontSize'),
			fontFamily: static_span.css('fontFamily'),
			fontWeight: static_span.css('fontWeight'),
			letterSpacing: static_span.css('letterSpacing')
		});
		fieldinput.plugin('Q/autogrow', {
			maxWidth: state.maxWidth || maxWidth,
			minWidth: state.minWidth || 0
		});
		if (!fieldinput.data('inplace')) {
			fieldinput.data('inplace', {});
		}
		if (container_span.hasClass('Q_editing')) {
			fieldinput.data('inplace').widthWasAdjusted = true;
			fieldinput.data('inplace').heightWasAdjusted = true;
		}
		if (fieldinput.is('textarea') && !fieldinput.val()) {
			var height = static_span.outerHeight() + 'px';
			fieldinput.add(fieldinput.parent()).css('min-height', height);
		}
	}, 0); // hopefully it will be inserted into the DOM by then
	function onClick(event) {
		container_span.addClass('Q_editing');
		container_span.addClass('Q_discouragePointerEvents');
		if (state.bringToFront) {
			var $bringToFront = $(state.bringToFront);
			var pos = $bringToFront.css('position');
			$bringToFront.data(_stateKey_zIndex, $bringToFront.css('zIndex'))
				.data(_stateKey_position, pos)
				.css({
					zIndex: 99999,
					position: (pos === 'static') ? 'relative' : pos
				});
		}
		fieldinput.plugin('Q/autogrow', {
			maxWidth: state.maxWidth || maxWidth,
			minWidth: state.minWidth || 0,
			onResize: {"Q/inplace": function () {
				var margin = this.outerHeight() + parseInt(this.css('margin-top'));
				tool.$('.Q_inplace_tool_editbuttons').css('margin-top', margin+'px');
			}}
		}).plugin('Q/placeholders');
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
		if (!fieldinput.is('select')) {
			fieldinput.data('inplace').widthWasAdjusted = true;
			try {
				fieldinput.data('inplace').heightWasAdjusted = true;
			} catch (e) {

			}
			fieldinput.trigger('autogrowCheck');
		}
		_updateSaveButton();
		undermessage.empty().css('display', 'none').addClass('Q_error');
		focusedOn = 'fieldinput';
		fieldinput.focus();
		var selStart = 0;
		if (state.selectOnEdit) {
			if (fieldinput.attr('type') == 'text' && fieldinput.select) {
				fieldinput.select();
			}
		} else {
			selStart = fieldinput.val().length;
			if (fieldinput.attr('type') == 'text') {
				var v = fieldinput.val();
				fieldinput.val('');
				fieldinput.val(v); // put cursor at the end
			}
		}
		if (fieldinput.is('textarea')) {
			_setSelRange(
				fieldinput[0],
				selStart,
				fieldinput.val().length
			);
		}
		tool.$('.Q_inplace_tool_buttons').css({
			width: container_span.outerWidth() + 'px'
		});
		event.preventDefault();
	};
	function onSave () {
		var form = $('.Q_inplace_tool_form', $te);
		if (state && state.beforeSave) {
			if (false === Q.handle(state.beforeSave, this, [form])) {
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
		_restoreZ();
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
		_restoreZ();
		static_span.html(newval
			|| '<span class="Q_placeholder">'+state.placeholder.encodeHTML()+'</div>'
			|| ''
		);
		undermessage.empty().css('display', 'none').addClass('Q_error');
		tool.restoreActions();
		container_span.removeClass('Q_editing')
			.removeClass('Q_nocancel')
			.removeClass('Q_discouragePointerEvents');
		_hideEditButtons();
		noCancel = false;
		Q.handle(state.onSave, tool, [response.slots.Q_inplace]);
	};
	function onCancel (dontAsk) {
		if (noCancel) {
			return;
		}
		_restoreZ();
		if (!dontAsk && fieldinput.val() != previousValue) {
			dialogMode = true;
			var continueEditing = confirm(state.cancelPrompt);
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
		Q.handle(state.onCancel, tool);
	};
	function onBlur() {
		if (noCancel && fieldinput.val() !== previousValue) {
			return onSave();
		}
		setTimeout(function () {
			if (focusedOn
			 || dialogMode
			 || !container_span.hasClass('Q_editing')
			) {
				return;
			}
			onCancel();
		}, 100);
	};
	function _restoreZ()
	{
		if (!state.bringToFront) return;
		var $bringToFront = $(state.bringToFront);
		$bringToFront.css('zIndex', $bringToFront.data(_stateKey_zIndex))
			.css('position', $bringToFront.data(_stateKey_position))
			.removeData(_stateKey_zIndex)
			.removeData(_stateKey_position);
	}
	function _editButtons() {
		if (Q.info.isTouchscreen) {
			if (!state.editOnClick || state.showEditButtons) {
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
	container_span.on([Q.Pointer.fastclick, '.Q_inplace'], function (event) {
		if ((state.editOnClick && event.target === static_span[0])
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
		// happens despite canceled click
		static_span.on([Q.Pointer.fastclick, '.Q_inplace'], onClick);
	}
	edit_button.on(Q.Pointer.start, onClick); // happens despite canceled click
	cancel_button.on(Q.Pointer.start, function() {
		onCancel(true); 
		return false;
	});
	cancel_button.on('focus '+Q.Pointer.start, function() { setTimeout(function() {
		focusedOn = 'cancel_button'; }, 50);
	});
	cancel_button.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	save_button.click(function() { onSave(); return false; });
	save_button.on('focus '+Q.Pointer.start, function() { setTimeout(function() {
		focusedOn = 'save_button'; }, 50);
	});
	save_button.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
	fieldinput.on('keyup input', _updateSaveButton);
	fieldinput.focus(function() { focusedOn = 'fieldinput'; });
	fieldinput.blur(function() { focusedOn = null; setTimeout(onBlur, 100); });
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
	function _updateSaveButton() {
		save_button.css('display', (fieldinput.val() == previousValue)
			? 'none' 
			: 'inline'
		);
	}
}

var _stateKey_zIndex = 'Q/inplace zIndex';
var _stateKey_position = 'Q/inplace position';

})(Q, jQuery, window, document);
