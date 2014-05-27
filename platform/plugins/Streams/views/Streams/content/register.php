<div id='content'>
	<div class='invited_pane'>
		<table class='invited notice'>
			<tr>
				<td>
					<?php echo Q_Html::img(
						"plugins/Users/img/icons/user-{$by_user->id}/80.png",
						$by_display_name,
						array('class' => 'item_icon')
					) ?>
				</td>
				<td>
					<h2><?php echo $by_display_name ?> invited you to:</h2>
					<div class='stream_title'><?php echo $stream->title ?></div>
				</td>
			</tr>
		</table>
		<h3>Let your friends recognize you:</h3>
		<div class='Q_login Q_big_prompt'>
			<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/basic', 'post') ?>
			<?php echo Q_Html::hidden(array('token' => $token, 'userId' => $user->id)) ?>
			<?php echo Q::tool('Q/form', array(
					'fields' => array(
						'name' => array(
							'placeholder' => "", 
							'label' => 'Enter your name:'
						),
						'' => array(
							'type' => 'submit', 
							'value' => 'Get Started'
						)
					),
					'onSuccess' => Q_Request::baseUrl()."/plugins/Streams/stream?publisherId={$stream->publisherId}&streamName={$stream->name}"
				), array('id' => 'Streams_Register'));
			?>
			</form>
		</div>
	</div>
</div>
