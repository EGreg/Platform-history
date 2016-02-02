<?php echo Q_Html::form('https://test.authorize.net/profile/manage', 'POST') ?> 
	<?php echo Q_Html::hidden(array('Token' => $token ))?>
	<input class="Q_button Awards_auth" type="submit" value="Payment info"/>
	<button class="Q_button Awards_confirm"><?php echo $button ?></button>
</form>