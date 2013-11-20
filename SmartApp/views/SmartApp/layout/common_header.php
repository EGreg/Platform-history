
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
	<title id="title_slot"><?php echo $title; ?></title>
	<link rel="shortcut icon" href="<?php echo Q_Request::baseUrl() ?>/favicon.ico" type="image/x-icon">
	<?php echo Q_Response::stylesheets(true, "\n\t") ?> 
	<?php echo Q_Response::styles(true, "\n\t") ?> 
	<?php echo Q_Response::metas(true, "\n\t") ?>
	<?php if (!empty($meta)) echo $meta ?>