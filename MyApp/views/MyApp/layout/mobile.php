<!DOCTYPE html>
<html lang="en"
<?php if (Q_Config::get('Q', 'environment', '') == 'live'): ?>
<?php endif ?>
xmlns:fb="http://www.facebook.com/2008/fbml">
<head>
	<meta name="HandheldFriendly" content="True" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0<?php if (Q_Request::platform() == 'android'): ?>, target-densitydpi=medium-dpi<?php endif ?>" />
	<meta name="apple-mobile-web-app-status-bar-style" content="black" />
	<meta name="apple-mobile-web-app-capable" content="yes" />
	<link rel="apple-touch-icon" href="<?php echo Q_Html::themedUrl('img/icon_big.png') ?>" />
	<link rel="apple-touch-icon-precomposed" href="<?php echo Q_Html::themedUrl('img/icon_big.png') ?>" />
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
		<title><?php echo $title; ?></title>
		<link rel="shortcut icon" href="<?php echo Q_Request::baseUrl() ?>/favicon.ico" type="image/x-icon">
		<?php echo Q_Response::stylesheets(true, "\n\t") ?> 
		<?php echo Q_Response::styles(true, "\n\t") ?> 
		<?php echo Q_Response::metas(true, "\n\t") ?>
</head>
<body>
	<div id="main">
		<div class="Q_top_stub">&nbsp;</div>
		<div id="dashboard_slot">
			<?php echo $dashboard ?>
		</div>
		<div id="notices_slot">
			<?php echo $notices ?>
		</div>
		<div id="content_slot">
			<?php echo $content ?>
		</div>
		<?php echo Q_Response::scripts("\n\t") ?>

		<?php 
		if (Q_Config::get('Q', 'socketbug', 'on', false))
		{
			$app = Q_Config::expect('Q', 'app');
			$host = Q_Config::get('Q', 'socketbug', 'host', 'localhost');
			$port = Q_Config::get('Q', 'socketbug', 'port', '8080');
			$scriptUrl = Q_Config::get('Q', 'socketbug', 'scriptUrl', '');
			echo <<<EOT

		<script type="text/javascript">
			var _sbs = _sbs || {
				'version': '0.2.0',
				'host': 'http://$host',
				'port': $port,
				'group_id': '49415D06-BFE5-5464-2135-3D48B6BBEF6F',
				'group_name': 'Qbix',
				'application_id': '9F199338-6C8A-6FF4-3DB6-C94B0626646C',
				'application_name': '$app',
				'debug_level': 5
			};
		</script>
		<script src="$scriptUrl" type="text/javascript"></script>

EOT;
		}
		?>

		<?php echo Q_Html::script(Q_Response::scriptLines()) ?>
	</div>
</body>
</html>
