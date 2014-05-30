(function (Q, $) {

/*
 * Streams/chat tool.
 * @param options Object
 * A hash of options, which can include:
 *   "publisherId": Required. Publisher id of the stream to get messsages from.
 *   "streamName": Required. Name of the stream to get messsages from.
 *   "loadMore": Optional. May have one these values: 'scroll', 'click' or 'pull' which indicates what kind of algorithm
 *     will be used for loading new messages. 'scroll' means that new messages will be loaded when scrollbar
 *     of the chat cointainer reaches the top (for desktop) or whole document scrollbar reaches the top (for android).
 *     'click' will show label with 'Click to see earlier messages' and when user clicks it, new messages will be loaded.
 *     Finally, 'pull' implements 'pull-to-refresh' behavior used in many modern applications today when new messages
 *     loaded by rubber-scrolling the container by more amount than it actually begins.
 *     Defaults to 'scroll' for desktop and Android devices and 'pull' for iOS devices.
 *   "amountToLoad": Optional. Amount of messages to load on each request. Defaults to 3.
 */
Q.Tool.define("Streams/chat", function _Streams_chat_constructor (options) {
	var o = Q.extend({
		'loadMore': (Q.info.isTouchscreen && Q.info.platform != 'android') ? 'pull' : 'scroll',
		'amountToLoad': 3
	}, options);
	
	var tool = this, $this = $(this.element);
	tool.valid = true;
	if (!(o.streamName && o.publisherId))
	{
		tool.valid = false;
		return;
	}
	$('.Streams_chat_no_messages', this.element).html(Q.text.Streams.chat.noMessages);
	$this.data('Streams_chat_tool_options', o);
	$this.find('.Streams_chat_comment_form').plugin('Q/placeholders');
	if (o.loadMore == 'scroll')
	{
		var chatListingWrapper = $this.find('.Streams_chat_listing_wrapper');
		var latestScrollTop = -1, timePassed = 0;
		tool.scrollCheck = function()
		{
			var scrollHeight = (Q.info.platform == 'android' ? document.body.scrollHeight : chatListingWrapper[0].scrollHeight);
			var containerHeight = (Q.info.platform == 'android' ? window.innerHeight : chatListingWrapper.height());
			var currentScrollTop = (Q.info.platform == 'android' ? document.body.scrollTop : chatListingWrapper.scrollTop());
			if (tool.initiallyScrolled && scrollHeight > containerHeight && !currentScrollTop)
			{
				if (!tool.loadingInProgress)
				{
					// we must ensure that scrollTop doesn't change in a given time interval
					if (latestScrollTop == -1)
					{
						latestScrollTop = currentScrollTop;
						timePassed = o.scrollIntervalMs;
					}
					if (timePassed >= o.scrollStableIntervalMs &&
							latestScrollTop == currentScrollTop)
					{
						latestScrollTop = -1;
						tool.loadingInProgress = true;
						tool.loadMoreMessages($this);
					}
					else
					{
						timePassed += o.scrollIntervalMs;
					}
				}
			}
			else
			{
				latestScrollTop = -1;
			}
		};
		
		Q.Interval.set(function()
		{
			var scrollHeight = (Q.info.platform == 'android' ? document.body.scrollHeight : chatListingWrapper[0].scrollHeight);
			var containerHeight = (Q.info.platform == 'android' ? window.innerHeight : chatListingWrapper.height());
			tool.enableClickToLoad(scrollHeight <= containerHeight);
		}, o.scrollIntervalMs, 'Streams.chat.toggleClickToLoad.interval');
	}
	else if (o.loadMore == 'click')
	{
		tool.enableClickToLoad();
	}
	tool.loadMoreMessages();
	
	tool.$('textarea').on('keydown', function(e)
	{
		if (e.keyCode == 13)
		{
			var $this = $(this);
			$this.attr({ 'disabled': 'disabled' });
			$this.addClass('Streams_chat_textarea_posting');
			var text = $this.val();
			if (text.length > 0)
			{
				var params = {
					'publisherId': o.publisherId,
					'streamName': o.streamName,
					'type': 'Streams/chat/message',
					'content': text
				};
				Q.jsonRequest.options.quiet = true;
				Q.Streams.Message.post(params, function(err, message)
				{
					Q.jsonRequest.options.quiet = false;
					if (err)
					{
						if (err[0] && err[0].message) {
							alert(err[0].message);
						} else {
							alert('An error occured while posting a message, please try again later.');
						}
						console.log(error);
					}
					else
					{
						$this.val('');
						$this.removeAttr('disabled');
						$this.removeClass('Streams_chat_textarea_posting');
					}
				});
			}
		}
	});
	
	Q.Streams.Stream.onMessage(o.publisherId, o.streamName, 'Streams/chat/message').set(function(stream, msg)
	{
		Q.Tool.constructors['Users/avatar'].options.onName.set(function()
		{
			tool.onLayout({ 'chatWidthOnly': true });
		}, 'Users.avatar.onNameResolve');
		tool.addMessage(msg);
	}, 'Streams.chat');
	
	$this.data('Streams_chat_tool_inited', true);
},

{
	scrollIntervalMs: 100,
	scrollStableIntervalMs: 300
},

{
    enableClickToLoad: function _Streams_chat_enableClickToLoad(enabled) {
    	var tool = this, $this = $(tool.element);
    	var trigger = $this.find('.Streams_chat_click_to_load');
    	if (enabled)
    	{
    		trigger.show().on('click.Streams_chat', function()
    		{
    			if (!tool.loadingInProgress)
    			{
    				tool.loadingInProgress = true;
    				tool.loadMoreMessages();
    			}
    		});
    	}
    	else
    	{
    		trigger.hide().off('click.Streams_chat');
    	}
    },
    onLayout: function _Streams_chat_onLayout(options) {
    	var tool = this, $this = $(tool.element);
    	if (!tool.valid) return;

    	if (!(options && options.chatAvailableHeight))
    	{
    		options.chatAvailableHeight = $this.data('Q_previous_available_height');
    		if (!options.chatAvailableHeight) return;
    	}

    	if ($this.data('Streams_chat_tool_inited'))
    	{
    		var o = tool.options, chatPostWidth;
    		if (o !== undefined)
    		{
    			if (options.chatWidthOnly)
    			{
    				chatPostWidth = $this.find('.Streams_chat_listing').width() - $this.find('.Streams_chat_avatar').outerWidth();
    				$this.find('.Streams_chat_post, .Streams_chat_comment_text').css({ 'width': chatPostWidth + 'px' });
    				$this.find('.Streams_chat_comment_text textarea').css({ 'width': (chatPostWidth - 10) + 'px' });
    			}
    			else
    			{
    				if (o.loadMore == 'pull')
    				{
    					var previousHeight = $this.data('Q_previous_available_height');
    					if ((previousHeight === undefined) ||
    							(previousHeight !== undefined && options.chatAvailableHeight != $this.data('Q_previous_available_height')))
    					{
    						$this.css({ 'height': options.chatAvailableHeight + 'px' });
    						if (!tool.loadingTurnedOff)
    						{
    							var pullDownOffset = $this.find('.Streams_chat_pull_down').outerHeight(true);
    							var pullDownIcon = $('.Streams_chat_pull_down_icon');
    							var pullDownLabel = $('.Streams_chat_pull_down_label');
    							$this.plugin('Q/iScroll', 'remove').plugin('Q/iScroll', {
    								y: -10000,
    								useTransition: true,
    								topOffset: pullDownOffset,
    								onRefresh: function()
    								{
    									if (pullDownIcon.hasClass('loading'))
    									{
    										pullDownIcon.removeClass('loading');
    										pullDownLabel.html(pullDownLabel.html().replace(/(Release to load|Loading)/g, 'Pull down to load'));
    									}
    								},
    								onScrollMove: function()
    								{
    									if (this.y > 5 && !pullDownIcon.hasClass('Q_flip'))
    									{
    										pullDownIcon.addClass('Q_flip');
    										pullDownLabel.html(pullDownLabel.html().replace('Pull down', 'Release'));
    										this.minScrollY = 0;
    									}
    									else if (this.y < 5 && pullDownIcon.hasClass('Q_flip'))
    									{
    										pullDownIcon.removeClass('Q_flip');
    										pullDownLabel.html(pullDownLabel.html().replace('Release', 'Pull down'));
    										this.minScrollY = -pullDownOffset;
    									}
    								},
    								onScrollEnd: function()
    								{
    									if (!tool.scrollEndBlocked)
    									{
    										if (pullDownIcon.hasClass('Q_flip'))
    										{
    											pullDownIcon.addClass('loading');
    											pullDownLabel.html(pullDownLabel.html().replace('Release to load', 'Loading'));
    											tool.scrollEndBlocked = true;
    											tool.loadMoreMessages();
    										}
    									}
    								}
    							});
    						}
    					}
    					$this.children('div:last:not(.Streams_chat_listing_wrapper)').css({
    						'top': $this.offset().top + 'px',
    						'height': $this.height() + 'px',
    						'right': '0'
    					});
    					$this.plugin('Q/iScroll', 'refresh');
    				}
    				else if (o.loadMore == 'scroll' && Q.info.platform == 'android')
    				{
    					if (!document.body.scrollTop)
    					{
    						setTimeout(function()
    						{
    							document.body.scrollTop = 10000;
    							tool.initiallyScrolled = true;
    						}, 0);
    					}
    					else
    					{
    						tool.initiallyScrolled = true;
    					}
    					if (Q.Interval.exists('Streams.chat.scroll.interval'))
    					{
    						if ($this.css('visibility') == 'visible' && $this.css('display') == 'block')
    							Q.Interval.resume('Streams.chat.scroll.interval');
    						else
    							Q.Interval.pause('Streams.chat.scroll.interval');
    					}
    					else
    					{
    						if ($this.css('visibility') == 'visible' && $this.css('display') == 'block')
    							Q.Interval.set(tool.scrollCheck, o.scrollIntervalMs, 'Streams.chat.scroll.interval');
    					}
    				}
    				else
    				{
    					var chatListingWrapper = $this.find('.Streams_chat_listing_wrapper');
    					chatListingWrapper.css({ 'height': options.chatAvailableHeight + 'px', 'overflow': 'auto' }).plugin('Q/scrollbarsAutoHide');
    					if (!chatListingWrapper.scrollTop())
    					{
    						setTimeout(function()
    						{
    							chatListingWrapper.scrollTop(chatListingWrapper[0].scrollHeight);
    							tool.initiallyScrolled = true;
    						}, 0);
    					}
    					else
    					{
    						tool.initiallyScrolled = true;
    					}
    					if (!Q.Interval.exists('Streams.chat.scroll.interval'))
    					{
    						Q.Interval.set(tool.scrollCheck, o.scrollIntervalMs, 'Streams.chat.scroll.interval');
    					}
    				}

    				chatPostWidth = $this.find('.Streams_chat_listing').width() - $this.find('.Streams_chat_avatar').outerWidth();
    				$this.find('.Streams_chat_post, .Streams_chat_comment_text').css({ 'width': chatPostWidth + 'px' });
    				$this.find('.Streams_chat_comment_text textarea').css({ 'width': (chatPostWidth - 10) + 'px' });

    				$this.data('Q_previous_available_height', options.chatAvailableHeight);
    			}
    		}
    	}
    	else
    	{
    		Q.Layout.needUpdateOnLoad = true;
    	}
    },
    addMessage: function _Streams_chat_addMessage(message, before) {
    	var tool = this, $this = $(this.element);
    	var o = tool.options;
    	var messageItem = $('<li />');
    	messageItem.addClass('Streams_chat_message Q_clearfix');
    	messageItem.attr({ 'data-ordinal': message.ordinal });
    	messageItem.append('<span class="Streams_chat_date">' + strftime('%m/%d/%y', new Date(message.insertedTime)) + '</span>');
    	var avatarTool = $(Q.makeTool('Users/avatar', { 'user': { 'id': message.byUserId }, 'icon': '40' }));
    	messageItem.append(avatarTool);
    	messageItem.append('<div class="Streams_chat_post"><p>' + message.content + '</p></div>');
    	var listing = $this.find('.Streams_chat_listing');
    	if (before)
    	{
    		if (o.loadMore == 'pull')
    		{
    			listing.find('.Streams_chat_pull_down').after(messageItem);
    		}
    		else
    		{
    			listing.find('.Streams_chat_click_to_load').after(messageItem);
    		}
    	}
    	else
    	{
    		listing.append(messageItem);
    		messageItem.hide();
    		messageItem.hide().show(100);
    		var times = 0;
    		var t = setInterval(function () {
    			if (++times > 15) {
    				clearInterval(t);
    			}
    			listing.parents().each(function () {
    				this.scrollTop = this.scrollHeight;
    			});
    			$('#Streams_chat_textarea').focus();
    		}, 10);
    	}
    	avatarTool.activate();
    },
    setScrollTop: function _Streams_chat_setScrollTop() {
    	var chatListingWrapper = $(this.element).find('.Streams_chat_listing_wrapper');

    	if (Q.info.platform == 'android')
    		document.body.scrollTop = document.body.scrollHeight - document.body.offsetHeight;
    	else
    		chatListingWrapper.scrollTop(chatListingWrapper[0].scrollHeight - chatListingWrapper[0].offsetHeight);
    },
    loadMoreMessages: function _Streams_chat_loadMoreMessages() {
    	var tool = this, $this = $(tool.element);
    	var o = $this.data('Streams_chat_tool_options');
    	var chatListingWrapper = $this.find('.Streams_chat_listing_wrapper');
    	var chatListing = $this.find('.Streams_chat_listing');
    	var firstItem = chatListing.children('.Streams_chat_message:first');
    	var messageItem = null;
    	var oldestOrdinal = 0;

    	if (tool.prefetchedMessages)
    	{
    		$('.Streams_chat_no_messages').hide();

    		var i = 0; c = o.amountToLoad;
    		Q.Tool.constructors['Users/avatar'].options.onName.set(function()
    		{
    			i++;
    			if (i == c)
    			{
    				tool.onLayout({ 'chatWidthOnly': true });
    				if (o.loadMore == 'pull')
    				{
    					$this.plugin('Q/iScroll', 'refresh');
    				}
    				else if (o.loadMore == 'scroll')
    				{
    					tool.setScrollTop();
    				}
    				tool.scrollEndBlocked = false;
    			}
    		}, 'Users.avatar.onNameResolve');

    		Q.each(tool.prefetchedMessages, function(ordinal, msg)
    		{
    			tool.addMessage(msg, true);
    		}, { 'ascending': false, 'numeric': true });

    		$this.find('.Streams_chat_click_to_load').children('.Streams_chat_load_spinner').css({ 'visibility': 'hidden' });

    		firstItem = chatListing.children('.Streams_chat_message:first');
    		oldestOrdinal = parseInt(firstItem.attr('data-ordinal'));
    		tool.prefetchMessages(oldestOrdinal, $this);
    	}
    	else
    	{
    		oldestOrdinal = parseInt(firstItem.attr('data-ordinal'));
    		tool.prefetchMessages(oldestOrdinal, $this);
    	}
    },
    prefetchMessages: function _Streams_chat_prefetchMessages(oldestOrdinal) {
    	var tool = this, $this = $(tool.element);
    	var o = tool.options;

    	var selectFromOrdinal = oldestOrdinal - 1;
    	if (selectFromOrdinal >= 0)
    	{
    		Q.jsonRequest.options.quiet = true;
    		Q.Streams.Message.get(o.publisherId, o.streamName, { 'max': selectFromOrdinal, 'limit': o.amountToLoad }, function(err, messages)
    		{
    			Q.jsonRequest.options.quiet = false;
    			if (err)
    			{
    				alert('An error occured while loading chat messages');
    			}
    			else
    			{
    				if (messages.length !== undefined && messages.length === 0)
    				{
    					tool.turnOfLoading();
    				}
    				else
    				{
    					tool.prefetchedMessages = messages;
    				}
    			}
    			tool.loadingInProgress = false;
    		}, { 'type': 'Streams/chat/message', 'ascending': false });
    	}
    	else
    	{
    		tool.turnOfLoading();
    	}
    },
    turnOfLoading: function _Streams_chat_turnOfLoading() {
    	var tool = this, $this = $(tool.element);
    	var o = tool.options;
    	this.loadingTurnedOff = true;
	
    	if (o.loadMore == 'scroll')
    	{
    		if (Q.Interval.exists('Streams.chat.scroll.interval'))
    		{
    			Q.Interval.clear('Streams.chat.scroll.interval');
    		}
    		if (Q.Interval.exists('Streams.chat.toggleClickToLoad.interval'))
    		{
    			Q.Interval.clear('Streams.chat.toggleClickToLoad.interval');
    		}
    		$this.find('.Streams_chat_click_to_load').hide();
    	}
    	else if (o.loadMore == 'click')
    	{
    		$this.find('.Streams_chat_click_to_load').hide();
    	}
    	else if (o.loadMore == 'pull')
    	{
    		$this.find('.Streams_chat_pull_down').hide();
    		$this.plugin('Q/iScroll', 'remove').plugin('Q/iScroll', { 'useTransition': true });
    		$this.children('div:last:not(.Streams_chat_listing_wrapper)').css({
    			'top': $this.offset().top + 'px',
    			'height': $this.height() + 'px',
    			'right': '0'
    		});
    		$this.plugin('Q/iScroll', 'refresh');
    	}
    }
}
);

})(Q, jQuery, window);