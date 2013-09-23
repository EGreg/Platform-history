<?php

function Streams_after_Q_responseExtras() {
	if ($preloaded = Streams_Stream::$preloaded) {
		Q_Response::setScriptData('Q.plugins.Streams.Stream.preloaded', Db::exportArray($preloaded));
	}
}
