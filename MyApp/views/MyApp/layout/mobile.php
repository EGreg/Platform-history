<!DOCTYPE html>
<html lang="en" xmlns:fb="http://www.facebook.com/2008/fbml">
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
	<div id="dashboard_slot">
<!-- ------------------------begin dashboard slot-------------------------------- -->
<?php echo $dashboard ?> 
<!-- --------------------------end dashboard slot-------------------------------- -->
	</div>
	<div id="page">
		<?php if ($notices): ?>
			<div id="notices_slot">
<!-- --------------------------begin notices slot-------------------------------- -->
<?php echo $notices ?> 
<!-- --------------------------end dashboard_slot-------------------------------- -->
			</div>
		<?php endif; ?>
		<div id="content_slot">
<!-- --------------------------begin content slot-------------------------------- -->
<?php echo $content; ?> 
<!-- ----------------------------end content slot-------------------------------- -->
		</div>
	</div>
	<div id="dialogs_slot">
<!-- --------------------------begin dialogs slot-------------------------------- -->
<?php echo $dialogs; ?> 
<!-- ----------------------------end dialogs slot-------------------------------- -->
	</div>
	<?php echo Q_Response::scripts(true, "\n\t") ?> 
	<?php echo Q_Response::scriptLines(true) ?>
	<?php echo Q_Response::templates(true, "\n\t") ?>
</body>
</html>
