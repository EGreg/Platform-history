		<?php echo Q::tool('Q/form') ?>
		<?php echo Q_Html::formInfo(Q_Request::url()); ?>
		<?php echo Q_Html::input('getintouch', 'true', array(
			'type' => 'checkbox',
			'checked' => !empty($bio->getintouch) ? 'checked' : null,
			'id' => 'getintouch'
		)) ?>
		<?php echo Q_Html::hidden(array(
			'publisherId' => $bio->publisherId,
			'name' => $bio->name
		))?>
		<?php echo Q_Html::label('getintouch', 'Show people ways to get in touch')?>
		<?php echo Q_Html::buttons('submit', array('submit' => 'Submit')) ?>