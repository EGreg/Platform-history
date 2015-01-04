<?php

/**
 * Used to upload a new image to the server
 *
 * @param {array} $_REQUEST 
 *   data, path, subpath, crop, save, merge
 *   sets 'data' slot unless $params are passed
 * @return {array} An array of $size => $subpath pairs corresponding to the files created.
 */
function Q_image_post($params = null)
{
	$timeLimit = Q_Config::get('Q', 'uploads', 'limits', 'image', 'time', 5*60*60);
	set_time_limit($timeLimit); // 5 min
	if (!$params) {
		$params = $_REQUEST;
	}
	$params['data'] = base64_decode(chunk_split(substr($r['data'], strpos($r['data'], ',')+1)));
	$data = Q_Image::save($params);
	if (empty($params)) {
		Q_Response::setSlot('data', $data);
	}
	return $data;
}
