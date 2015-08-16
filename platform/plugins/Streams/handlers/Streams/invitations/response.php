<?php

/**
 * Displays an HTML document that can be printed, ideally with line breaks.
 * Uses a particular view for the layout.
 * @param {array} $_REQUEST
 * @param {string} $_REQUEST.batch Required. The name of the batch under which invitations were saved during a call to Streams::invite.
 * @param {string} [$_REQUEST.limit=100] The maximum number of invitations to show on the page
 * @param {string} [$_REQUEST.offset=0] Used for paging
 * @param {string} [$_REQUEST.title='Invitations'] Override the title of the document
 * @param {string} [$_REQUEST.layout='default'] The name of the layout to use for the HTML document
 * @see Users::addLink()
 */
function Streams_invitations_response()
{
	Q_Request::requireFields(array('batch'), true);
	$batch = $_REQUEST['batch'];
	$title = Q::ifset($_REQUEST, 'layout', 'title');
	$layoutKey = Q::ifset($_REQUEST, 'layout', 'default');
	$limit = Q::ifset($_REQUEST, 'limit', 100);
	$offset = Q::ifset($_REQUEST, 'offset', 0);
	$layout = Q_Config::expect('Streams', 'invites', 'layout', $layoutKey);
	$app = Q_Config::expect('Q', 'app');
	$pattern = Streams::invitationsPath() . DS . $batch . DS . "*.html";
	$filenames = glob($pattern);
	$parts = array();
	foreach ($filenames as $f) {
		if (--$offset > 0) {
			continue;
		}
		$parts[] = file_get_contents($f);
		if (--$limit == 0) {
			break;
		}
	}
	$content = implode("\n\n<div class='Q_pagebreak Streams_invitations_separator'></div>\n\n", $parts);
	echo Q::view($layout, compact('content', 'parts'));
	return false;
}