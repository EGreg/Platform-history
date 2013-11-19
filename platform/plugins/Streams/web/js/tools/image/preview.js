(function ($, window, undefined) {

/*
 * Streams/image/preview tool.
 * Renders a tool to preview (and possibly replace) images
 * @param options {Object}
 *   A hash of options, which include:
 *   "publisherId": Required.
 *   "streamName": If empty, and "editable" is true, then this can be used to add new related Streams/image streams.
 *   "related": A hash with properties "publisherId" and "streamName", and usually "type"
 *   "editable": Whether the tool should allow authorized users to replace the image
 *   "creatable": Optional fields to override in case streamName = "", including:
 *     "title": Optional title for the case when streamName = "", i.e. the image composer
 *     "clickable": Whether the image composer image is clickable
 *   "imagepicker": Any options to pass to the imagepicker -- see its options.
 *   "onUpdate": A function to execute when the icon is updated
 *   "showFile": Optional. The image file to show, to override imagepicker.showSize option for some reason.
 */
Q.Tool.define("Streams/image/preview", function(options) {
	
	var tool = this;
	if (!tool.state.imagepicker || !tool.state.imagepicker.showSize) {
		throw "Streams/image/preview tool: missing options.imagepicker.showSize";
	}
	var state = tool.state, ip = state.imagepicker;
	var parts = ip.showSize.split('x');
	
	if (!ip.saveSizeName) {
		ip.saveSizeName = {};
		Q.each(Q.Streams.image.sizes, function (i, size) {
			ip.saveSizeName[size] = size;
		});
	}
	
	function _composer () {
		var fields = Q.extend({}, state.templates.create.fields, {
			src: Q.url('plugins/Streams/img/actions/add.png'),
			alt: state.creatable.title,
			title: state.creatable.title
		});
		$(tool.element).addClass('Streams_image_preview_create');
		Q.Template.render(
			'Streams/image/preview/edit',
			fields,
			function (err, html) {
				if (err) {
					return console.warn(err);
				}
				tool.element.innerHTML = html;
				var ipo = Q.extend({}, ip, {
					preprocess: function (callback) {
						Q.Streams.create({
							publisherId: state.publisherId,
							type: 'Streams/image'
						}, function (err) {
							if (err) {
								alert(err);
								callback(false);
								return console.warn(err);
							}
							state.publisherId = this.fields.publisherId;
							state.streamName = this.fields.name;
							tool.stream = this;
							callback({subpath: 'streams/' + this.fields.publisherId + '/' + this.fields.name});
//							this.refresh(); // TODO: change this to onCreate or something, in the case of related nothing needs to be done
						}, state.relatedFrom);
					},
					onSuccess: {'Streams/image/preview': function (data, key) {
						Q.Streams.refresh(
							state.publisherId,
							state.streamName,
							function () {
								_render();
							}
						);
						return false;
					}}
				});

				var w = parts[0] || state.creatable.addIconSize,
					h = parts[0] || state.creatable.addIconSize;
				w = h = Math.min(w, h);
				if (w && h) {
					tool.$('.Streams_image_preview_add').width(w).height(h);
				}
				if (state.creatable.clickable) {
					tool.$('.Streams_image_preview_add')
						.plugin('Q/clickable')
						.plugin('Q/imagepicker', ipo);
				}
			},
			state.templates.create
		);
	}
	
	function _preview() {
		if (parts[0]) { tool.$('.Streams_image_preview_icon').width(parts[0]) }
		if (parts[1]) { tool.$('.Streams_image_preview_icon').height(parts[0]) }

		var img = document.createElement('img');
		img.setAttribute('alt', 'loading');
		img.setAttribute('src', Q.url(state.throbber));
		img.setAttribute('class', 'Streams_image_preview_loading');
		tool.element.innerHTML = '';
		tool.element.appendChild(img);

		Q.Streams.get(state.publisherId, state.streamName, function (err) {

			function _afterRefresh () {
				if (!stream.testWriteLevel('editPending')) {
					return;
				}
				var ipo = Q.extend({}, ip, {
					preprocess: function (callback) {
						Q.Streams.get(state.publisherId, state.streamName, function (err) {
							if (err) {
								return console.warn(err);
							}
							tool.stream = stream;
							callback({subpath: 'streams/' + stream.fields.publisherId + '/' + stream.fields.name});
						});
					},
					onSuccess: {'Streams/image/preview': function (data, key) {
						Q.Streams.refresh(
							state.publisherId,
							state.streamName,
							function () {
								state.onUpdate.handle.call(tool, data);
							}
						);
					}}
				});
				tool.$('img').plugin('Q/imagepicker', ipo);
			}

			if (err) {
				return console.warn(err);
			}
			var stream = this;

			tool.stream = stream;
			tool.refresh(_afterRefresh);
			stream.onFieldChanged('icon').set(function () {
				tool.refresh(_afterRefresh);
			}, tool);
		});
	}
	
	function _render() {
		if (!state.streamName) {
			_composer();
		} else {
			_preview();
		}
	}
	
	_render();
},

{
	relatedFrom: null,
	editable: false,
	creatable: {
		title: "New Image",
		clickable: true,
		addIconSize: 100
	},
	imagepicker: {
		showSize: "x200"
	},
	showFile: null,
	templates: {
		edit: {
			dir: 'plugins/Streams/views',
			name: 'Streams/image/preview/edit',
			fields: {
				alt: 'image',
				titleClass: '',
				titleTag: 'h2'
			}
		},
		create: {
			dir: 'plugins/Streams/views',
			name: 'Streams/image/preview/create',
			fields: {
				alt: 'image',
				titleClass: '',
				titleTag: 'h2'
			}
		}
	},
	inplace: {},
	throbber: "plugins/Q/img/throbbers/coolspinner_dark.gif",
	onUpdate: new Q.Event()
},

{
	refresh: function (callback) {
		var tool = this, state = tool.state, stream = this.stream;
		var file = state.showFile
			|| state.imagepicker.saveSizeName[state.imagepicker.showSize]
			|| state.imagepicker.saveSizeName[Q.first(state.imagepicker.saveSizeName, {nonEmpty: true})];
		var icon = stream && stream.fields.icon && stream.fields.icon !== 'default' ? stream.fields.icon : 'Streams/image';
		
		var jq = this.$('img.Streams_image_preview_icon');
		if (jq.length) {
			jq.attr('src', Q.Streams.iconUrl(icon, file)+'?'+Date.now());
			return true;
		}
		
		var inplace = Q.extend({
			publisherId: state.publisherId,
			streamName: state.streamName,
			field: 'title',
			inplaceType: 'text'
		}, state.inplace);
		var fields = Q.extend({}, state.templates.edit.fields, {
			src: Q.Streams.iconUrl(icon, file)+'?'+Date.now(),
			alt: stream.fields.title,
			inplace: "<div class='Q_tool Streams_inplace_tool' data-streams-inplace='"+Q.Tool.encodeOptions(inplace)+"'></div>"
		});
		Q.Template.render(
			'Streams/image/preview/edit',
			fields,
			function (err, html) {
				if (err) {
					return console.warn(err);
				}
				tool.element.innerHTML = html;
				Q.activate(tool, callback);
			},
			state.templates.edit
		);
	}
}

);

Q.Template.set(
	'Streams/image/preview/edit',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="{{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
);

Q.Template.set(
	'Streams/image/preview/create',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_add">'
	+ '<div class="{{titleClass}}"><{{titleTag}}>{{& title}}</{{titleTag}}></div>'
);

/*
<div class="Golden-carousel sky-carousel">
	<div class="sky-carousel-wrapper">
		<ul class="sky-carousel-container">
			<?php foreach ($images as $image): ?> 
				<li>
					<?php echo Q_Html::a(Q_Html::themedUrl($image['src']), array('class' => 'fancybox', 'rel' => 'group')) ?> 
						<?php echo Q_Html::img($image['thumb_src'], $image['alt']) ?> 
					</a>
					<div class="sc-content">
						<h2><?php echo $image['alt'] ?></h2>
					</div>
				</li>
			<?php endforeach ?> 
		</ul>
	</div>
</div>
 */

})(window.jQuery, window);