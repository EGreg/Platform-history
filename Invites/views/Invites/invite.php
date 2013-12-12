<div id="content">
	<h1>Invite</h1>
	<div class='invited_pane'>
		<table class='invited notice'>
			<tr>
				<td>
					<?php echo Q_Html::img(
						"plugins/Users/img/icons/user_id_{$by_user->id}/80w.png",
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
		<h3>Let your friends recognize you, define your name (at least one)</h3>
		<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/user', 'post') ?>
		<?php echo Q_Html::hidden(array('_[nonce]' => $_SESSION['Q'][Q_Config::get('Q', 'session', 'nonceField', 'nonce')], 'token' => $token, 'user_id' => $user->id)) ?>
		<?php echo Q::tool('Q/form', array(
				'fields' => array(
					'name' => array(
						'placeholder' => "'First Last' or 'Last, First'", 
						'label' => 'Enter your name:'
					),
					'username' => array(
						'placeholder' => 'Nickname', 
						'label' => 'Enter your nickname:'
					),
					'password' => array(
						'label' => 'Enter password'.(empty($user->passphrase_hash) ? ' (optional):' : ''),
						'type' => 'password'
					),
					'' => array(
						'type' => 'submit', 
						'value' => 'Proceed'
					)
				),
				'onSubmit' => 'Q.Invites.passwordHash',
				'onSuccess' => $app_url
			), array('id' => 'User_Register'))
		?>
		</form>
	</div>
</div>
