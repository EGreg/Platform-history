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
	<?php if ($getintouch and ($edit or $bio->getintouch)): ?>
		<?php echo Q::tool('Users/getintouch', array(
			'user' => $bio->userId,
			'email' => true,
			'emailSubject' => $getintouch['emailSubject'],
			'sms' => true,
			'call' => true,
			'class' => $getintouch['classes'],
			'between' => ""
		)) ?>
	<?php endif; ?>
	<?php if ($edit): ?>
		<?php echo Q_Html::form(Q_Request::baseUrl('action.php').'/Websites/bio', 'put',
			array('class' => 'Websites_getintouch')
		) ?>
			<?php echo Q::view('Websites/tool/getintouch.php', compact('bio')) ?>
		</form>
	<?php endif; ?>
</div>
<?php echo Q::tool("Streams/html", array(
	'publisherId' => $bio->publisherId,
	'streamName' => $bio->name,
	'field' => 'bio',
	'placeholder' => 'Enter content here'
), 'bio') ?>