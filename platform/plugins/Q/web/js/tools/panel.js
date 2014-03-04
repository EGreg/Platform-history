(function ($) {

Q.Tool.define("Q/panel", function() {

	// constructor & private declarations
	var me = this;
	var form_val = null;
	var container;
	var $te = $(me.element);
	var prefix = this.prefix;

	me.Q_init = function() {
		var form = $('form', $te);
		var form_tool_prefix = prefix+'Q_form_';
		var static_tool_prefix = prefix+'idstatic_Q_form_';
		var container = $('.Q_panel_tool_container', $te);
		if (form_tool_id in Q.tools) {
			var form_tool = Q.Tool.byId(form_tool_id);
			form_tool.onSuccess[prefix] = function() {
				form_val = form.serialize();
				container.removeClass('Q_modified');
				container.removeClass('Q_editing');
			};
			if (static_tool_id in Q.tools) {
				var static_tool = Q.Tool.byId(static_tool_id);
			}
			form_tool.onResponse[prefix] = function(response) {
				var buttons = $('.Q_panel_tool_buttons', $te);
				buttons.removeClass('Q_throb');
				if ('slots' in response) {
					if ('form' in response.slots) {
						form_tool.updateValues(response.slots.form);
					}
					if (('static' in response.slots) && static_tool) {
						static_tool.updateValues(response.slots['static']);
					}
				}
			}
			form_tool.onSubmit[prefix] = function() {
				var buttons = $('.Q_panel_tool_buttons', $te);
				buttons.addClass('Q_throb');
			}
			form_tool.slotsToRequest = 'form,static';
		}
	};

	container = $('.Q_panel_tool_container', $te);
	var form = $('form', $te);
	var edit_button = $('.Q_panel_tool_edit', $te);
	var cancel_button = $('button.Q_panel_tool_cancel', $te);
	form_val = form.serialize();
	form.bind('change keyup keydown blur', function() {
		var new_val = form.serialize();
		if (form_val !== new_val) {
			container.addClass('Q_modified');
		} else {
			container.removeClass('Q_modified');
		}
	});	
	if (container.hasClass('Q_panel_tool_toggle_onclick')) {
		var header = $('.Q_panel_tool_header', container);
		header.click(function() {
			if (container.hasClass('Q_collapsed')) {
				container.removeClass('Q_collapsed');
				container.addClass('Q_expanded');
			} else {
				container.addClass('Q_collapsed');
				container.removeClass('Q_expanded');
			}
		});
	} else if (container.hasClass('Q_panel_tool_toggle_move')) {
		var header = $('.Q_panel_tool_header', container);
		header.mouseenter(function() {
			container.removeClass('Q_collapsed');
			container.addClass('Q_expanded');
		});
		container.mouseleave(function() {
			container.addClass('Q_collapsed');
			container.removeClass('Q_expanded');
		});
	}
	edit_button.click(function() {
		container.addClass('Q_editing');
		container.removeClass('Q_collapsed');
		container.addClass('Q_expanded');
		return false;
	});
	cancel_button.click(function() {
		container.removeClass('Q_editing');
		container.removeClass('Q_modified');
		return true; // really cancel the form
	});
});

})(jQuery);