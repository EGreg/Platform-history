<?php

$prefix = Q_Html::getIdPrefix();

?>
<?php echo Q_Html::form(Q_Request::baseUrl().'/action.php/Streams/basic', 'post') ?>
<?php echo Q_Html::formInfo(Q_Dispatcher::uri()) ?>
<table>
	<tr>
		<td class="Q_field_title">
			<label for="<?php echo $prefix ?>firstName">First Name</label>
			<?php if ($show_access): ?>
				<?php echo Q::tool('Streams/access', array(
					'readLevel' => Streams::my('Streams/user/firstName', 'readLevel'),
					'streamName' => 'Streams/user/firstName',
					'input_id' => Q_Html::id('firstName_readLevel')
				), 'firstName') ?>
				<input type="hidden" name="firstName_readLevel"
					id="<?php echo Q_Html::id('firstName_readLevel') ?>"
					value="<?php echo Streams::my('Streams/user/firstName', 'readLevel') ?>">
			<?php endif; ?>
		</td>
		<td class="Q_fieldInput">
			<input type="text" name="firstName" class="text" id="<?php echo $prefix ?>firstName"
				value="<?php echo Streams::my('Streams/user/firstName') ?>">
		</td>
	</tr>
	<tr>
		<td class="Q_field_title">
			<label for="<?php echo $prefix ?>lastName">Last Name</label>
			<?php if ($show_access) : ?>
				<?php echo Q::tool('Streams/access', array(
					'readLevel' => Streams::my('Streams/user/lastName', 'readLevel'),
					'streamName' => 'Streams/user/lastName',
					'input_id' => Q_Html::id('lastName_readLevel')
				), 'lastName') ?>
				<input type="hidden" name="lastName_readLevel"
					id="<?php echo Q_Html::id('lastName_readLevel') ?>"
					value="<?php echo Streams::my('Streams/user/lastName', 'readLevel') ?>">
			<?php endif; ?>
		</td>
		<td class="Q_fieldInput">
			<input type="text" name="lastName" class="text" id="<?php echo $prefix ?>lastName"
				value="<?php echo Streams::my('Streams/user/lastName') ?>">
		</td>
	</tr>
	<tr>
		<td class="Q_field_title">
			<label for="<?php echo $prefix ?>sex">Sex</label>
			<?php if ($show_access): ?>
				<?php echo Q::tool('Streams/access', array(
					'readLevel' => Streams::my('Streams/user/sex', 'readLevel'),
					'streamName' => 'Streams/user/sex',
					'input_id' => Q_Html::id('sex_readLevel')
				), 'sex') ?>
				<input type="hidden" name="sex_readLevel"
					id="<?php echo Q_Html::id('sex_readLevel') ?>"
					value="<?php echo Streams::my('Streams/user/sex', 'readLevel') ?>">
			<?php endif; ?>
		</td>
		<td class="Q_fieldInput">
			<select name="sex" class="select" id="<?php echo $prefix ?>sex">
				<?php echo Q_Html::options(
					array('male' => 'male', 'female' => 'female'),
					'', Streams::my('Streams/user/sex'), '', "\n\t\t\t"
				) ?>
			</select>
		</td>
	</tr>
	<tr>
		<td class="Q_field_title">
			<label for="<?php echo $prefix ?>birthday">Birthday</label>
			<?php if ($show_access): ?>
				<?php echo Q::tool('Streams/access', array(
					'readLevel' => Streams::my('Streams/user/birthday', 'readLevel'),
					'streamName' => 'Streams/user/birthday',
					'input_id' => Q_Html::id('birthday_readLevel')
				), 'birthday') ?>
				<input type="hidden" name="birthday_readLevel"
					id="<?php echo Q_Html::id('birthday_readLevel') ?>"
					value="<?php echo Streams::my('Streams/user/birthday', 'readLevel') ?>">
			<?php endif; ?>
		</td>
		<td class="Q_fieldInput">
			<?php echo Q_Html::date('birthday', Streams::my('Streams/user/birthday'),
				array('year_from' => 1900, 'year_to' => '2001'),
				array('id' => 'birthday')
			); ?>
		</td>
	</tr>
	<tr>
		<td>
		</td>
		<td>
			<button type="submit">Save</button>
		</td>
	</tr>
</table>
</form>
