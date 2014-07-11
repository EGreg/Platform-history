(function (Q, $) {
	/*
	 * Streams/subscription tool
	 */
	Q.Tool.define('Streams/subscription', function(options) {
		var $el   = $(this.element),
			self  = this,
			types = options.messageTypes.slice(0);

		var render = function(params) {
			prettyData();

			Q.Template.render('Streams/subscription/view', options, function (errors, html) {
				if (errors) {
					return;
				}

				$el.html(html);

				/*
				* in future that code can works in template parser
				*/
				for (var i=0; i<options.items.length; ++i) {
					/*
					* Select option
					*/
					$el.find(
						'.notification-item[data-types="'+options.items[i].filter.types+'"] '+
						'[name=stoppingAfter] '+
						'option[value='+options.items[i].filter.notifycations+']').attr('selected', 'selected');
				
					/*
					* remove selected types in list "add message type"
					*/
					$el.find('.add option[data-name="'+options.items[i].filter.labels+'"]').remove();
					popType(options.items[i].filter.types);
				}

				if ($el.find('.add option').length == 1) {
					$el.find('.add').hide();
				} else {
					$el.find('.add').show();
				}

				attachEvents();

				if (params && params.isSaved) {
					update();
				}
			});
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

		var update = function(){
			Q.request(Q.action('Streams/subscription', {
				'Q.method'       : 'put',
				'updateTemplate' : true,
				'subscribed'     : $el.find('[name=subscribed]').is(':checked') ? 'yes' : 'no',
				'streamName'     : options.streamName,
				'publisherId'    : options.publisherId,
				'items'          : JSON.stringify(options.items.slice(0))
			}), ['content'], function(){});
		};

		var selectOption = function(listName, value, $node) {
			if (!$node) {
				$node = $el;
			}

			$node.find('[name='+listName+'] option').each(function(){
				if($(this).val() == value){
					$(this).attr('selected', 'selected');
				}
			});
		};

		var popType = function(type, data, isDel) {
			if (isDel === undefined) {
				isDel = true;
			}

			if (!data) {
				data = options.messageTypes;
			}

			for (var i in data) {
				if (data[i].value === type) {
					return isDel ? data.splice(i, 1)[0] : data[i];
				}
			}
			return null;
		};

		var popItem = function(type, isDel) {
			if (isDel === undefined) {
				isDel = true;
			}

			for (var i in options.items) {
				if (options.items[i].filter.types === type) {
					return isDel ? options.items.splice(i, 1)[0] : options.items[i];
				}
			}
		};

		var attachEvents = function() {
			if (arguments.callee.isCall) {
				return false;
			}
			arguments.callee.isCall = true;

			$el.find('[name=subscribed]').live('change', function(){
				options.subscribed = $(this).is(':checked') ? 'yes' : 'no';
				render({ isSaved: true });
			});

			$el.find('[name=stoppingAfter]').live('change', function(){
				var types = $(this).parents('.notification-item').data('types');

				popItem(types, false).filter.notifycations = $(this).val();
				update();
			});

			$el.find('.remove').live('click', function(){
				var $container = $(this).parents('.notification-item'),
					typeName   = $container.data('types');

				var typeItem = popType(typeName, types, false);
				if (typeItem) {
					// add deleted "type" to initial array
					options.messageTypes.push(typeItem);					
				}
				popItem(typeName);
				render({ isSaved: true });
			});

			$el.find('.add').live('change', function(){
				var item = popType($(this).val());

				if (!item) {
					return false;
				}

				options.items.push({
					deliver: $el.find('[name=devices]').val(),
					filter : {
						types 		 : item.value,
						labels		 : item.name,
						notifycations: 1
					}
				});

				render({ isSaved: true });
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
			'{{#subscribed}}'+
				'<hr />'+
				'<b>'+
					'When I\'m offline</br />'+
					'notify me about'+
				'</b>'+
				'<br />'+
				'send to&nbsp;'+
				'<select name="devices">'+
					'{{#devices}}'+
						'<option value="{{value}}">{{name}}</option>'+
					'{{/devices}}'+
				'</select>'+
				'<div class="notifycations"></div>'+
				'<hr />'+
				'{{#items}}'+
					'<div class="notification-item" data-types="{{filter.types}}">'+
						'<b class="left w90 messageType" data-value="{{filter.types}}">'+
							'{{filter.labels}}'+
						'</b>'+
						'<div class="right w10 remove">'+
							'x'+
						'</div>'+
						'<div class="clear"></div>'+
						'stopping after&nbsp;'+
						'<select name="stoppingAfter">'+
							'<option value="1">1</option>'+
							'<option value="3">3</option>'+
							'<option value="5">5</option>'+
							'<option value="10">10</option>'+
						'</select>'+
						'&nbsp;alerts'+
						'<hr />'+
					'</div>'+
				'{{/items}}'+
				'<select class="add">'+
					'<option selected>add message type</option>'+
					'{{#messageTypes}}'+
						'<option value="{{value}}" data-name="{{name}}">{{name}}</option>'+
					'{{/messageTypes}}'+
				'</select>'+
			'{{/subscribed}}'+
		'</div>'
	);
})(Q, jQuery);