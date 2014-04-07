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
	<?php if ($getintouch and $bio->getintouch): ?>
		<?php echo Q::tool('Users/getintouch', array(
			'user' => $bio->userId,
			'email' => true,
			'emailSubject' => $getintouch['emailSubject'],
			'sms' => true,
			'call' => true,
			'class' => $getintouch['classes'],
			'between' => ""
		)) ?>
		<?php echo Q_Html::form('Streams/put', 'put') ?>
			<?php echo Q_Html::input('getintouch', 'getintouch', array(
				'type' => 'checkbox',
				'checked' => 'checked',
				'id' => 'foo'
			)) ?>
			<?php echo Q_Html::tag('label', array(
				'id' => 4
			))?>
		</form>
	<?php endif; ?>
</div>
<?php echo Q::tool("Streams/html", array(
	'publisherId' => $bio->publisherId,
	'streamName' => $bio->name,
	'field' => 'bio',
	'placeholder' => 'Enter content here'
), 'bio') ?>