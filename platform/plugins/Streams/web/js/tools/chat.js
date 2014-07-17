(function (Q, $) {
	var store = {
		messages: function(){
			return [11];	
		}
	};

	/*
	* Streams/chat
	*/
	Q.Tool.define('Streams/chat', function(options) {
		this.Q.onInit.set(this.initialize, 'Streams/chat');
	}, {
		// options
	}, {
		initialize: function(){
			this.render();
			this.renderMessages();
		},

		render: function(){
			var $el = $(this.element);

			Q.Template.render('Streams/chat/main', this.options, function(error, html){
				if (error) { return error; }
				$el.html(html);
			});
		},

		renderMessages: function(){
			var $el      = $(this.element),
				messages = store.messages();

			if (!!messages.length) {
				Q.Template.render('Streams/chat/message-item', messages, function(error, html){
					if (error) { return error; }
					$el.find('.messages-container').append(html);
				});
			} else {
				Q.Template.render('Streams/chat/no-messages', function(error, html){
					if (error) { return error; }
					$el.find('.messages-container').html(html);
				});
			}
		},

		addEvents: function(){
			var opt = this.options;

			Q.Streams.Stream.onMessage(opt.publisherId, opt.streamName, 'Streams/chat/message').set(function(stream, message) {
				console.log('*******************************************');
				console.log(message);
				console.log('*******************************************');
			}, 'Streams.chat');
		}
	});

	Q.Template.set('Streams/chat/message-item',
		'<div class="message-item Q_w100">'+
			'<div class="Q_w20 Q_left">'+
				'avatar'+
			'</div>'+
			'<div class="Q_w60 Q_right">'+
				'message from'+
			'</div>'+
			'<div class="Q_w20 Q_right">'+
				'date'+
			'</div>'+
			'<div class="Q_clear"></div>'+
			'<div class="Q_w100">'+
				'message text'+
			'</div>'+
		'</div>'
	);

	Q.Template.set('Streams/chat/no-messages', 
		'<i>No messages</i>'
	);

	Q.Template.set('Streams/chat/main', 
		'<h1>Chat {{streamName}}</h1>'+
		'<div class="Q_clear"></div>'+
		'<div class="messages-container Q_w100">'+

		'</div>'+
		'<textarea class="message-text Q_w100" placeholder="Write your message"></textarea>'+
		'<hr />'+
		'<button class="Q_right">Send</button>'+
		'<div class="Q_clear"></div>'
	);
})(Q, jQuery);