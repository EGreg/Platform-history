<!DOCTYPE html>
<html lang="en"
<?php if (Q_Config::get('Q', 'environment', '') == 'live'): ?>
<?php endif ?>
xmlns:fb="http://www.facebook.com/2008/fbml">
<head>
	<?php include('common_mobile_header.php') ?>
	<?php include('common_header.php') ?>
</head>
<body>
	<div class="Q_orientation_mask">
		<?php echo Q_Html::img('plugins/Q/img/ui/qbix_logo_small.png') ?>
	</div>
	<div id="main">
		<div class="Q_top_stub">&nbsp;</div>
		<div id="dashboard_slot">
<!-- ------------------------begin dashboard slot-------------------------------- -->
<?php echo $dashboard ?> 
<!-- --------------------------end dashboard slot-------------------------------- -->
		</div>
		<div id="notices_slot">
<!-- --------------------------begin notices slot-------------------------------- -->
<?php echo $notices ?> 
<!-- ----------------------------end notices slot-------------------------------- -->
		</div>
		<div id="column0_slot">
<!-- ---------------------------------------------------------------------------- -->
<?php echo $column0 ?> 
<!-- ---------------------------------------------------------------------------- -->
		</div>
		<div id="column1_slot">
<!-- ---------------------------------------------------------------------------- -->
<?php echo $column1 ?> 
<!-- ---------------------------------------------------------------------------- -->
		</div>
		<div id="column2_slot">
<!-- ---------------------------------------------------------------------------- -->
<?php echo $column2 ?> 
<!-- ---------------------------------------------------------------------------- -->
		</div>
		<?php include('common_footer.php') ?>
	</div>
	<div id="dialogs_slot">
<!-- --------------------------begin dialogs slot-------------------------------- -->
<?php echo $dialogs; ?> 
<!-- ----------------------------end dialogs slot-------------------------------- -->
	</div>
</body>
</html>
