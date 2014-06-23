<div class="streams_access_tool_container">
	<?php echo Q::tool('Q/tabs', array(
		'tabs' => $tabs,
		'titleClasses' => array(
			'read'   => 'basic32 basic32_view Streams_access_read_tab',
			'write'  => 'basic32 basic32_edit Streams_access_read_write',
			'admin'  => 'basic32 basic32_group Streams_access_read_admin'
		),
		'selector'   => '#dialog .dialog_slot, #content_slot',
		'slot'       => 'dialog',
		'defaultTab' => 'read'
	)) ?>

	<div style="background: white; border: solid 0px white;">
		<div class="Streams_access_controls">
			<?php if(isset($_GET['tab'])):  ?>
				<h1><?php echo $_GET['tab']; ?></h1>
				<div style="clear:both;"></div>
			<?php endif; ?>
			<div>
				<?php if ($tab === 'read'): ?>
					The general public can see
				<?php else: ?>
					The general public can
				<?php endif; ?>

				<select name="level_for_everyone" class="Streams_access_level_for_everyone">
					<?php echo Q_Html::options($levels, '') ?> 
				</select>
			</div>

			<?php if ($access_array and count($labels) != 0): ?>
				<div>
					Grant additional access to
					<select name="level_add_label" class="Streams_access_level_add_label">
						<?php echo Q_Html::options($labels, '', null, true) ?>
					</select>
				</div>
				<table class="Streams_access_label_array"></table>
			<?php endif ?>

			<div>Custom access for individual users:</div>
			<div>
				<?php echo Q::tool('Streams/userChooser') ?>
			</div>
			<table class="Streams_access_user_array"></table>
		</div>
	</div>
</div>