<?php

/**
 * Streams/related tool
 * @param {array} $options Options to pass to the tool, including:
 *   "publisherId": Either this or "stream" is required. Publisher id of the stream to which the others are related
 *   "streamName": Either this or "stream" is required. Name of the stream to which the others are related
 *   "tag": Required. The type of tool element for each related stream, such as "div" or "li"
 *   "stream": You can pass a Streams.Stream object here instead of "publisherId" and "streamName"
 *   "relationType": The type of the relation. Defaults to ""
 *   "isCategory": Defaults to true. Whether to show the streams related TO this stream, or the ones it is related to.
 *   "relationOptions": Can include options like 'limit', 'offset', 'ascending', 'min', 'max' and 'prefix'
 *   "editable": Defaults to false. Whether the entries should be editable
 *   "creatable": Optional pairs of {streamType: title} to create new related streams. You can put custom title such as "New" or "New ..."
 *   "toolType": Function that takes streamType and returns the tag to render (and then activate) for that stream
 *   "realtime": Whether to refresh every time a relation is added, removed or updated
 *   "onUpdate": Event that receives parameters "data", "entering", "exiting", "updating"
 *   "updateOptions": Options for onUpdate such as duration of the animation, etc.
 */
function Streams_related_tool($options)
{
	Q_Response::setToolOptions($options);
}