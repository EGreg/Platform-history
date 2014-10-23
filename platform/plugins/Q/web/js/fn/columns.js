(function (Q, $, window, document, undefined) {

/**
 * This plugin builds two columns of content from given html structure.
 * It has to be so:
 * <div>
 *	 <div>
 *		 <h3>Column title</h3>
 *		 Column content
 *	 </div>
 *	 <div>
 *		 <h3>Column title</h3>
 *		 Column content
 *	 </div>
 * </div>
 * Result depends on the platform. On the dekstop and tablet it simply makes two columns vertically by float:left'n them.
 * On the mobile it shows only one column at a time and makes segmented control for switching between columns.
 * @method columns
 * @param {Object} [options] options, an object of options
 * @param {Q.Event} [options.onSwitch] onSwitch Optional. Callback or Q.Event to call when user switches to another column. Also Called immediately after initialization (considered as first time switch).
 * @default new Q.Event(function() {})
 */
Q.Tool.jQuery('Q/columns',

function _Q_columns(o) {
	
	return this.each(function(index) {
		var $this = $(this);
		$this.addClass('Q_columns');
		var leftColumn = $this.children('div:first'), rightColumn = $this.children('div:last');
		if (Q.info.isMobile) {
			$this.addClass('Q_clearfix');
			var control = $('<ul class="Q_segmented_control" />');
			control.append('<li class="Q_segment_selected">' + leftColumn.children('h3').text() + '</li>');
			control.append('<li>' + rightColumn.children('h3').text() + '</li>');
			$this.prepend(control);
			
			leftColumn.children('h3').remove();
			rightColumn.hide().children('h3').remove();
			
			var totalWidth = 0;
			var buttons = control.children('li');
			buttons.bind(Q.Pointer.start, function(event) {
				event.preventDefault();
				
				buttons.removeClass('Q_segment_selected');
				$(this).addClass('Q_segment_selected');
				if ($(this).index() == 0)
				{
					leftColumn.show();
					rightColumn.hide();
				}
				else
				{
					rightColumn.show();
					leftColumn.hide();
				}
				Q.handle(o.onSwitch);
			});
			buttons.each(function() {
				totalWidth += $(this).outerWidth();
			});
			control.css({ 'width': totalWidth + 'px' });
			Q.handle(o.onSwitch);
		} else {
			leftColumn.css({ 'width': '49%' });
			rightColumn.css({ 'width': '49%', 'margin-left': '2%' });
		}
	});
	
},

{
	'onSwitch': new Q.Event(function() {})
}

);

})(Q, jQuery, window, document);