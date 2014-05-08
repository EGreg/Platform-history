(function (Q, $) {

Q.Tool.define('Q/form', function(options) {

	// constructor & private declarations
	var tool = this;

	var $te = $(tool.element);
	var form = $te.closest('form');
	if (!form.length) return;
	if (form.data('Q/form tool')) return;
	form.on('submit.Q_form', function(event) {
		function onResponse(err, data) {
			var msg;
			if (msg = Q.firstErrorMessage(err)) {
				return alert(msg);
			}
			$('button', $te).closest('td').removeClass('Q_throb');
			Q.handle(tool.state.onResponse, tool, arguments);
			$('div.Q_form_undermessagebubble', $te).empty();
			$('tr.Q_error', $te).removeClass('Q_error');
			if ('errors' in data) {
				tool.applyErrors(data.errors);
				$('tr.Q_error').eq(0).prev().find(':input').eq(0).focus();
				if (data.scriptLines && data.scriptLines.form) {
					eval(data.scriptLines.form);
				}
			} else {
				var slots = Object.keys(data.slots);
				var pipe = new Q.pipe(slots, function () {
					Q.handle(tool.state.onSuccess, tool, arguments);
				});
				for (var slot in data.slots) {
					var e;
					switch (typeof tool.state.contentElements[slot]) {
					case 'HTMLElement':
					case 'jQuery':
						e = $(tool.state.contentElements[slot]); break;
					case 'string':
						e = $(tool.state.contentElements[slot], form); break;
					default:
						e = $(tool.element);
					}
					var replaced = Q.replace(e[0], data.slots[slot]);
					Q.activate(replaced, pipe.fill(slot));
					if (data.scriptLines && data.scriptLines[slot]) {
						eval(data.scriptLines[slot]);
					}
				}
			}
		};
		$('button', $te).closest('td').addClass('Q_throb');
		var result = {};
		var action = form.attr('action');
		if (!action) {
			action = window.location.href.split('?')[0];
		}
		Q.handle(tool.state.onSubmit, tool, [form, result]);
		if (result.cancel) {
			return false;
		}
		var input = $('input[name="Q.method"]', form);
		method = (input.val() || form.attr('method')).toUpperCase();
		if (tool.state.noCache && typeof tool.state.loader.forget === "function") {
			tool.state.noCache = false;
			tool.state.loader.forget(action, method, form.serialize(), tool.state.slotsToRequest);
		}
		tool.state.loader(action, method, form.serialize(), tool.state.slotsToRequest, onResponse);
		event.preventDefault();
	});
	$('input', form).add('select', form).on('input', function () {
		if (form.data('validator')) {
			form.data('validator').reset($(this));
		}
	});
	form.data('Q/form tool', tool);

},

{
	onSubmit: new Q.Event(),
	onResponse: new Q.Event(),
	onSuccess: new Q.Event(),
	slotsToRequest: 'form',
	contentElements: {},
	loader: function (url, method, params, slots, callback) {
		Q.request(url+"?"+params, slots, callback, {method: method});
	}
},

{
	beforeRemove: {"Q/form": function () {
		var form = $(this.element).closest('form');
		if (form.data('Q/form tool') === this) {
			form.removeData('Q/form tool');
			form.off('submit.Q_form');
		}
	}},
	
	onRetained: {"Q/form": function () {
		debugger;
	}},
	
	applyErrors: function(errors) {
		var err = null;
		for (var i=0; i<errors.length; ++i) {
			if (!('fields' in errors[i])
			|| Q.typeOf(errors[i].fields) !== 'array'
			|| !errors[i].fields.length) {
				err = errors[i];
				continue;
			}
			for (var j=0; j<errors[i].fields.length; ++j) {
				var k = errors[i].fields[j];
				var td = $("td[data-fieldname='"+k+"']", this.element);
				if (!td.length) {
					err = errors[i];
				}
				var tr = td.closest('tr').next();
				tr.addClass('Q_error');
				$('div.Q_form_undermessagebubble', tr)
					.html(errors[i].message);
			}
		}
		if (err) {
			alert(err.message);
		}
	},
	
	updateValues: function(newContent) {
		if (Q.typeOf(newContent) == 'string') {
			this.element.innerHTML = newContent;
			Q.activate(this.element);
		} else if ('fields' in newContent) {
			// enumerate the fields
			alert("An array was returned. Need to implement that.");
			for (var k in newContent.fields) {
				switch (newContent.fields[k].type) {
				 case 'date':
					break;
				 case 'select':
					break;
				 case 'checkboxes':
					break;
				 case 'radios':
				 	break;
				 default:
					break;
				}
			}
		}
	}
}

);

})(Q, jQuery);