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
	if (!options.imagepicker || !options.imagepicker.showSize) {
		throw "Streams/image/preview tool: missing options.imagepicker.showSize";
	}
	var parts = options.imagepicker.showSize.split('x');
	
	if (!options.imagepicker.saveSizeName) {
		options.imagepicker.saveSizeName = {}
		Q.each(Q.Streams.image.sizes, function (i, size) {
			options.imagepicker.saveSizeName[size] = size;
		});
	}
	
	var ipo = Q.extend({}, options.imagepicker, {
		onSuccess: {'Streams/image/preview': function (data, key) {
			Q.Streams.Message.wait(
				tool.state.publisherId,
				tool.state.streamName,
				-1,
				function () {
					tool.state.onUpdate.handle.call(tool, data);
				}
			);
		}}
	});
	
	if (!options.streamName) {
		// TODO FOR related.js: test whether the user can create streams of this type
		// and otherwise do not append this element
		var fields = Q.extend({}, this.state.templates.create.fields, {
			src: Q.url('plugins/Streams/img/actions/add.png'),
			alt: options.creatable.title,
			title: options.creatable.title
		});
		tool.element.setAttribute('class', 'Streams_image_preview_create');
		Q.Template.render(
			'Streams/image/preview/edit',
			fields,
			function (err, html) {
				if (err) {
					return console.warn(err);
				}
				tool.element.innerHTML = html;
				
				var ipo2 = Q.extend({}, ipo, {
					preprocess: function (callback) {
						Q.Streams.create({
							publisherId: options.publisherId,
							type: 'Streams/image'
						}, function (err) {
							if (err) {
								// TODO: cancel things for sure
								tool.element.setAttribute('class', '');
								alert(err);
								return console.warn(err);
							}
							tool.state.publisherId = this.fields.publisherId;
							tool.state.streamName = this.fields.name;
							tool.stream = this;
							callback({subpath: 'streams/' + this.fields.publisherId + '/' + this.fields.name});
//							this.refresh(); // TODO: change this to onCreate or something, in the case of related nothing needs to be done
						}, tool.state.relatedFrom);
					}
				});
				
				if (parts[0]) { tool.$('.Streams_image_preview_icon').width(parts[0]) }
				if (parts[1]) { tool.$('.Streams_image_preview_icon').height(parts[0]) }
				if (options.creatable.clickable) {
					tool.$('.Streams_image_preview_icon')
						.plugin('Q/clickable')
						.plugin('Q/imagepicker', ipo2);
				}
			},
			tool.state.templates.create
		);
		return;
	}
	
	if (parts[0]) { tool.$('.Streams_image_preview_icon').width(parts[0]) }
	if (parts[1]) { tool.$('.Streams_image_preview_icon').height(parts[0]) }
	
	var img = document.createElement('img');
	img.setAttribute('alt', 'loading');
	img.setAttribute('src', Q.url(options.throbber));
	img.setAttribute('class', 'Streams_image_preview_loading');
	tool.element.innerHTML = '';
	tool.element.appendChild(img);
	
	Q.Streams.get(options.publisherId, options.streamName, function (err) {
		
		function _afterRefresh () {
			if (!stream.testWriteLevel('editPending')) {
				return;
			}
			var ipo2 = Q.extend({}, ipo, {
				preprocess: function (callback) {
					Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
						if (err) {
							return console.warn(err);
						}
						tool.stream = stream;
						callback({subpath: 'streams/' + stream.fields.publisherId + '/' + stream.fields.name});
					});
				}
			});
			tool.$('img').plugin('Q/imagepicker', ipo2);
		}
		
		if (err) {
			return console.warn(err);
		}
		var stream = this;
		
		tool.stream = stream;
		tool.refresh(_afterRefresh);
		stream.onFieldChanged('icon').set(function () {
			tool.refresh(_afterRefresh);
		});
	});
},

{
	relatedFrom: null,
	editable: false,
	creatable: {
		title: "New Image",
		clickable: true
	},
	imagepicker: {
		showSize: "80"
	},
	showFile: null,
	templates: {
		edit: {
			dir: 'plugins/Streams/views',
			name: 'Streams/image/preview/create',
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
	throbber: "plugins/Q/img/throbbers/spinner_sticky_gray.gif",
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
			'Streams/image/preview/tool',
			fields,
			function (err, html) {
				if (err) {
					return console.warn(err);
				}
				tool.element.innerHTML = html;
				Q.activate(tool.element, callback);
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
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_icon">'
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