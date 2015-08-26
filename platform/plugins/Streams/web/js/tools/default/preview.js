(function (Q, $, window, undefined) {

/**
 * @module Streams-tools
 */

/**
 * Default tool for rendering a stream preview, which also serves as
 * a reference implementation.
 * Requires Streams/preview tool to be activated on the same element.
 * @class Streams default preview
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {Object} [options.inplace] Any options to pass to the Q/inplace tool -- see its options.
 *   @uses Q inplace
 *   @param {Object} [options.templates] Under the keys "views", "edit" and "create" you can override options for Q.Template.render .
 *     @param {Object} [options.templates.view]
 *       @param {String} [options.templates.view.name='Streams/image/preview/view']
 *       @param {Object} [options.templates.view.fields]
 *         @param {String} [options.templates.view.fields.alt]
 *         @param {String} [options.templates.view.fields.titleClass]
 *         @param {String} [options.templates.view.fields.titleTag]
 *     @param {Object} [options.templates.edit]
 *       @param {String} [options.templates.edit.name='Streams/image/preview/edit']
 *       @param {Object} [options.templates.edit.fields]
 *         @param {String} [options.templates.edit.fields.alt]
 *         @param {String} [options.templates.edit.fields.titleClass]
 *         @param {String} [options.templates.edit.fields.titleTag]
 */
Q.Tool.define("Streams/default/preview", "Streams/preview",
function _Streams_default_preview(options, preview) {
	this.preview = preview;
	preview.state.onRefresh.add(this.refresh.bind(this));
},

{
	inplace: {},
	templates: {
		view: {
			name: 'Streams/default/preview/view',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		},
		edit: {
			name: 'Streams/default/preview/edit',
			fields: { alt: 'icon', titleClass: '', titleTag: 'h2' }
		}
	}
},

{
	refresh: function (stream, onLoad) {
		var tool = this;
		var state = tool.state;
		var ps = tool.preview.state;
		// set up a pipe to know when the icon has loaded
		var p = Q.pipe(['inplace', 'icon'], function () {
			Q.handle(onLoad, tool);
		});
		// set up the inplace options
		var inplace = null;
		if (state.inplace) {
			var inplaceOptions = Q.extend({
				publisherId: ps.publisherId,
				streamName: ps.streamName,
				field: 'title',
				inplaceType: 'text'
			}, state.inplace);
			var se = ps.editable;
			if (!se || (se !== true && se.indexOf('title') < 0)) {
				inplaceOptions.editable = false;
			}
			inplace = tool.setUpElementHTML('div', 'Streams/inplace', inplaceOptions);
		}
		// render a template
		var f = state.template && state.template.fields;
		var fields = Q.extend({}, state.templates.edit.fields, f, {
			alt: stream.fields.title,
			inplace: inplace
		});
		var tpl = (ps.editable !== false || stream.testWriteLevel('suggest'))
			? 'edit' 
			: 'view';
		Q.Template.render(
			'Streams/default/preview/'+tpl,
			fields,
			function (err, html) {
				if (err) return;
				tool.element.innerHTML = html;
				Q.activate(tool, function () {
					// load the icon
					var jq = tool.$('img.Streams_preview_icon');
					tool.preview.icon(jq[0], p.fill('icon'));
					tool.child('Streams_inplace').state.onLoad.add(function () {
						p.fill('inplace').apply(this, arguments);
					});
				});
			},
			state.templates[tpl]
		);
	}
}

);

Q.Template.set('Streams/default/preview/edit',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_icon">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{& inplace}}</{{titleTag}}>'
	+ '</div></div>'
);

Q.Template.set('Streams/default/preview/create',
	'<div class="Streams_preview_container Q_clearfix">'
	+ '<img alt="{{alt}}" class="Streams_preview_add">'
	+ '<div class="Streams_preview_contents {{titleClass}}">'
	+ '<{{titleTag}} class="Streams_preview_title">{{title}}</{{titleTag}}>'
	+ '</div></div>'
);

})(Q, jQuery, window);