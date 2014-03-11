Q.Tool.define("Websites/seo", function () {
	var Websites = Q.plugins.Websites;
	var tool = this, state = tool.state;
	
	Q.addScript("plugins/Q/js/sha1.js", function () {
		var publisherId = Websites.userId,
			streamName = "Websites/seo/"+CryptoJS.SHA1(Q.info.uriString),
			ipo = Q.extend({
				publisherId: publisherId,
				streamName: streamName,
				inplaceType: 'text'
			}, state.inplace);
		
		var templateFields = {
			url: tool.setUpElementHTML('div', 'Streams/inplace', Q.extend({attribute: 'url'}, ipo)),
			title: tool.setUpElementHTML('div', 'Streams/inplace', Q.extend({attribute: 'title'}, ipo)),
			keywords: tool.setUpElementHTML('div', 'Streams/inplace', Q.extend({attribute: 'keywords'}, ipo)),
			description: tool.setUpElementHTML('div', 'Streams/inplace', Q.extend({attribute: 'description'}, ipo))
		};
		
		Q.Streams.get(publisherId, streamName, function _proceed(err) {
			if (err) {
				if (Q.getObject([1, 0, 0, 'classname'], arguments) !== "Q_Exception_MissingRow") {
					return console.warn(err);
				}
				Q.req("Websites/seo", ['stream'], function (err, data) {
					var msg = Q.firstErrorMessage(err) || Q.firstErrorMessage(data && data.errors);
					if (msg) {
						var args = [err, data];
						return console.warn("POST to Websites/seo: "+ msg);
					}
					Q.Streams.construct(Q.getObject('slots.stream', data), {}, function (err) {
						_proceed.call(this, err);
					});
				}, {
					method: 'post',
					fields: {streamName: streamName, uri: Q.info.uriString}
				});
			}
			Q.Template.render(
				'Websites/seo',
				templateFields,
				function (err, html) {
					if (err) return;
					tool.element.innerHTML = html;
					Q.activate(tool);
				},
				state.template
			);
		});
	});
},

{
	template: {
		name: 'Websites/seo'
	}
}

);

Q.Template.set("Websites/seo",
	"{{& url}}{{& title}}{{& keywords}}{{& description}}"
);