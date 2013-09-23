Click here to verify your mobile phone:
<?php echo Q_Uri::url(
	'Users/activate?code='.urlencode($mobile->activationCode).'&m='.urlencode($mobile->number)
) ?>