(function (Q, $) {

/**
 * Streams/participant tool.
 * Display participants of certain stream using horizontally scrolled list.
 * Each item in the list is presented with avatar and username and also can have a contextual associated with it.
 * @method participant
 * @param {Object} [options] this object contains function parameters
 *   @param {Number} [options.hideContextualOnMovePixels]
 *   Optional. Amount of pixels the user have to scroll the list before shown contextual
 *                                 (if there's one) will be hidden.
 *   @default 10
 */
Q.Tool.define("Streams/participant",

function(o) {
	  	var $element = $(this.element);
	    var listItems = $element.find('.Streams_participant_list > li');
	    $element.find('.Streams_participant_list_wrapper').css({
	    	'width': (listItems.outerWidth(true) * listItems.length) + 'px'
	    });
	    setTimeout(function()
	    {
	    	listItems.plugin('Q/contextual', {
				'items': [
					{'contents': 'First Last, reason'},
					{'contents': 'Access'}
				],
				'size': { 'width': 200 }
		    });
	    }, 0);
	    if (Q.info.isTouchscreen)
	  	{
	    	var containerLeft = 0, containerRight = 0;
  			var scrollStartX = 0, scrollEndX = 0, scrollMarginStartX = 0, scrollDiff = 0;
	    	var contextualStartLeft = 0, contextualLeft = 0, contextualRight = 0, contextualWidth = 0, contextualInnerWidth = 0;
	    	var arrow = null, arrowStartMargin = 0, arrowMargin = 0, arrowWidth = 0;
	    	var iScrollThis = null, contextual = null;
	    	var contextualHideTimeout = null;

	    	var moveContextualOnScroll = function()
	    	{
	    		if (Q.Contextual.current != -1)
    			{
	    			scrollDiff = Math.abs(scrollEndX) - Math.abs(scrollStartX);
    				if (Math.abs(scrollDiff) > o.hideContextualOnMovePixels)
	    			{
    					Q.Contextual.hide();
	    			}
    				else
    				{
		    			if (!contextual)
		    			{
		    				contextual = Q.Contextual.collection[Q.Contextual.current].contextual;
		    				contextualStartLeft = parseInt(contextual.css('left'));
		    				contextualWidth = contextual.outerWidth();
		    				contextualInnerWidth = contextual.width();
		    				arrow = contextual.find('.Q_contextual_top_arrow, .Q_contextual_bottom_arrow');
		    				arrowStartMargin = parseInt(arrow.css('margin-left'));
		    				arrowWidth = arrow.width();
		    			}

	    				contextualLeft = contextualStartLeft - scrollDiff;
	    				contextualRight = contextualLeft + contextualWidth;
	    				if (contextualLeft > containerLeft && contextualRight < containerRight)
	    				{
	    					contextual.css({ 'left': contextualLeft + 'px' });
	    					scrollMarginStartX = Infinity;
	    				}
	    				else
	  					{
	    					if (scrollMarginStartX === Infinity)
	    					{
	    						scrollMarginStartX = scrollEndX;
	    					}
	    					scrollDiff = Math.abs(scrollEndX) - Math.abs(scrollMarginStartX);
	    					arrowMargin = arrowStartMargin - scrollDiff;
	    					if ((arrowMargin >= 0) && (arrowMargin + arrowWidth <= contextualInnerWidth))
	    					{
	    						arrow.css({ 'margin-left': arrowMargin + 'px' });
	    					}
	    					else
	  						{
	    						Q.Contextual.hide();
	  						}
	  					}
    				}
    			}
	    	};

	    	if (Q.info.platform == 'android')
    		{
	    		$element.plugin('Q/touchscroll', {
	    			'onScrollStart': function()
		    		{
		    			containerLeft = $element.offset().left;
		    			containerRight = $element.offset().left + $element.outerWidth();
		    			scrollStartX = $element[0].scrollLeft;
		    		},
		    		'onScrollMove': function()
		    		{
		    			scrollEndX = $element[0].scrollLeft;
		    			moveContextualOnScroll();
		    		},
		    		'onScrollEnd': function()
		    		{
		    			clearTimeout(contextualHideTimeout);
		    			scrollEndX = $element[0].scrollLeft;
		    			moveContextualOnScroll();
		    			contextual = null;
		    			Q.Contextual.updateLayout();
		      	},
		      	'onTouchEnd': function(e)
	      		{
		      		if (Math.abs(scrollEndX - scrollStartX) > 50)
		      		{
			      		contextualHideTimeout = setTimeout(function()
		    				{
			      			Q.Contextual.hide();
		    				}, 300);
		      		}
	      		}
		    	});
    		}
	    	else
	    	{
		    	$element.plugin('Q/iScroll', {
		    		'onScrollStart': function()
		    		{
		    			containerLeft = $element.offset().left;
		    			containerRight = $element.offset().left + $element.outerWidth();
		    			iScrollThis = $element.data('Q/iScroll');
		    			scrollStartX = iScrollThis.x;
		    		},
		    		'onScrollMove': function()
		    		{
		    			scrollEndX = iScrollThis.x;
		    			moveContextualOnScroll();
		    		},
		    		'onScrollEnd': function()
		    		{
		    			clearTimeout(contextualHideTimeout);
		    			scrollEndX = iScrollThis.x;
		    			moveContextualOnScroll();
		    			contextual = null;
		    			Q.Contextual.updateLayout();
		      	},
		      	'onTouchEnd': function(e)
	      		{
		      		if (iScrollThis && Math.abs(scrollEndX - scrollStartX) > 50)
		      		{
			      		contextualHideTimeout = setTimeout(function()
		    				{
			      			Q.Contextual.hide();
		    				}, 300);
		      		}
	      		}
		    	});
	    	}
	  	}
	    else
	  	{
	    	$element.bind('scroll', function()
			{
		    	Q.Contextual.updateLayout();
			});
	  	}
	    $element.data('Streams/participant inited', true);
},

{
    'hideContextualOnMovePixels': 10
},

{
    updateLayout: function($element) {
    	if ($element.data('Streams/participant inited'))
    	{
    		if (Q.info.platform == 'android')
    		{
    			$element.plugin('Q/touchscroll', 'refresh');
    		}
    		else if (Q.info.isTouchscreen && $element.data('Q/iScroll'))
    		{
    			$element.plugin('Q/iScroll', 'refresh');
    			var scrollbar = $element.children('div:last:not(.Streams_participant_list_wrapper)');
    			scrollbar.css({
    		  	'top': ($element.offset().top + $element.outerHeight() - scrollbar.height()) + 'px',
    		  	'left': $element.offset().left + 'px',
    		  	'right': '',
    		  	'width': $element.outerWidth() + 'px'
    		  });
    			$element.plugin('Q/iScroll', 'refresh');
    		}
    		else
    		{
    			$element.plugin('Q/scrollbarsAutoHide');
    		}
    	}
    	else
    	{
    		Q.Layout.needUpdateOnLoad = true;
    	}
    },

    update: function () {
    	$.fn.participants.updateLayout($(this.element));
    }
}

);

})(Q, jQuery);