(function (Q, $) {
	/*
	 * Streams/subscription tool
	 */
	Q.Tool.define('Streams/subscription', function(options) {
		var $el  = $(this.element),
			self = this,
			data = {
				'Q.method' : 'put',
				streamName : options.streamName,
				publisherId: options.publisherId 
			};

		var update = function(){
			Q.request(Q.action('Streams/subscription', data), ['content'], function(){});
		};

		var prettyData = function(){
			if (options.subscribed == 'no') {
				options.subscribed = false;
			} else {
				options.subscribed = true;
			}

			for(var i in options.messageTypes){
				options.messageTypes[i].name = options.messageTypes[i].name.replace(/\//g, ' ').replace('Streams ', '');
			}
		}

		var selectOption = function(listName, value) {
			$el.find('[name='+listName+'] option').each(function(){
				if($(this).val() == value){
					$(this).attr('selected', 'selected');
				}
			});
		};

		var render = function() {
			prettyData();

			Q.Template.render('Streams/subscription/view', options, function (err, html) {
				if (err) {
					return;
				}

				$el.html(html);
				attachEvents();
				$el.find('input, select').each(updateData);

				selectOption('devices', JSON.stringify(options.device));
				options.filter.types 		 && selectOption('messageTypes',  options.filter.types);
				options.filter.notifications && selectOption('stoppingAfter', options.filter.notifications);
			});
		};

		/*
		* called with $node
		*/
		var updateData = function(){
			var val = $(this).val();

			if($(this).get(0).type === 'checkbox'){
				val = $(this).is(':checked') ? 'yes' : 'no';
			}

			data[$(this).attr('name')] = val;
		};

		var attachEvents = function() {
			$el.find('input, select').change(function(){
				updateData.apply(this, arguments);
				update();
			});
		};

		this.Q.onInit.set(render, 'Streams/subscription');
	});

	Q.Template.set('Streams/subscription/view',
		'<div class="streams_subscription_container">'+
			'<div class="left w10">'+
				'<input type="checkbox" name="subscribed" {{#subscribed}} checked {{/subscribed}} />'+
			'</div>'+
			'<div class="right w90">'+
				'<b>Participaties</b>'+
				'<br />'+
				'<small>'+
					'Get, real-time updates when<br />'+
					'you are online.'+
				'</small>'+
			'</div>'+
			'<div class="clear"></div>'+
			'<hr />'+
			'<b>'+
				'When I\'m offline</br />'+
				'notify me about'+
			'</b>'+
			'<hr />'+
			'<select name="messageTypes">'+
				'{{#messageTypes}}'+
					'<option value="{{value}}">{{name}}</option>'+
				'{{/messageTypes}}'+
			'</select>'+
			'<br />'+
			'stopping after&nbsp;'+
			'<select name="stoppingAfter">'+
				'<option value="1">1</option>'+
				'<option value="3">3</option>'+
				'<option value="5">5</option>'+
				'<option value="10">10</option>'+
			'</select>'+
			'&nbsp;alerts'+
			'<br />'+
			'send to&nbsp;'+
			'<select name="devices">'+
				'{{#devices}}'+
					'<option value="{{value}}">{{name}}</option>'+
				'{{/devices}}'+
			'</select>'+
			'<hr />'+
			'<select>'+
				'<option>add message type</option>'+
			'</select>'+
		'</div>'
	);
})(Q, jQuery);