<?php if ($notices || $errors): ?>
<?php $has_contents = false ?>
<ul>
	<?php foreach ($notices as $notice): ?>
		<li<?php if ($has_contents):?> class="Q_hidden_notice"<?php endif?>>
			<span class="Q_common_notice"><?php echo $notice ?></span>
			<span class="Q_close"></span>
		</li>
		<?php $has_contents = true ?>
	<?php endforeach ?>
	<?php foreach ($errors as $error): ?>
		<li<?php if ($has_contents):?> class="Q_hidden_notice"<?php endif?>>
			<span class="Q_common_notice Q_error_notice"><?php echo $error->getMessage() ?></span>
			<span class="Q_close"></span>
		</li>
		<?php $has_contents = true ?>
	<?php endforeach ?>
</ul>
<?php endif ?>
