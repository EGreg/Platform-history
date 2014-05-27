<div id="content">
	<div class='info_pane'>
		<?php if ($stream->icon): ?>
			<div class='Streams_stream_icon'>
				<?php echo Q_Html::img("plugins/Streams/img/icons/{$stream->icon}/80.png"); ?>
			</div>
		<?php endif; ?>
		<div class='Streams_stream_title'>
			<?php echo Q_Html::text($stream->title) ?>
		</div>
		<div class='Streams_stream_content'>
			<?php echo Q_Html::text($stream->content) ?>
		</div>
		<div class='Streams_participant'>
			<?php echo Q::tool('Streams/participant')?>
		</div>
	</div>
	<div class='main_pane'>
		<div class='Streams_publish'>
			<?php echo Q::tool('Streams/publish', compact('stream'))?>
		</div>
		<div class='Streams_activity'>
			<?php echo Q::tool('Streams/activity')?>
		</div>
	</div>
</div>