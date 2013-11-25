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
    "publisherId": Q.info.app,
    "isCategory": true,
	"realtime": true,
	"editable": false,
	"creatable": {},
	"sortable": {
		draggable: '.Streams_related_stream',
		droppable: '.Streams_related_stream'
	},
    "onUpdate": new Q.Event(function _Streams_related_onUpdate(result, entering, exiting, updating) {
        var tool = this;
        Q.Tool.clear(tool.element);
        tool.element.innerHTML = '';

		function addComposer(streamType, params) {
			// TODO: test whether the user can create streams of this type
			// and otherwise do not append this element
			var element = tool.elementForStream(tool.state.publisherId, "", streamType, {
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

		if (result.stream.testWriteLevel('relate')) {
			Q.each(this.state.creatable, addComposer);
			if (tool.state.sortable && result.stream.testWriteLevel('editPending')) {
				tool.$().plugin('Q/sortable', tool.state.sortable);
			}
		}
        Q.each(result.streams, function () {
            var element = tool.elementForStream(this.fields.publisherId, this.fields.name, this.fields.type);
			element.setAttribute('class', element.getAttribute('class') + ' Streams_related_stream');
            Q.activate(tool.element.appendChild(element));
        });
        // The elements should animate to their respective positions, like in D3.
    }, "Streams/related"), 
	"updateOptions": {
		duration: 300
	},
    "toolType": function (streamType) { return streamType+'/preview'; }
},

{
    refresh: function () {
        var tool = this;
        var publisherId = this.state.publisherId;
        var streamName = this.state.streamName;
        // Remove all the cache entries for this publisherId and streamName
        Q.Streams.related.cache.each([publisherId, streamName], function (k, v) {
            Q.Streams.related.forget(k);
        });
        Q.Streams.retainWith('Streams/related')
			.related(publisherId, streamName, this.state.relationType, this.state.isCategory, this.state.relatedOptions, relatedResult);
        
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

			if (!result) return;
            
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
        }
        function onChangedRelations(stream, fields) {
            var isCategory = tool.state.isCategory;
            //tool.refresh(); // TODO: REMOVE THIS?
        }
    },
    elementForStream: function (publisherId, streamName, streamType, options) {
        var o = Q.extend({
            publisherId: publisherId,
            streamName: streamName,
			relatedFrom: {
				publisherId: this.state.publisherId,
				streamName: this.state.streamName,
				type: this.state.relationType
			},
			editable: this.state.editable
        }, options);
 		return Q.Tool.element(this.state.tag, this.state.toolType(streamType), o);
    }
}

);