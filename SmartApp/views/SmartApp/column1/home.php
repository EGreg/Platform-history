<div class="Q_column1_contents">
	<?php foreach ($players as $player): ?>
	<div class="Q_player">
		<ul class="Q_player_buttons Q_clearfix">
			<li class="Q_player_button Q_player_button_share Q_selected">
				<div class=""></div>
				Share
			</li>
			<li class="Q_player_button Q_player_button_chat Q_selected">
				<div class=""></div>
				99+
			</li>
		</ul>
		<div class="Q_player_contents">
			<?php echo $player ?>
		</div>
	</div>
	<?php endforeach ?>
</div>