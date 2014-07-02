(function (Q, $) {
	/*
	 * Streams/access tool
	 */
	Q.Tool.define("Streams/access", function(options) {
		if (!options) {
			throw new Q.Exception("options required");
		}
		if (!options.tab) {
			options.tab = 'read';
		}
		var tool               = this,
			state              = this.state,
			element            = tool.element,
			levelForEveryone   = $('.Streams_access_levelForEveryone'),
			fieldName          = options.tab+'Level',
			actionText         = (options.tab === 'read') ? 'can see' : 'can',
			tempSelect         = $('<select />');
			
		Q.setObject(
			['#Q_tabs_tool', 'loaderOptions', 'slotContainer'],
			function (name) { return tool.element; },
			this.state
		);

		function prepareSelect($select, criteria, value, action) {
			if (!state.stream) return;
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
						+ '?publisherId='+state.stream.fields.publisherId
						+ '&name='+state.stream.fields.name
						+ '&' + fieldName + '='+$(this).val()
						+ '&Q.method=put'
					);
					if (typeof criteria === 'object') {
						for (var k in criteria) {
							url += '&' + k + '=' + encodeURIComponent(criteria[k]);
						}
					} else {
						url += '&' + criteria;
					}
					Q.request(url, ['data'], function (err, data) {
						var msg;
						if (msg = Q.firstErrorMessage(err, data && data.errors)) {
							alert(msg);
						}
					});
				});
			}
			return $select;
		}

		function newRemoveLink(criteria) {
			if (!state.stream) return;
			var link = $('<a href="#remove" />').click(function () {
				var $this = $(this);
				var url = Q.action(
					'Streams/access'
					+ '?publisherId='+state.stream.fields.publisherId
					+ '&name='+state.stream.fields.name
					+ '&' + fieldName + '=-1'
					+ '&Q.method=put'
				);
				for (var k in criteria) {
					url += '&' + k + '=' + encodeURIComponent(criteria[k]);
				}
				Q.request(url, ['data'], function (err, data) {
					var msg;
					if (msg = Q.firstErrorMessage(err, data && data.errors)) {
						alert(msg);
					}
					$this.closest('tr').remove();
					if (criteria.ofUserId) {
						delete tool.child('Streams_userChooser').exclude[criteria.ofUserId];
					} else if (criteria.ofContactLabel) {
						$('option', tempSelect).each(function () {
							if ($(this).val() === criteria.ofContactLabel) {
								$(this).appendTo($('.Streams_access_levelAddLabel', element));
								return false;
							}
						});
					}
				});
				return false;
			}).html('x');
			for (var k in criteria) {
				link.data(k, criteria[k]);
			}
			return link;
		}

		function addAccessRow(access, avatar) {
			var userId = access.ofUserId;
			var contactLabel = access.ofContactLabel;

			if ((!contactLabel && !userId) || access[fieldName] < 0) {
				return;
			}

			var clonedSelect = levelForEveryone.clone();
			var criteria;
			if (userId !== "") {
				if (!avatar) {
					avatar = options.avatar_array[userId];
				}
				criteria = {ofUserId: userId};

				tool.child('Streams_userChooser').exclude[userId] = true;
			} else if (contactLabel) {
				criteria = {ofContactLabel: contactLabel};
				$('.Streams_access_levelAddLabel option', element).each(function () {
					if ($(this).val() == contactLabel) {
						$(this).closest('select').val('');
						$(this).appendTo(tempSelect);
						return false;
					}
				});
			} else {
				return;
			}

			prepareSelect(clonedSelect, criteria, access[fieldName]);
			var tr = $('<tr />');
			if (userId !== "") {
				tr.append(
					$('<td style="vertical-align: middle;" />').append(
						$('<img />').attr('src', Q.plugins.Streams.iconUrl(avatar.icon, 40)).css('width', 20)
					)
				).append(
					$('<td style="vertical-align: middle;" />').append(
						$('<span class="access-tool-username">')
							.text(Q.plugins.Streams.displayName(avatar) + ' ' + actionText)
					).append(clonedSelect).append($('<div class="clear">'))
				).append(
					$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
				).appendTo($('.Streams_access_user_array', element));
			} else {
				tr.append(
					$('<td style="vertical-align: middle;" />')
						.text(contactLabel).append(' ' + actionText).append(clonedSelect)
				).append(
					$('<td style="vertical-align: middle;" />').append(newRemoveLink(criteria))
				).appendTo($('.Streams_access_label_array', element));
			}
		}

		if (!tool.state.publisherId) return;
		this.Q.onInit.set(function () {
			Q.Streams.get(tool.state.publisherId, tool.state.streamName, function (err, data) {
				var msg;
				if (msg = Q.firstErrorMessage(err, data && data.errors)) {
					alert(msg);
				}
				state.stream = this;
				
				var i, userId, access;

				prepareSelect(levelForEveryone, '', state.stream.fields[fieldName], 'stream');

				for (i=0; i<options.access_array.length; ++i) {
					access = options.access_array[i];
					addAccessRow(access);
				}

				tool.child('Streams_userChooser').onChoose = function (userId, avatar) {
					var url = Q.action(
						'Streams/access'
						+ '?publisherId='+state.stream.fields.publisherId
						+ '&streamName='+state.stream.fields.name
						+ '&' + fieldName + '=' + levelForEveryone.val()
						+ '&ofUserId='  + userId
						+ '&Q.method=put'
					);

					Q.request(url, ['data'], function (err, data) {
						var msg;
						if (msg = Q.firstErrorMessage(err, data && data.errors)) {
							alert(msg);
						}
						addAccessRow(data.slots.data.access, avatar);
					});
				};

				$('.Streams_access_levelAddLabel', element).change(function () {
					var url = Q.action(
						'Streams/access'
						+ '?publisherId='+state.stream.fields.publisherId
						+ '&streamName='+state.stream.fields.name
						+ '&' + fieldName + '=' + levelForEveryone.val()
						+ '&ofContactLabel='  + encodeURIComponent($(this).val())
						+ '&Q.method=put'
					);

					Q.request(url, ['data'], function (err, data) {
						var msg;
						if (msg = Q.firstErrorMessage(err, data && data.errors)) {
							alert(msg);
						}
						addAccessRow(data.slots.data.access);
					});
				});
			});
		}, 'Streams/access');
	});
})(Q, jQuery);