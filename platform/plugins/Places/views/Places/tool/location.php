	I'm interested in things taking place within
	<?php echo Q_Html::select('miles', array(
		'class' => 'Places_location_miles'
	)) ?> 
		<?php echo Q_Html::options($miles, 'miles', $defaultMiles) ?> 
	</select>
	of
	<div class="Places_location_whileObtaining">
		<?php echo Q_Html::img('img/map.png', 'map', array(
			'class' => 'Places_location_set '
		)) ?> 
		<form class="Places_location_zipcode Places_location_whileObtaining" style="display: none">
			<?php echo Q_Html::input('zipcode', '', array(
				'placeholder' => 'Your Zipcode',
				'maxlength' => '5'
			)) ?>
		</form>
	</div>
	<div class="Places_location_whileObtained">
		<div class="Places_location_map_container">
			<div class="Places_location_map"></div>
		</div>
		<div class="Places_location_update Places_location_whileObtained">
			<button class="Places_location_update_button Q_button">
				Update my location
			</button>
		</div>
	</div>
	<?php echo Q_Html::input('zipcode', '', array(
		'placeholder' => 'Your Zipcode',
		'maxlength' => '5',
		'id' => 'foo',
		'style' => 'display:none'
	)) ?>
