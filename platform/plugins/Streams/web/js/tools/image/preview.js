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
 *   "imagepicker": Any options to pass to the imagepicker -- see its options. Must include "showSize".
 *   "onUpdate": A function to execute when the icon is updated
 *   "showFile": Optional. The image file to show, to override imagepicker.showSize option for some reason.
 */
Q.Tool.define("Streams/image/preview", function(options) {
	
	var tool = this;
	if (!options.imagepicker || !options.imagepicker.showSize) {
		throw "Streams/image/preview tool: missing options.imagepicker.showSize";
	}
	var parts = options.imagepicker.showSize.split('x');
	if (parts[0]) {
		this.element.style.width = parts[0] + "px";
	}
	if (parts[1]) {
		this.element.style.height = parts[1] + "px";
	}
	var img = document.createElement('img');
	img.setAttribute('alt', 'loading');
	img.setAttribute('src', Q.url(options.throbber));
	img.setAttribute('class', 'Streams_image_preview_loading');
	tool.element.innerHTML = '';
	tool.element.appendChild(img);
	
	Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
		
		function _afterRefresh () {
			if (!stream.testWriteLevel('editPending')) {
				return;
			}
			var ipo = Q.extend({}, options.imagepicker, {
				preprocess: function (callback) {
					if (tool.state.streamName) {
						return Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err) {
							if (err) {
								return console.warn(err);
							}
							tool.stream = stream;
							callback({subpath: 'streams/' + stream.fields.publisherId + '/' + stream.fields.name});
						});
					}
					Q.Streams.create({
						publisherId: options.publisherId,
						type: 'Streams/image'
					}, function (err) {
						if (err) {
							return console.warn(err);
						}
						tool.state.publisherId = stream.publisherId;
						tool.state.streamName = stream.name;
						tool.stream = stream;
						callback({subpath: 'streams/' + stream.publisherId + '/' + stream.name});
					}, tool.state.related);
				},
				onSuccess: function (data, key) {
					Q.Streams.Message.wait(
						tool.state.publisherId,
						tool.state.streamName,
						-1,
						function () {
							tool.state.onUpdate.handle.call(tool, data);
						}
					);
				}
			});
			tool.$('img').plugin('Q/imagepicker', ipo);
		}
		
		if (err) {
			return console.warn(err);
		}
		var stream = this;
		

		if (!options.imagepicker.saveSizeName) {
			options.imagepicker.saveSizeName = {}
			Q.each(Q.Streams.image.sizes, function (i, size) {
				options.imagepicker.saveSizeName[size] = size;
			});
		}
		tool.stream = stream;
		tool.refresh(_afterRefresh);
		stream.onFieldChanged('icon').set(function () {
			tool.refresh(_afterRefresh);
		});
	});
},

{
	related: null,
	editable: false,
	imagepicker: {},
	showFile: null,
	template: {
		dir: 'plugins/Streams/views',
		name: 'Streams/image/preview/tool',
		fields: {
			alt: 'image',
			titleClass: '',
			titleTag: 'h2'
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
		var fields = Q.extend({}, state.template.fields, {
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
			state.template
		);
	}
}

);

Q.Template.set(
	'Streams/image/preview/tool',
	'<img src="{{& src}}" alt="{{alt}}" class="Streams_image_preview_icon">'
	+ '<div class="{{titleClass}}"><{{titleTag}}>{{& inplace}}</{{titleTag}}></div>'
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