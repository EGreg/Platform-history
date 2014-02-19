<div class="Websites_side_column">
	<?php echo Q::tool('Streams/image/preview', array(
		'publisherId' => $bio->publisherId,
		'streamName' => $bio->name,
		'creatable' => array(
			'clickable' => false
		),
		'imagepicker' => array(
			'showSize' => '400x',
			'saveSizeName' => array(
				'40' => '40',
				'50' => '50',
				'400x' => '400x'
			)
		),
		'actions' => null
	), 'bio') ?>
	<?php echo Q::tool('Users/getintouch', array(
		'user' => $bio->userId,
		'email' => true,
		'emailSubject' => "Reaching out from your website",
		'sms' => true,
		'call' => true,
		'class' => 'Q_button clickable',
		'between' => ""
	)) ?>
</div>
<?php echo Q::tool("Streams/html", array(
	'publisherId' => $bio->publisherId,
	'streamName' => $bio->name,
	'field' => 'bio',
	'placeholder' => 'Enter content here'
), 'bio') ?>