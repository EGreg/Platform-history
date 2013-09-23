Did you want to reset your passphrase in <?php echo $app ?>? Then click here:
<?php echo Q_Uri::url(
	'Users/activate?code='.urlencode($mobile->activationCode).'&m='.urlencode($mobile->number)
) ?>