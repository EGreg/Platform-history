<?php

/**
 * @module Q
 */

/**
 * Used by HTTP clients to upload a new file to the server
 * @class Q/file
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} [$params.icon.data]  Required if $_FILES is empty. Base64-encoded image data URI - see RFC 2397
 *   @param {string} [$params.icon.path="uploads"] parent path under web dir (see subpath)
 * @param {string} [$params.basename] required name of the file, after the subpath
 *   @param {string} [$params.icon.subpath=""] subpath that should follow the path, to save the image under
 */
function Q_file_post($params = null)
{
	$p = $params
		? $params
		: Q::take($_REQUEST, array('data', 'path', 'subpath', 'merge', 'crop', 'save'));
	if (!empty($_FILES)) {
		$file = reset($_FILES);
		$tmp = $file['tmp_name'];
		if (empty($p['data'])) {
			$p['data'] = file_get_contents($tmp);
		}
		unlink($tmp);
	} else {
		if (empty($p['data'])) {
			throw new Q_Exception_RequiredField(array('field' => 'data'), 'data');
		}
		$p['data'] = base64_decode(chunk_split(substr($p['data'], strpos($p['data'], ',')+1)));
	}
	$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'file', 'time', 5*60*60);
	set_time_limit($timeLimit); // default is 5 min
	$data = Q_File::save($p);
	if (empty($params)) {
		Q_Response::setSlot('data', $data);
	}
	return $data;
}
