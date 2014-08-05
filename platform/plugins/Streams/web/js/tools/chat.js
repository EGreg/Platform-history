(function (Q, $) {
	
/**
 * Streams Tools
 * @module Streams-tools
 */

/**
 * Chatroom for people chat in a stream that allows posting messages with type "Streams/chat/message"
 * @class Streams chat
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.publisherId] Required if stream option is empty. The publisher's user id.
 *   @param {String} [options.streamName] Required if stream option is empty. The stream's name.
 *   @param {Stream} [options.stream] Optionally pass a Streams.Stream object here if you have it already
 *   @param {String} [options.messageMaxHeight] The maximum height, in pixels, of a rendered message
 *   @param {String} [options.messagesToLoad] The number of "Streams/chat" messages to load at a time.
 *   @param {Object} [options.loadMore] May be "scroll", "click" or null/false. Defaults to "scroll".
 *     <ul>
 *         <li>"click" will show label with "Click to see earlier messages" (configurable in Q.text.Streams.chat.loadMore.click string), and when the user clicks it, new messages will be loaded.</li>
 *         <li>"scroll" means new messages will be loaded when the scrollbar of the chat container reaches the top (for desktop) or whole document scrollbar reaches the top (android). On all other browsers it would use pull-to-refresh ... meaning, it will show "Pull to see earlier messages" (html configurable in Q.text.Streams.chat.loadMore.pull string) and as you pull "too far" you trigger the load. As for the indicator of "pulling too far", we will worry about that later, for now skip it. But remember to discuss it with me afterwards.</li>
 *         <li>null/false/etc. - no interface to load earlier messages</li>
 *     </ul>
 *   @param {Q.Event} [options.onError] Event for when an error occurs, and the error is passed
 */
Q.Tool.define('Streams/chat', function(options) {		
	function _construct(err, stream, extra) {
		if (err) {
			return Q.handle(state.onError, this, [err]);
		}
		var stream = state.stream = this;
		state.publisherId = stream.fields.publisherId;
		state.streamName = stream.fields.name;
		tool.render(function() {
			tool.renderMessages(tool.prettyMessages(extra.messages), function (snippets) {
				var $te = $(tool.element);
				Q.each(snippets, function (key, html) {
					var $html = $(html);
					$te.find('.Streams_chat_noMessages').remove();
					$html.find('.Streams_chat_avatar').each(function () {
						Q.Tool.setUpElement(this, 'Users/avatar', {
							userId: $(this).attr('data-byUserId')
						}, null, tool.prefix);
					});
					$html.find('.Streams_chat_timestamp').each(function () {
						Q.Tool.setUpElement(this, 'Q/timestamp', {
							time: $(this).attr('data-time')
						}, null, tool.prefix);
					});
					var $mc = $te.find('.Streams_chat_messages'); 
					$html.appendTo($mc).activate();
				});
			});
			tool.scrollToBottom();
			tool.addEvents();
		});
	}
	var tool = this;
	var state = tool.state;
	state.more = {};
	switch (state.loadMore) {
		case 'click': state.more.isClick = true; break;
		case 'scroll': state.more.isScroll = true; break;
		default: break;
	}
	Q.Streams.retainWith(this)
	.get(state.publisherId, state.streamName, _construct, {
		messages: state.messagesToLoad
	});
	//tool.Q.onInit.set(_init, "Streams/chat");
}, 

{
	messageMaxHeight: '200px',
	messagesToLoad: 10,
	loadMore: 'click',
	templates: {
		main: {
			dir: 'plugins/Streams/views',
			name: 'Streams/chat/main',
			fields: { placeholder: "Add a comment" }
		},
		Streams_chat_noMessages: {
			dir: 'plugins/Streams/views',
			name: 'Streams/chat/Streams_chat_noMessages',
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
	prettyMessages: function(messages){
		var res  = [];
		var tool = this;
		var state = tool.state;
		
		if (messages.content) {
			// this is a single message
			var m = messages;
			messages = {};
			messages[m.ordinal] = m;
		}

		for (var ordinal in messages) {
			var message = messages[ordinal];
			if (!message.content) {
				return;
			}
			res.push({
				content    : message.content,
				time       : new Date(message.sentTime).getTime() / 1000,
				byUserId   : message.byUserId,
				ordinal    : message.ordinal,
				classes    : (message.byUserId === state.userId)
								? ' Streams_chat_from_me'
								: ' Streams_chat_to_me'
			});
		}

		return res;
	},

	render: function(callback){
		var $te = $(this.element);
		var state = this.state;

		var fields = Q.extend({}, state.more, state.templates.main.fields);
		Q.Template.render(
			'Streams/chat/main',
			fields,
			function(error, html){
				if (error) { return error; }
				$te.html(html);

				callback && callback();
			},
			state.templates.main
		);
	},

	renderMessages: function(messages, callback){
		var $te  = $(this.element);
		var tool = this;
		var state = this.state;

		if (Q.isEmpty(messages)) {
			return Q.Template.render(
				'Streams/chat/Streams_chat_noMessages', 
				function(error, html){
					if (error) { return error; }
					$te.find('.Streams_chat_messages').html(html);
				},
				state.templates.Streams_chat_noMessages
			);
		}
		
		function _processMessage(ordinal, message) {
			// TODO: in the future, render stream players inside message template
			// according to the instructions in the message
			Q.Template.render(
				'Streams/chat/message/item',
				message,
				p.fill(ordinal)
			);
			ordinals.push(ordinal);
		}
		var p = new Q.Pipe();
		var ordinals = [];
		Q.each(messages, _processMessage, {ascending: true});
		p.add(ordinals, 1, function (params) {
			var snippets = {};
			for (var ordinal in params) {
				snippets[ordinal] = params[ordinal][1];
			}
			callback(snippets, messages);
		}).run();
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
					
					$te.find('.Streams_chat_noMessages').remove();
					$te.find('.Streams_chat_messages').append(html);
				},
				state.templates.message.notification
			);
		});
	},

	renderError: function(msg, err, data){
		var $te  = $(this.element);
		var tool = this;
		var state = tool.state;

		if (!msg) return;
		var fields = {
			errorText: msg,
			time: Date.now() / 1000
		};

		Q.Template.render(
			'Streams/chat/message/error', 
			fields, 
			function(error, html){
				if (error) { return error; }
    	
				$te.find('.Streams_chat_noMessages').remove();
				$te.find('.Streams_chat_messages').append(html);
    	
				tool.findMessage('last')
					.find('.Streams_chat_timestamp')
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
			limit: state.messagesToLoad,
			type: "Streams/chat"
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
			$te     = $(this.element),
			state   = this.state,
			blocked = false;

		/*
		* get more messages
		*/
		function renderMore(messages) {
			messages = tool.prettyMessages(messages);
			if (!!messages.length) {
				tool.renderMessages(messages, function (snippets) {
					$te.find('.Streams_chat_noMessages').remove();
					var $mc = $te.find('.Streams_chat_messages'); 
					Q.each(snippets, function (key, html) {
						$(html).prependTo($mc).activate();
					}, {ascending: false});
				});
				tool.scrollTop();
			}
		};

		if (state.more.isClick) {
			$te.find('.Streams_chat_more').click(function(){
				tool.more(renderMore);
			});
		} else {
			this.niceScroll(function(){
				tool.more(renderMore);
			});
		}

		$te.find('.Streams_chat_message').live('click', function(){
			var $container = $(this).parents('.Streams_chat_item'),
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
			tool.renderMessages(tool.prettyMessages(message), function (snippets) {
				$te.find('.Streams_chat_noMessages').remove();
				var $mc = $te.find('.Streams_chat_messages'); 
				Q.each(snippets, function (key, html) {
					$(html).appendTo($mc).activate();
				}, {ascending: true});
			});
			tool.scrollToBottom();
		}, 'Streams/chat');

		// new user joined
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/join')
		.set(function(stream, message) {
			message = tool.prettyMessages(message);
			message.action = { join: true };

			tool.renderNotification(message);
			tool.scrollToBottom();
		}, 'Streams/chat');

		// new user left
		Q.Streams.Stream.onMessage(state.publisherId, state.streamName, 'Streams/leave')
		.set(function(stream, message) {
			message = tool.prettyMessages(message);
			message.action = { leave: true };

			tool.renderNotification(tool.prettyMessages(message), 'leave');
			tool.scrollToBottom();
		}, 'Streams/chat');

		/*
		* send message
		*/
		$te.find('.message-text').keypress(function(event){
			if (event.charCode == 13) {
				if (blocked) {
					return false;
				}

				var content = $te.find('.message-text').val().trim();
				$te.find('.message-text').val('');
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
					state.stream.refresh(null, {messages: true});
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
			$te         = $(this.element);

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

					$te.find('.Streams_chat_messages').scroll(function(event){
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
		var $te = $(this.element),
			query = '.Streams_chat_item';

		byParam = (byParam ? '['+byParam+']' : '');

		if (!action && byParam) {
			return $te.find(query+byParam);
		}

		if (typeof(action) == 'string') {
			switch(action){
				case 'first':
				case 'last':
					return $te.find(query+':'+action+byParam);
			}
		} else if (typeof(action) == 'number') {
			var messages = $te.find(query+byParam);
			return messages.length <= action ? $(messages.get(action)) : null;
		}

		return null;
	},

	scrollToBottom: function() {
		$(this.element).find('.Streams_chat_messages').animate({ scrollTop: $(document).height() }, '300');
	},

	scrollTop: function() {
		$(this.element).find('.Streams_chat_messages').animate({ scrollTop: -$(document).height() }, '300');	
	}
});

Q.Template.set('Streams/chat/message/item',
	'<div class="Streams_chat_item {{classes}}" '+
			'data-byUserId="{{byUserId}}" '+
			'data-ordinal="{{ordinal}}">'+
		'<div class="Streams_chat_avatar" data-byUserId="{{byUserId}}"></div>'+
		'<div class="Streams_chat_bubble">'+
			'<div class="Streams_chat_tick"></div>'+
			'<div class="Streams_chat_message">{{content}}</div>'+
			'<div class="Q_clear"></div>'+
			'<div class="Streams_chat_timestamp" data-time="{{time}}"></div>'+
			'<div class="Q_clear"></div>'+
		'</div>'+
		'<div class="Q_clear"></div>'+
	'</div>'
);

Q.Template.set('Streams/chat/message/notification', 
	'<div class="Streams_chat_notification>'+
		'{{#action.join}}'+
			'<b>{{username}}</b> joined the chat'+
		'{{/action.join}}'+
		'{{#action.leave}}'+
			'<b>{{username}}</b> left the chat'+
		'{{/action.leave}}'+
	'</div>'
);

Q.Template.set('Streams/chat/message/error',
	'<div class="Streams_chat_item Q_error">'+
		'<div class="Streams_chat_container">'+
			'<div class="Streams_chat_error">'+
				'{{errorText}}'+
			'</div>'+
			'<div class="Q_clear"></div>'+
			'<div class="Streams_chat_timestamp" data-time="{{time}}"></div>'+
			'<div class="Q_clear"></div>'+
		'</div>'+
		'<div class="Q_clear"></div>'+
	'</div>'
);

Q.Template.set('Streams/chat/Streams_chat_noMessages', '<i class="Streams_chat_noMessages">No messages</i>');

Q.Template.set('Streams/chat/main', 
	'<div class="Q_clear"></div>'+
	'{{#isClick}}'+
		'<div class="Streams_chat_more">More messages</div>'+
	'{{/isClick}}'+
	'<div class="Streams_chat_messages">'+
		'<!-- messages -->'+
	'</div>'+
	'<div class="Streams_chat_composer">'+
		'<textarea class="message-text" placeholder="{{placeholder}}"></textarea>'+
	'</div>'+
	'<hr />'+
	'<div class="Q_clear"></div>'
);

})(Q, jQuery);