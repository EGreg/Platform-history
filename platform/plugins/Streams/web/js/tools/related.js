(function (Q, $) {

/**
 * @module Streams-tools
 */

/**
 * Renders a bunch of Stream/preview tools for streams related to the given stream.
 * Has options for adding new related streams, as well as sorting the relations, etc.
 * Also can integrate with Q/tabs tool to render tabs "related" to some category.
 * @class Streams related
 * @constructor
 * @param {Object} [options] this object contains function parameters
 *   @param {String} [options.publisherId] Either this or "stream" is required. Publisher id of the stream to which the others are related
 *   @param {String} [options.streamName] Either this or "stream" is required. Name of the stream to which the others are related
 *   @param {String} [options.tag] The type of element to contain the preview tool for each related stream.
 *   @default "div"
 *   @param {Stream} [options.stream] You can pass a Streams.Stream object here instead of "publisherId" and "streamName"
 *   @param {Stream} [options.relationType] The type of the relation.
 *   @default ""
 *   @param {Boolean} [options.isCategory] Whether to show the streams related TO this stream, or the ones it is related to.
 *   @default true
 *   @param {Object} [options.relationOptions] Can include options like 'limit', 'offset', 'ascending', 'min', 'max' and 'prefix'
 *   @param {Boolean} [options.editable] Set to false to avoid showing even authorized users an interface to replace the image or text
 *   @param {Boolean} [options.creatable]  Optional pairs of {streamType: params} to create new related streams.
 *   The params typically include at least a "title" field which you can fill with values such as "New" or "New ..."
 *   @param {Function} [options.toolType] Function that takes streamType and returns the tag to render (and then activate) for that stream
 *   @param {Boolean} [options.realtime] Whether to refresh every time a relation is added, removed or updated
 *   @default false
 *   @param {Object} [options.sortable] Options for "Q/sortable" jQuery plugin. Pass false here to disable sorting interface. If streamName is not a String, this interface is not shown.
 *   @param {Function} [options.tabs] Function for interacting with any parent "Q/tabs" tool. Format is function (previewTool, tabsTool) { return urlOrTabKey; }
 *   @param {Object} [options.updateOptions] Options for onUpdate such as duration of the animation, etc.
 *   @param {Q.Event} [options.onUpdate] Event that receives parameters "data", "entering", "exiting", "updating"
 *   @param {Q.Event} [options.onRefresh] Event that occurs when the tool is completely refreshed, the "this" is the tool
 */
Q.Tool.define("Streams/related",

function _Streams_related_tool (options)
{
    // check for required options
	var state = this.state;
    if ((!options.publisherId || !options.streamName)
    && (!options.stream || Q.typeOf(options.stream) !== 'Streams.Stream')) {
        throw new Q.Error("Streams/related tool: missing options.stream");
    }
    if (options.relationType === undefined) {
        throw new Q.Error("Streams/related tool: missing options.relationType");
    }

	state.publisherId = state.publisherId || state.stream.fields.publisherId;
	state.streamName = state.streamName || state.stream.fields.streamName;
    
	state.refreshCount = 0;

    // render the tool
    this.refresh();
},

{
    publisherId: Q.info.app,
    isCategory: true,
	realtime: false,
	editable: {},
	creatable: {},
	sortable: {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
	tabs: function (previewTool, tabsTool) {
		return Q.Streams.key(previewTool.state.publisherId, previewTool.state.streamName);
	},
	toolType: function (streamType) { return streamType+'/preview'; },
    onUpdate: new Q.Event(
	function _Streams_related_onUpdate(result, entering, exiting, updating) {
		function addComposer(streamType, params) {
			// TODO: test whether the user can create streams of this type
			// and otherwise do not append this element
			params.streamType = streamType;
			var element = tool.elementForStream(
				tool.state.publisherId, "", streamType, null, 
				{ creatable: params }
			);
			element.setAttribute('class', element.getAttribute('class') + ' Streams_related_composer');
			Q.activate(tool.element.insertBefore(element, tool.element.firstChild),
			function () {
				var rc = tool.state.refreshCount;
				element.Q.tool.state.onUpdate.set(function () {
					
					// workaround for now
					if (tool.state.refreshCount > rc) {
						return;
					}
					
					tool.integrateWithTabs([element]);
					
					element.setAttribute('class', element.getAttribute('class').replace(
						'Streams_related_composer', 'Streams_related_stream'
					));
					element.Q.tool.state.onUpdate.remove(tool);
					addComposer(streamType, params);
				}, tool);
			});
		}
		
        var tool = this, state = tool.state;
        Q.Tool.clear(tool.element);
        tool.element.innerHTML = '';
		++state.refreshCount;
		
		Q.Streams.refresh.beforeRequest.set(function () {
			result.stream.refresh(null, {messages: true});
		}, 'Streams/related');
		
		if (result.stream.testWriteLevel('relate')) {
			Q.each(state.creatable, addComposer);
			if (state.sortable && result.stream.testWriteLevel('suggest')) {
				var sortableOptions = Q.extend({}, state.sortable);
				var $t = tool.$();
				$t.plugin('Q/sortable', sortableOptions, function () {
					if (state.realtime) return;
					$t.state('Q/sortable').onSuccess.set(function ($item, data) {
						if (!data.direction) return;
						var p = new Q.Pipe(['timeout', 'updated'], function () {
							if (state.realtime) return;
							Q.Streams.related.cache.removeEach(
								state.publisherId, state.streamName
							);
							// TODO: replace with animation?
							tool.refresh();
						});
						var s = Q.Tool.from(data.target).state;
						var i = Q.Tool.from($item[0]).state;
						var r = i.related;
						setTimeout(
							p.fill('timeout'),
							this.state('Q/sortable').drop.duration
						);
						Q.Streams.updateRelation(
							r.publisherId,
							r.streamName,
							r.type,
							i.publisherId,
							i.streamName,
							s.related.weight,
							1,
							p.fill('updated')
						);
					}, tool);
				});
			}
		}
		
		var elements = [];
        Q.each(result.relations, function (i) {
			if (!this.from) return;
			var tff = this.from.fields;
            var element = tool.elementForStream(
				tff.publisherId, 
				tff.name, 
				tff.type, 
				this.weight
			);
			element.setAttribute('class', element.getAttribute('class') + ' Streams_related_stream');
			elements.push(element);
			tool.element.appendChild(element);
        });
		Q.activate(tool.element, function () {
			tool.integrateWithTabs(elements);
			tool.state.onRefresh.handle.call(tool);
		});
        // The elements should animate to their respective positions, like in D3.

    }, "Streams/related"),
	onRefresh: new Q.Event()
},

{
    refresh: function () {
        var tool = this;
		var state = tool.state;
        var publisherId = state.publisherId;
        var streamName = state.streamName;
        Q.Streams.retainWith(tool).related(
			publisherId, 
			streamName, 
			state.relationType, 
			state.isCategory, 
			state.relatedOptions,
			relatedResult
		);
        
        function relatedResult(errorMessage) {
			if (errorMessage) {
				console.warn("Streams/related refresh: " + errorMessage);
				return;
			}
            var result = this;
            var entering = exiting = updating = null;
            function comparator(s1, s2, i, j) {
                return s1 && s2 && s1.fields && s2.fields
					&& s1.fields.publisherId === s2.fields.publisherId
                    && s1.fields.name === s2.fields.name;
            }
			var tsr = tool.state.result;
            if (tsr) {
                exiting = Q.diff(tsr.relatedStreams, result.relatedStreams, comparator);
                entering = Q.diff(result.relatedStreams, tsr.relatedStreams, comparator);
                updating = Q.diff(result.relatedStreams, entering, entering, comparator);
            } else {
                exiting = entering = updating = [];
            }
            tool.state.onUpdate.handle.apply(tool, [result, entering, exiting, updating]);
            
            // Now that we have the stream, we can update the event listeners again
            var dir = tool.state.isCategory ? 'To' : 'From';
            var eventNames = ['onRelated'+dir, 'onUnrelated'+dir, 'onUpdatedRelate'+dir];
            if (tool.state.realtime) {
                Q.each(eventNames, function (i, eventName) {
                    result.stream[eventName]().set(onChangedRelations, tool);
                });
            } else {
                Q.each(eventNames, function (i, eventName) {
                    result.stream[eventName]().remove(tool);
                });
            }
            tool.state.result = result;
			tool.state.lastMessageOrdinal = result.stream.fields.messageCount;
        }
        function onChangedRelations(msg, fields) {
			// TODO: REPLACE THIS WITH AN ANIMATED UPDATE BY LOOKING AT THE ARRAYS entering, exiting, updating
            var isCategory = tool.state.isCategory;
			if (fields.type !== tool.state.relationType) {
				return;
			}
			if (!Q.Users.loggedInUser
			|| msg.byUserId != Q.Users.loggedInUser.id
			|| msg.byClientId != Q.clientId()
			|| msg.ordinal !== tool.state.lastMessageOrdinal + 1) {
            	tool.refresh();
			} else {
				tool.refresh(); // TODO: make the weights of the items in between update in the client
			}
			tool.state.lastMessageOrdinal = msg.ordinal;
        }
    },

    elementForStream: function (publisherId, streamName, streamType, weight, options) {
		var state = this.state;
        var o = Q.extend({
            publisherId: publisherId,
            streamName: streamName,
			related: {
				publisherId: state.publisherId,
				streamName: state.streamName,
				type: state.relationType,
				weight: weight
			},
			editable: state.editable
        }, options);
 		return this.setUpElement(state.tag || 'div', state.toolType(streamType), o);
    },

	integrateWithTabs: function (elements) {
		var id, parents, tabs, i, tool = this, state = tool.state;
		if (typeof state.tabs !== 'function') {
			return;
		}
		parents = Q.extend(tool.parents());
		parents[tool.id] = tool;
		for (id in parents) {
			if (tabs = parents[id].element.Q("Q/tabs")) {
				for (i=0; i<elements.length; ++i) {
					var value = state.tabs.call(tool, Q.Tool.from(elements[i]), tabs);
					var attr = value.isUrl() ? 'href' : 'data-name';
					elements[i].addClass("Q_tabs_tab")
						.setAttribute(attr, value);
				}
				tabs.indicateSelected();
				break;
			}
		}
	}
}

);

})(Q, jQuery);