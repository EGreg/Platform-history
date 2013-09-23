Thanks for signing up with <?php echo $app ?>. Click here to activate your account:
<?php echo Q_Uri::url(
	'Users/activate?code='.urlencode($mobile->activationCode).'&m='.urlencode($mobile->number)
) ?>