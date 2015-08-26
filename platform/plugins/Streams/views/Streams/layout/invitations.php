<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN"
"http://www.w3.org/TR/html4/strict.dtd">
<html lang="en" xmlns:og="http://ogp.me/ns#" xmlns:fb="http://www.facebook.com/2008/fbml">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title><?php echo $title ?></title>
	<link rel="shortcut icon" href="<?php echo Q_Request::proxyBaseUrl(); ?>/favicon.ico" type="image/x-icon">
	<link rel="stylesheet" type="text/css" href="<?php echo Q_Html::themedUrl('plugins/Q/css/Q.css'); ?>">
	<link rel="stylesheet" type="text/css" href="<?php echo Q_Html::themedUrl('plugins/Streams/css/Streams.css'); ?>">
</head>
<body>
	<div id="content_slot">
		
<?php echo $content; ?>

	</div>
</body>
</html>
