/*
 * Streams/related tool.
 * @param options Object
 * A hash of options, which can include:
 *   "publisherId": Either this or "stream" is required. Publisher id of the stream to which the others are related
 *   "streamName": Either this or "stream" is required. Name of the stream to which the others are related
 *   "tag": Required. The type of tool element for each related stream, such as "div" or "li"
 *   "stream": You can pass a Streams.Stream object here instead of "publisherId" and "streamName"
 *   "relationType": The type of the relation. Defaults to ""
 *   "isCategory": Defaults to true. Whether to show the streams related TO this stream, or the ones it is related to.
 *   "relationOptions": Can include options like 'limit', 'offset', 'ascending', 'min', 'max' and 'prefix'
 *   "editable": Defaults to false. Whether the entries should be editable
 *   "creatable": Optional pairs of {streamType: params} to create new related streams.
 *      The params typically include at least a "title" field which you can fill with values such as "New" or "New ..."
 *   "toolType": Function that takes streamType and returns the tag to render (and then activate) for that stream
 *   "realtime": Whether to refresh every time a relation is added, removed or updated
 *   "onUpdate": Event that receives parameters "data", "entering", "exiting", "updating"
 *   "updateOptions": Options for onUpdate such as duration of the animation, etc.
 */
Q.Tool.define("Streams/related",

function _Streams_related_tool (options)
{
    // check for required options
    if ((!options.publisherId || !options.streamName)
    && (!options.stream || Q.typeOf(options.stream) !== 'Streams.Stream')) {
        throw "Streams/related tool: missing options.stream";
    }
    if (options.relationType === undefined) {
        throw "Streams/related tool: missing options.relationType";
    }
    if (options.tag === undefined) {
        throw "Streams/related tool: missing options.tag";
    }

	this.state.publisherId = this.state.publisherId || this.state.stream.fields.publisherId;
	this.state.streamName = this.state.streamName || this.state.stream.fields.streamName;
    
    // render the tool
    this.refresh();
},

{
    publisherId: Q.info.app,
    isCategory: true,
	realtime: true,
	editable: false,
	creatable: {},
	sortable: {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
	toolType: function (streamType) { return streamType+'/preview'; },
    onUpdate: new Q.Event(function _Streams_related_onUpdate(result, entering, exiting, updating) {
        var tool = this;
        Q.Tool.clear(tool.element);
        tool.element.innerHTML = '';

		function addComposer(streamType, params) {
			// TODO: test whether the user can create streams of this type
			// and otherwise do not append this element
			var element = tool.elementForStream(tool.state.publisherId, "", streamType, null, {
				creatable: params
			});
			element.setAttribute('class', element.getAttribute('class') + ' Streams_related_composer');
			Q.activate(tool.element.insertBefore(element, tool.element.firstChild), function () {
				element.Q.tool.state.onUpdate.set(function () {
					element.setAttribute('class', element.getAttribute('class').replace(
						'Streams_related_composer', 'Streams_related_stream'
					));
					element.Q.tool.state.onUpdate.remove(tool);
					addComposer(streamType, params);
				}, tool);
			});
		}
		
		Q.Streams.refresh.beforeRequest.set(function () {
			result.stream.refresh(null, {messages: true});
		}, 'Streams/related');
		
		if (result.stream.testWriteLevel('relate')) {
			Q.each(tool.state.creatable, addComposer);
			if (tool.state.sortable && result.stream.testWriteLevel('suggest')) {
				var sortableOptions = Q.extend({
					beforeDrop: {"Streams/related": function ($item, revert, data) {
						if (!data.direction) return;
						var target = (data.direction > 0)
							? data.$placeholder.prev()[0]
							: data.$placeholder.next()[0];
						if (!target) {
							// target should not be empty because of the way direction is computed
							console.warn("Streams/related onDrop: target is unexpectedly empty");
							return;
						}
						var s = Q.Tool.from(target).state,
							i = Q.Tool.from($item[0]).state,
							r = i.related;
						setTimeout(function () {
							Q.Streams.updateRelation(
								r.publisherId,
								r.streamName,
								r.type,
								i.publisherId,
								i.streamName,
								s.related.weight,
								1,
								function () {

								}
							);
						}, this.state('Q/sortable').drop.duration);
					}}
				}, tool.state.sortable);
				tool.$().plugin('Q/sortable', sortableOptions);
			}
		}
        Q.each(result.relations, function (i) {
			if (!this.from) return;
            var element = tool.elementForStream(this.from.fields.publisherId, this.from.fields.name, this.from.fields.type, this.weight);
			element.setAttribute('class', element.getAttribute('class') + ' Streams_related_stream');
			tool.element.appendChild(element);
        });
		Q.activate(tool.element, function () {
			tool.state.onRefresh.handle.call(tool)
		});
        // The elements should animate to their respective positions, like in D3.
    }, "Streams/related"),
	onRefresh: new Q.Event()
},

{
    refresh: function () {
        var tool = this;
        var publisherId = this.state.publisherId;
        var streamName = this.state.streamName;
        Q.Streams.retainWith(tool).related(
			publisherId, 
			streamName, 
			this.state.relationType, 
			this.state.isCategory, 
			this.state.relatedOptions,
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
            if (tool.state.result) {
                exiting = Q.diff(tool.state.result.streams, result.streams, comparator);
                entering = Q.diff(result.streams, tool.state.result.streams, comparator);
                updating = Q.diff(result.streams, entering, entering, comparator);
            } else {
                exiting = entering = updating = [];
            }
            tool.state.onUpdate.handle.apply(tool, [result, entering, exiting, updating]);
            
            // Now that we have the stream, we can update the event listeners again
            var dir = tool.state.isCategory ? 'To' : 'From';
            var eventNames = ['onRelated'+dir, 'onUnrelated'+dir, 'onUpdatedRelate'+dir];
            if (tool.state.realtime) {
                Q.each(eventNames, function (i, eventName) {
                    result.stream[eventName]().set(onChangedRelations, 'Streams/related');
                });
            } else {
                Q.each(eventNames, function (i, eventName) {
                    result.stream[eventName]().remove('Streams/related');
                });
            }
            tool.state.result = result;
			tool.state.lastMessageOrdinal = result.stream.fields.messageCount;
        }
        function onChangedRelations(msg, fields) {
            var isCategory = tool.state.isCategory;
			if (msg.socketSessionId != Q.Streams.socketSessionId(msg.publisherId, msg.streamName)) {
				// TODO: REPLACE THIS WITH AN ANIMATED UPDATE BY LOOKING AT THE ARRAYS entering, exiting, updating
            	tool.refresh();
			}
			tool.state.lastMessageOrdinal = msg.ordinal;
        }
    },
    elementForStream: function (publisherId, streamName, streamType, weight, options) {
        var o = Q.extend({
            publisherId: publisherId,
            streamName: streamName,
			related: {
				publisherId: this.state.publisherId,
				streamName: this.state.streamName,
				type: this.state.relationType,
				weight: weight
			},
			editable: this.state.editable
        }, options);
 		return this.setUpElement(this.state.tag, this.state.toolType(streamType), o);
    }
}

);