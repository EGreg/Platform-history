<?php

function Q_image_post($options = array()) {

	$r = array_merge($_REQUEST, $options);

	set_time_limit(Q_Config::get('Q', 'uploads', 'limits', 'image', 'time', 5*60*60)); // 5 min
	$user = Users::loggedInUser(true);
	$imageData = isset($r['data']) ? $r['data'] : null;
	$path = isset($r['path']) ? $r['path'] : 'uploads';
	$subpath = isset($r['subpath']) ? $r['subpath'] : '';
	
	if (!$imageData) {
		throw new Q_Exception("No image to save");
	}

	$merge = null;
	$m = isset($r['merge']) ? $r['merge'] : null;
	if (isset($m) && strtolower(substr($m, -4)) === '.png') {
		$mergePath = Q::realPath(APP_WEB_DIR.DS.implode(DS, explode('/', $m)));
		if ($mergePath) {
			$merge = imagecreatefrompng($mergePath);
			$mw = imagesx($merge);
			$mh = imagesy($merge);
		}
	}

	$crop = isset($r['crop']) ? $r['crop'] : array();
	$save = !empty($r['save']) ? $r['save'] : array('x' => '');
	$image = imagecreatefromstring(
		base64_decode(chunk_split(substr($imageData, strpos($imageData, ',')+1)))
	);
	if (!$image) {
		throw new Q_Exception("Image type not supported");
	}
	// check if exif is available
	if (exif_imagetype($imageData) === IMAGETYPE_JPEG) {
		$exif = exif_read_data($imageData);
		// Rotate full image. Hopefully it's not too huge.
		if (!empty($exif['Orientation'])) {
			switch ($exif['Orientation']) {
				case 3:
					$image = imagerotate($image, 180, 0);
					break;
				case 6:
					$image = imagerotate($image, -90, 0);
					break;
				case 8:
					$image = imagerotate($image, 90, 0);
					break;
			}
		}
	}
	// image dimensions
	$iw = imagesx($image);
	$ih = imagesy($image);
	// crop parameters - size of source image
	$isw = isset($crop['w']) ? $crop['w'] : $iw;
	$ish = isset($crop['h']) ? $crop['h'] : $ih;
	$isx = isset($crop['x']) ? $crop['x'] : 0;
	$isy = isset($crop['y']) ? $crop['y'] : 0;
	$data = array();
	// process requested thumbs
	// create dirs for new images
	$realPath = Q::realPath(APP_WEB_DIR.DS.$path);
	$writePath = $realPath.($subpath ? DS.$subpath : '');
	$lastChar = substr($writePath, -1);
	if ($lastChar !== DS or $lastChar !== '/') {
		$writePath .= DS;
	}
	Q_Utils::canWriteToPath($writePath, true, true);
	foreach ($save as $size => $name) {
		if (empty($name)) {
			// generate a filename
			do {
				$name = Q_Utils::unique(8).'.png';
			} while (file_exists($writePath.DS.$name));
		}
		if (strrpos($name, '.') === false) {
			$name .= '.png';
		}
		list($n, $ext) = explode('.', $name);
		$sw = $isw;
		$sh = $ish;
		$sx = $isx;
		$sy = $isy;
		// determine destination image size
		if (!empty($size)) {
			$sa = explode('x', $size);
			if (count($sa) > 1) {
				if ($sa[0] === '') {
					if ($sa[1] === '') {
						$dw = $sw;
						$dh = $sh;
					} else {
						$dh = intval($sa[1]);
						$dw = $sw * $dh / $sh;
					}
				} else {
					$dw = intval($sa[0]);
					if ($sa[1] === '') {
						$dh = $sh * $dw / $sw;
					} else {
						$dh = intval($sa[1]);
					}
				}
			} else {
				$dw = $dh = intval($sa[0]);
			}
			// calculate the origin point of source image
			// we have a cropped image of dimension $sw, $sh and need to make new with dimension $dw, $dh
			if ($dw/$sw < $dh/$sh) {
				// source is wider then destination
				$new = $dw/$dh * $sh;
				$sx += round(($sw - $new)/2);
				$sw = round($new);
			} else {
				// source is narrower then destination
				$new = $dh/$dw * $sw;
				$sy += round(($sh - $new)/2);
				$sh = round($new);
			}
		} else {
			$size = '';
			$dw = $sw;
			$dh = $sh;
		}
		// create destination image
		$maxWidth = Q_Config::get('Q', 'images', 'maxWidth', null);
		$maxHeight = Q_Config::get('Q', 'images', 'maxHeight', null);
		if (isset($maxWidth) and $dw > $maxWidth) {
			throw new Q_Exception("Image width exceeds maximum width of $dw");
		}
		if (isset($maxHeight) and $dh > $maxHeight) {
			throw new Q_Exception("Image height exceeds maximum height of $dh");
		}
		$thumb = imagecreatetruecolor($dw, $dh);
		$res = ($sw === $dw && $sh === $dh)
			? imagecopy($thumb, $image, 0, 0, $sx, $sy, $sw, $sh)
			: imagecopyresampled($thumb, $image, 0, 0, $sx, $sy, $dw, $dh, $sw, $sh);
		if (!$res) {
			throw new Q_Exception("Failed to save image file of type '$ext'");
		}
		if ($merge) {
			$mergethumb = imagecreatetruecolor($mw, $mh);
			imagesavealpha($mergethumb, false);
			imagealphablending($mergethumb, false);
			if (imagecopyresized($mergethumb, $merge, 0, 0, 0, 0, $dw, $dh, $mw, $mh)) {
				imagecopy($thumb, $mergethumb, 0, 0, 0, 0, $dw, $dh);
			}
		}
		$res = false;
		switch ($ext) {
			case 'png':
				$res = imagepng($thumb, $writePath.DS.$name);
				break;
			case 'jpg':
				$res = imagejpeg($thumb, $writePath.DS.$name);
				break;
			case 'gif':
				$res = imagegif($thumb, $writePath.DS.$name);
				break;
		}
		if ($res) {
			$data[$size] = $subpath ? "$path/$subpath/$name" : "$path/$name";
		}
	}
	$data[''] = $subpath ? "$path/$subpath" : "$path";

	/**
	 * @event Q/image {after}
	 * @param {string} 'user'
	 * @param {string} 'path'
	 * @param {string} 'subpath'
	 * @param {string} 'writePath'
	 * @param {string} 'data'
	 */
	Q::event('Q/image', compact('user', 'path', 'subpath', 'writePath', 'data'), 'after');
	Q_Response::setSlot('data', $data);
}
