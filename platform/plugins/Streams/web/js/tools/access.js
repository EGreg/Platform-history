(function (Q, $) {
	/*
	 * Streams/access tool
	 */
	Q.Tool.define("Streams/access", function(options) {
		if (options.ajax === false) {
			return addToolHandler(options.publisherId, options.streamName);
		}

		var me                 = this,
			tool               = this.element,
			level_for_everyone = $('.Streams_access_level_for_everyone'),
			field_name         = options.tab+'Level',
			action_text        = (options.tab === 'read') ? 'can see' : 'can',
			temp_select        = $('<select />');

		function addToolHandler(publisherId, streamName) {
			Q.findToolNodesByName(streamName).on('click touchstart', function(){
				Q.Dialogs.push({
					url: Q.action("Streams/access", {
						'publisherId': publisherId,
						'streamName': streamName
					}),
					onClose: function(){
						$(this).remove();
					}
				}).addClass('Streams_access_tool_dialog_container');
			});
		}

		function prepareSelect($select, criteria, value, action) {
			if (!action) {
				action = 'access';
			}

			if (typeof value !== 'undefined') {
				$select.find('option').removeAttr('selected');
				$select.attr(
					'selectedIndex',
					$select.find('option[value='+value+']').attr('selected', 'selected').index()
				);

				$select.change(function () {
					var url = Q.action(
						'Streams/' + action
						+ '?publisherId='+options.stream.fields.publisherId
						+ '&name='+options.stream.fields.name
						+ '&' + field_name + '='+$(this).val()
						+ '&Q.method=put'
					);
					if (typeof criteria === 'object') {
						for (var k in criteria) {
							url += '&' + k + '=' + encodeURIComponent(criteria[k]);
						}
					} else {
						url += '&' + criteria;
					}
					$.getJSON(
						Q.ajaxExtend(url, 'data'),
						function (response) {
							if (response.errors) {
								alert(response.errors[0].message);
							}
						}
					);
				});
			}
			return $select;
		}

		function newRemoveLink(criteria) {
			var link = $('<a href="#remove" />').click(function () {
				var $this = $(this);
				var url = Q.action(
					'Streams/access'
					+ '?publisherId='+options.stream.fields.publisherId
					+ '&name='+options.stream.fields.name
					+ '&' + field_name + '=-1'
					+ '&Q.method=put'
				);
				for (var k in criteria) {
					url += '&' + k + '=' + encodeURIComponent(criteria[k]);
				}
				$.getJSON(
					Q.ajaxExtend(url, 'data'),
					function (response) {
						if (response.errors) {
							alert(response.errors[0].message);
							return;
						}
						$this.closest('tr').remove();
						if (criteria.ofUserId) {
							delete me.child('Streams_userChooser').exclude[criteria.ofUserId];
						} else if (criteria.ofContactLabel) {
							$('option', temp_select).each(function () {
								if ($(this).val() === criteria.ofContactLabel) {
									$(this).appendTo($('.Streams_access_level_add_label', tool));
									return false;
								}
							});
						}
					}
				);
				return false;
			}).html('x');
			for (var k in criteria) {
				link.data(k, criteria[k]);
			}
			return link;
		}

		function addAccessRow(access, avatar) {
			var userId = access.fields.ofUserId;
			var contact_label = access.fields.ofContactLabel;

			if ((!contact_label && !userId) || access[field_name] < 0) {
				return;
			}

			var cloned_select = level_for_everyone.clone();
			var criteria;
			if (userId && userId !== "0") {
				if (!avatar) {
					avatar = options.avatar_array[userId];
				}
				criteria = {ofUserId: userId};

				me.child('Streams_userChooser').exclude[userId] = true;
			} else if (contact_label) {
				criteria = {ofContactLabel: contact_label};
				$('.Streams_access_level_add_label option', tool).each(function () {
					if ($(this).val() == contact_label) {
						$(this).closest('select').val('');
						$(this).appendTo(temp_select);
						return false;
					}
				});
			} else {
				return;
			}

			prepareSelect(cloned_select, criteria, access.fields[field_name]);
			var tr = $('<tr />');
			if (userId && userId !== "0") {
				tr.append(
					$('<td style="vertical-align: middle;" />').append(
						$('<img />').attr('src', Q.plugins.Streams.iconUrl(avatar.fields.icon, 40)).css('width', 20)
					)
				).append(
					$('<td style="vertical-align: middle;" />').append(
						$('<span class="access-tool-username">')
							.text(Q.plugins.Streams.displayName(avatar.fields) + ' ' + action_text)
					).append(cloned_select).append($('<div class="clear">'))
				).append(
					$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
				).appendTo($('.Streams_access_user_array', tool));
			} else {
				tr.append(
					$('<td style="vertical-align: middle;" />')
						.text(contact_label).append(' ' + action_text).append(cloned_select)
				).append(
					$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
				).appendTo($('.Streams_access_label_array', tool));
			}
		}

		this.Q.onInit.set(function () {
			var i, userId, access;

			prepareSelect(level_for_everyone, '', options.stream.fields[field_name], 'stream');

			for (i=0; i<options.access_array.length; ++i) {
				access = options.access_array[i];
				addAccessRow(access);
			}

			me.child('Streams_userChooser').onChoose = function (userId, avatar) {
				var url = Q.action(
					'Streams/access'
					+ '?publisherId='+options.stream.fields.publisherId
					+ '&streamName='+options.stream.fields.name
					+ '&' + field_name + '=' + level_for_everyone.val()
					+ '&ofUserId='  + userId
					+ '&Q.method=put'
				);

				$.getJSON(
					Q.ajaxExtend(url, 'data'),
					function (response) {
						if (response.errors) {
							alert(response.errors[0].message);
							return;
						}

						addAccessRow({ fields: response.slots.data.access }, { fields: avatar });
					}
				);
			};

			$('.Streams_access_level_add_label', tool).change(function () {
				var url = Q.action(
					'Streams/access'
					+ '?publisherId='+options.stream.fields.publisherId
					+ '&streamName='+options.stream.fields.name
					+ '&' + field_name + '=' + level_for_everyone.val()
					+ '&ofContactLabel='  + encodeURIComponent($(this).val())
					+ '&Q.method=put'
				);

				$.getJSON(
					Q.ajaxExtend(url, 'data'),
					function (response) {
						if (response.errors) {
							alert(response.errors[0].message);
							return;
						}

						addAccessRow(response.slots.data.access);
					}
				);
			});
		}, 'Streams/access');
	});
})(Q, jQuery);