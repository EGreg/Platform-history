(function (Q, $) {
	
	/*
	* Streams/chat
	*/
	Q.Tool.define('Streams/chat', function(options) {
		this.Q.onInit.set(this.initialize, 'Streams/chat');
	}, 
	
	{
		templates: {
			main: {
				dir: 'plugins/Streams/views',
				name: 'Streams/chat/main',
				fields: { }
			},
			noMessages: {
				dir: 'plugins/Streams/views',
				name: 'Streams/chat/noMessages',
				fields: { }
			},
			message: {
				item: {
					dir: 'plugins/Streams/views',
					name: 'Streams/chat/message/item',
					fields: {  }
				},
				notification: {
					dir: 'plugins/Streams/views',
					name: 'Streams/chat/message/notification',
					fields: { }
				},
				error: {
					dir: 'plugins/Streams/views',
					name: 'Streams/chat/message/error',
					fields: {
						text: {
							notLoggedIn: "You are not logged in",
							notAuthorized: "You are not authorized"
						}
					}
				}
			}
		}
	}, 
	
	{
		initialize: function(){
			var tool = this;
			var state = this.state;

			if (Q.info.formFactor === 'desktop') {
				state.loadMore = 'click';
			}

			this.prettyData();
			this.render(function(){
				tool.renderMessages();
				tool.scrollBottom();
				tool.addEvents();
			});
		},

		prettyData: function() {
			var state = this.state;
			state.more = {};
			if (state.loadMore == 'click') {
				state.more.isClick = true;
			} else if (state.loadMore == 'scroll') {
				state.more.isScroll = true;
			}
		},

		prettyMessages: function(messages){
			var res  = [];
			var tool = this;
			var state = tool.state;

			if (messages.content) { // one message
				res.push(parseMessage(messages));
			} else { // more messages
				for(var i in messages) {
					if (messages[i].content) {
						res.push(parseMessage(messages[i]));
					}
				}
			}

			return res;

			function sliceContent(content) {
				if (content.length > state.messageMaxHeight) {
					return content.slice(0, state.messageMaxHeight) + '..';
				}

				return content;
			};

			function parseMessage(message) {
				var data = {
					fullContent: message.content, 
					content    : sliceContent(message.content),
					date       : tool.parseDate(message.sentTime),
					byUserId   : message.byUserId,
					ordinal    : message.ordinal,
					_class     : ''
				};

				if (data.content.length > state.messageMaxHeight) {
					data._class = 'Q_ellipsis'
				}

				if (message.byUserId === state.userId) {
					data._class += ' with-me';
				} else {
					data._class += ' to-me';
				}

				return data;
			};
		},

		render: function(callback){
			var $el = $(this.element);
			var state = this.state;

			var fields = Q.extend({
				isClick: state.more.isClick
			}, state.templates.main.fields);
			Q.Template.render(
				'Streams/chat/main',
				fields,
				function(error, html){
					if (error) { return error; }
					$el.html(html);

					callback && callback();
				},
				state.templates.main
			);
		},

		renderMessages: function(messages){
			var $el  = $(this.element);
			var tool = this;
			var state = this.state;

			if (messages && !$.isEmptyObject(messages) && $.isArray(messages)) {
				for (var i=0; i<messages.length; ++i) {
					// is set this message
					if (this.getOrdinal(false, messages[i].ordinal)) {
						continue;
					}

					Q.Template.render(
						'Streams/chat/message/item', 
						messages[i], 
						function(error, html){
							if (error) { return error; }
                        	
							$el.find('.noMessages').remove();
							var $html = $(html);
                        	
							Q.activate($html.find('.avatar-container').html(
								Q.Tool.setUpElement('div', 'Users/avatar', {
									userId: messages[i].byUserId
								})
							));
                        	
							$el.find('.messages-container').append($html);
							tool.findMessage('last')
								.find('.date')
								.html(Q.Tool.setUpElement('div', 'Q/timestamp', messages[i].date))
								.activate();
                        	
							// sort by ordinal
							$el.find('.message-item').sort(function(curr, next){
								if ($(curr).data('ordinal') > $(next).data('ordinal')) {
									return 1;
								} else if ($(curr).data('ordinal') < $(next).data('ordinal')) {
									return -1;
								}
                        	
								return 0;
							}).detach().appendTo($el.find('.messages-container'));
						},
						state.templates.message.item
					);
				}
			} else {
				Q.Template.render(
					'Streams/chat/noMessages', 
					function(error, html){
						if (error) { return error; }
						$el.find('.messages-container').html(html);
					},
					state.templates.noMessages
				);
			}
		},

		renderNotification: function(message){
			var $container = $('<div>');
			Q.activate($container.html(Q.Tool.setUpElement('div', 'Users/avatar', { userId: message.byUserId })), function(){
				var data = {
					username: $container.find('.Users_avatar_contents').text()
				};

				Q.Template.render(
					'Streams/chat/message/notification', 
					data, 
					function(error, html){
						if (error) { return error }
						
						$el.find('.noMessages').remove();
						$el.find('.messages-container').append(html);
					},
					state.templates.message.notification
				);
			});
		},

		renderError: function(msg, err, data){
			var $el  = $(this.element);
			var tool = this;
			var state = tool.state;

			if (!msg) return;
			var fields = {
				error: {},
				date : this.parseDate({ expression: 'CURRENT_TIMESTAMP' })
			};

			Q.Template.render(
				'Streams/chat/message/error', 
				{
					errorText: msg,
					data: data
				}, 
				function(error, html){
					if (error) { return error; }
        	
					$el.find('.noMessages').remove();
					$el.find('.messages-container').append(html);
        	
					tool.findMessage('last')
						.find('.date')
						.html(Q.Tool.setUpElement('div', 'Q/timestamp', data.date))
						.activate();
				},
				state.templates.message.error
			);
		},

		more: function(callback){
			var tool = this;
			var state = tool.state;
			var params = {
				max  : this.getOrdinal(0, 'first') - 1,
				limit: state.messagesToLoad
			};

			Q.jsonRequest.options.quiet = true;
			Q.Streams.Message.get(state.publisherId, state.streamName, params,
			function(err, messages){
				Q.jsonRequest.options.quiet = false;
				if (err) {
					return;
				}

				callback.call(tool, messages);
			}, {
				'type': 'Streams/chat/message',
				'ascending': true
			});
		},

		addEvents: function(){
			var tool    = this,
				$el     = $(this.element),
				state   = this.state,
				blocked = false;

			/*
			* get more messages
			*/
			function renderMore(messages) {
				messages = tool.prettyMessages(messages);
				if (!!messages.length) {
					tool.renderMessages(messages);
					tool.scrollTop();
				}
			};

			if (state.more.isClick) {
				$el.find('.more').click(function(){
					tool.more(renderMore);
				});
			} else {
				this.niceScroll(function(){
					tool.more(renderMore);
				});
			}

			$el.find('.Q_ellipsis .message-item-text').live('click', function(){
				var $container = $(this).parents('.message-item'),
					username   = $container.find('.Users_avatar_contents').text();

				if ($container.data('byuserid') === state.userId) {
					username = 'me';
				}

				Q.Dialogs.push({
					title  : 'Message from ' + username,
					content: '<div class="Streams_popup_content">' + $container.data('content') + '</div>'
				});
			});

			// new message arrived
			Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/chat/message')
			.set(function(stream, message) {
				tool.renderMessages(tool.prettyMessages(message));
				tool.scrollBottom();
			}, 'Streams/chat');

			// new user joined
			Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/join')
			.set(function(stream, message) {
				message = tool.prettyMessages(message);
				message.action = { join: true };

				tool.renderNotification(message);
				tool.scrollBottom();
			}, 'Streams/chat');

			// new user left
			Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/leave')
			.set(function(stream, message) {
				message = tool.prettyMessages(message);
				message.action = { leave: true };

				tool.renderNotification(tool.prettyMessages(message), 'leave');
				tool.scrollBottom();
			}, 'Streams/chat');

			/*
			* send message
			*/
			$el.find('.message-text').keypress(function(event){
				if (event.charCode == 13) {
					if (blocked) {
						return false;
					}

					var content = $el.find('.message-text').val().trim();
					$el.find('.message-text').val('');
					if (content.length == 0) {
						return false;
					}

					Q.jsonRequest.options.quiet = true;
					blocked = true;					

					Q.Streams.Message.post({
						'publisherId': state.publisherId,
						'streamName' : state.streamName,
						'type'       : 'Streams/chat/message',
						'content'    : content
					}, function(err, args) {
						if (err) {
							tool.renderError(err, args[0], args[1]);
						}
						Q.jsonRequest.options.quiet = false;
						blocked = false;
					});

					return false;
				}
			});
		},

		niceScroll: function(callback) {
			if (Q.info.formFactor === 'desktop') {
				return false;
			}

			// TODO - when user scrolled in message container not running this function
			var isScrollNow = false,
				startY      = null,
				$el         = $(this.element);

			function touchstart(event){
				isScrollNow = true;
				startY      = event.originalEvent.touches[0].pageY;
			};

			function touchend(event){
				isScrollNow = false;
				startY      = null;
			};

			$(document.body)
				.bind('touchstart', touchstart)
				.bind('touchend', touchend)
				.bind('touchmove', function(event){

				if (isScrollNow && event.originalEvent.touches[0].pageY > startY) {
					// isset scollbar in window
					if (0 > $(window).height() - $(document.body).height()) {
						$(document.body)
							.unbind('touchstart')
							.unbind('touchend')
							.unbind('touchmove');

						$el.find('.messages-container').scroll(function(event){
							if ($(this).scrollTop() == 0) {
								callback && callback();
							}
						});
					} else {
						callback && callback();
					}
				}
			});
		},

		/*
		* @params date
		* 	string of date
		*	object of date
		* 	object { expression: 'CURRENT_TIMESTAMP' }
		*/
		parseDate: function(date){
			if (typeof date == 'string') {
				return { time: parseTime(date) };
			} else if (typeof date == 'object'){
				if (date.expression == 'CURRENT_TIMESTAMP') {
					return {};
				} else {
					return { time: parseTime(date.expression) };
				}
			}

			return {};

			function parseTime(date){
				return (new Date(date)).getTime() / 1000;
			}
		},

		getOrdinal: function(action, ordinal){
			if (ordinal) {
				ordinal = 'data-ordinal='+ordinal;
			}

			var data = this.findMessageData.call(this, action, ordinal);
			return data ? data.ordinal : null;
		},

		/*
		* find by options [first, last] or/and param
		* or only by param
		* @return data attribute or null 
		*/
		findMessageData: function(action, byParam){
			var message = this.findMessage(action, byParam);
			return message ? message.data() : null;
		},

		findMessage: function(action, byParam) {
			var $el = $(this.element),
				query = '.message-item';

			byParam = (byParam ? '['+byParam+']' : '');

			if (!action && byParam) {
				return $el.find(query+byParam);
			}

			if (typeof(action) == 'string') {
				switch(action){
					case 'first':
					case 'last':
						return $el.find(query+':'+action+byParam);
				}
			} else if (typeof(action) == 'number') {
				var messages = $el.find(query+byParam);
				return messages.length <= action ? $(messages.get(action)) : null;
			}

			return null;
		},

		scrollBottom: function() {
			$(this.element).find('.messages-container').animate({ scrollTop: $(document).height() }, '300');
		},

		scrollTop: function() {
			$(this.element).find('.messages-container').animate({ scrollTop: -$(document).height() }, '300');	
		}
	});

	Q.Template.set('Streams/chat/message/item',
		'<div class="message-item Q_w100 {{#_class}} {{_class}} {{/_class}}" '+
				'data-content="{{fullContent}}" '+
				'data-byUserId="{{byUserId}}" '+
				'data-ordinal="{{ordinal}}">'+
			'<div class="Q_w20 avatar-container"></div>'+
			'<div class="Q_w100 message-text-container">'+
				'<div class="message-tick"></div>'+
				'<div class="message-item-text">{{content}}</div>'+
				'<div class="Q_clear"></div>'+
				'<div class="Q_w20 Q_right date"></div>'+
				'<div class="Q_clear"></div>'+
			'</div>'+
			'<div class="Q_clear"></div>'+
		'</div>'
	);

	Q.Template.set('Streams/chat/message/notification', 
		'<div class="chat-notification>'+
			'{{#action.join}}'+
				'<b>{{username}}</b> joined the chat'+
			'{{/action.join}}'+
			'{{#action.leave}}'+
				'<b>{{username}}</b> left the chat'+
			'{{/action.leave}}'+
		'</div>'
	);
	
	Q.Template.set('Streams/chat/message/error',
		'<div class="message-item Q_w100 error">'+
			'<div class="Q_w100 message-text-container">'+
				'<div class="message-item-text">'+
					'{{errorText}}'+
				'</div>'+
				'<div class="Q_clear"></div>'+
				'<div class="Q_w20 Q_right date"></div>'+
				'<div class="Q_clear"></div>'+
			'</div>'+
			'<div class="Q_clear"></div>'+
		'</div>'
	);

	Q.Template.set('Streams/chat/noMessages', '<i class="noMessages">No messages</i>');

	Q.Template.set('Streams/chat/main', 
		'<div class="Q_clear"></div>'+
		'{{#isClick}}'+
			'<div class="more Q_w100">More messages</div>'+
		'{{/isClick}}'+
		'<div class="messages-container">'+
			'<!-- messages -->'+
		'</div>'+
		'<textarea class="message-text Q_w100" placeholder="Write your message"></textarea>'+
		'<hr />'+
		'<div class="Q_clear"></div>'
	);
})(Q, jQuery);