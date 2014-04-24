(function (Q, $, window, document, undefined) {

/**
 * Makes a selectable listing which acts like a menu.
 * @param options Object or string
 *	 If an object then it's a hash of options, that can include:
 *		 "handler": Required. Callback or Q.Event which will be called when item from the listing selected.
 *		 "blink": Defaults to true. This defines list item blinking on selection.
 *		 If false, the selected item just stays highlighted and doesn't blink.
 *		 "ignoreStartEvent": Defaults to false. If true, ignores initial 'touchstart' / 'mousedown' events.
 *		 Usually tracking initial event is needed to detect if it's scroll drag event and prevent item selection in this case.
 *		 If true, then initial event won't be tracked and only 'touchend' / 'mouseup' will be considered as
 *		 item selection.
 *		 "eventDelegate": Optional. If provided, then touch / mouse events will be handled using this element.
 *	 If a string, then it's a command which may be:
 *		 "destroy": Destroys selectable listing functionality.
 */
Q.Tool.jQuery('Q/listing',

function (o) {
	
	if (!o.handler)
	{
		alert("Please provide 'handler' for the selectable listing.");
		return false;
	}
	else if (Q.typeOf(o.handler) != 'Q.Event')
	{
		o.handler = new Q.Event(o.handler);
	}
	
	return this.each(function(index)
	{
		var $this = $(this);
		if ($this.data('Q/listing objects')) {
			return;
		}
		$this.addClass('Q_selectable_listing');
		
		var listItems = $this.find('li');
		
		var eventReceiver = o.eventDelegate ? $(o.eventDelegate) : $this;
		
		var startY = 0, endY = 0;
		var moveTarget = null;
		var selectedAtStart = false;
		
		function startEventHandler(event)
		{
			startY = endY = event.originalEvent.touches ? event.originalEvent.touches[0].clientY : event.clientY;
			if (event.target.tagName && event.target.tagName.toLowerCase() == 'li' &&
					$(event.target).parents('.Q_selectable_listing').length != 0)
			{
				moveTarget = event.target;
				listItems.removeClass('Q_selected');
				$(moveTarget).addClass('Q_selected');
				selectedAtStart = true;
			}
			eventReceiver.unbind(Q.Pointer.end, endEventHandler)
				.bind(Q.Pointer.end, endEventHandler);
//			console.log('1bound ' + Q.Pointer.end, eventReceiver[0]);
		}
		
		function moveEventHandler(e)
		{
			var event = (Q.info.isTouchscreen ? e.originalEvent.touches[0] : e);
			var clientX = event.clientX, clientY = event.clientY;
			var offset = $this.offset();
			offset.left -= document.body.scrollLeft, offset.top -= document.body.scrollTop;
			if (clientX >= offset.left && clientX <= offset.left + $this.outerWidth() &&
					clientY >= offset.top && clientY <= offset.top + $this.outerHeight())
			{
				moveTarget = document.elementFromPoint(clientX, clientY);
				while (moveTarget)
				{
					if (moveTarget.tagName && moveTarget.tagName.toLowerCase() == 'li' &&
							$(moveTarget).parents('.Q_selectable_listing').length != 0)
					{
						break;
					}
					moveTarget = moveTarget.parentNode;
				}
				listItems.removeClass('Q_selected');
				if (moveTarget && !selectedAtStart)
					$(moveTarget).addClass('Q_selected');
			}
			if (clientY != startY) // workaround against Chrome bug
			{
				endY = clientY;
			}
		}
		
		// for desktop
		if (!(Q.info.isMobile || Q.info.isTablet))
		{
			function leaveEventHandler()
			{
				listItems.removeClass('Q_selected');
			}
			eventReceiver.unbind('mouseleave', leaveEventHandler)
				.bind('mouseleave', leaveEventHandler);
//			console.log('2bound mouseleave', eventReceiver[0]);
		}
		
		function endEventHandler(event)
		{
			if (moveTarget && (o.ignoreStartEvent || Math.abs(startY - endY) < 10))
			{
				var li = $(moveTarget);
				if (o.blink)
				{
					li.removeClass('Q_selected');
					setTimeout(function()
					{
						li.addClass('Q_selected');
						setTimeout(function()
						{
							li.removeClass('Q_selected');
							Q.handle(o.handler, li, [li]);
							moveTarget = null;
							selectedAtStart = false;
						}, 200);
					}, 200);
				}
				else
				{
					listItems.removeClass('Q_selected Q_permanently_selected');
					li.addClass('Q_permanently_selected');
					Q.handle(o.handler, li, [li]);
					moveTarget = null;
					selectedAtStart = false;
				}
			}
		}
		
		if (o.ignoreStartEvent) {
			eventReceiver.unbind(Q.Pointer.end, endEventHandler)
				.bind(Q.Pointer.end, endEventHandler);
//				console.log('3bound ' + Q.Pointer.end, eventReceiver[0]);
		} else {
			eventReceiver.unbind(Q.Pointer.start, startEventHandler)
				.bind(Q.Pointer.start, startEventHandler);
//				console.log('4bound ' + Q.Pointer.start, eventReceiver[0]);
		}
		eventReceiver.unbind(Q.Pointer.move, moveEventHandler)
			.bind(Q.Pointer.move, moveEventHandler);
//		console.log('bound ' + Q.Pointer.move, eventReceiver[0]);
		
		$this.data('Q/listing objects', {
			'eventReceiver': eventReceiver,
			'startEventHandler': startEventHandler,
			'moveEventHandler': moveEventHandler,
			'endEventHandler': endEventHandler
		});
	});
},

{
	blink: true,
	eventDelegate: null,
	ignoreStartEvent: false,
	handler: new Q.Event()
},

{
	destroy: function () {
		return this.each(function(index) {
			var $this = $(this);
			var data = $this.data('Q/listing objects');
			if (data) {
				if (data.startEventHandler) {
					data.eventReceiver.unbind(Q.Pointer.start, data.startEventHandler);
				}
				if (data.moveEventHandler) {
					data.eventReceiver.unbind(Q.Pointer.move, data.moveEventHandler);
				}
				if (data.endEventHandler) {
					data.eventReceiver.unbind(Q.Pointer.end, data.endEventHandler);
				}
			}
			$this.removeData('Q/listing objects');
		});
	}
}

);

})(Q, jQuery, window, document);
