<?php

/**
 * @module Q
 */

/**
 * Used by HTTP clients to upload a new image to the server
 * @class Q/image
 * @method post
 * @param {array} [$params] Parameters that can come from the request
 *   @param {string} [$params.icon.data]  Required for icon. Base64-encoded image data URI - see RFC 2397
 *   @param {string} [$params.icon.path="uploads"] parent path under web dir (see subpath)
 *   @param {string} [$params.icon.subpath=""] subpath that should follow the path, to save the image under
 *   @param {string} [$params.icon.merge=""] path under web dir for an optional image to use as a background
 *   @param {string} [$params.icon.crop] array with keys "x", "y", "w", "h" to crop the original image
 *   @param {string} [$params.icon.save=array("x" => "")] array of $size => $basename pairs
 *    where the size is of the format "WxH", and either W or H can be empty.
 */
function Q_image_post($params = null)
{
	$p = $params
		? $params
		: Q::take($_REQUEST, array('data', 'path', 'subpath', 'merge', 'crop', 'save'));
	if (!empty($_FILES)) {
		foreach ($_FILES as $file) {
			$tmp = $file['tmp_name'];
			if (empty($data)) {
				$p['data'] = file_get_contents($tmp);
			}
			unlink($tmp);
		}
	} else {
		$p['data'] = base64_decode(chunk_split(substr($p['data'], strpos($p['data'], ',')+1)));
	}
	$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'image', 'time', 5*60*60);
	set_time_limit($timeLimit); // 5 min
	$data = Q_Image::save($p);
	if (empty($params)) {
		Q_Response::setSlot('data', $data);
	}
}
