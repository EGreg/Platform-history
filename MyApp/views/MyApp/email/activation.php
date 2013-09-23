<p>
	Thanks for signing up with <?php echo $app ?>.
</p>

<p>
	Is this really your email address, <?php echo $user->username ?>?
	If so, click <?php echo Q_Html::a(
		'Users/activate?code='.urlencode($email->activationCode)
		 . ' emailAddress='.urlencode($email->address),
		'here'
	) ?> to set your passphrase and activate your account.
</p>

<p>
	See you on <a href="<?php echo Q_Request::baseUrl() ?>"><?php echo $app ?></a>!
</p>
