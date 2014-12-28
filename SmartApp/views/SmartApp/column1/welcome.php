<div class="Q_column1_contents">
	<div class="SmartApp-column">
		<h1><?php echo Q_Html::img('img/logo/big.png', ' Qbix logo', array('id' => 'SmartApp-logo', 'class' => 'clickable')) ?></h1>
		<h1>SmartApp Template</h1>
		<h2>Just a little foundation for you to modify.</h2>
		
		<ul class="iphone SmartApp-nowrap">
		<?php foreach ($pages as $uri => $page): ?>
			<li class="SmartApp-page-link <?php if (!empty($page['selected'])) echo 'selected'; ?>"
			data-page="<?php echo Q_Uri::url($uri) ?>">
				<?php if (!empty($page['icon'])): ?>
					<?php echo Q_Html::img("img/".$page['icon']) ?>
				<?php endif; ?>
				<?php echo Q_Html::text($page['title']) ?>
			</li>
		<?php endforeach ?>
		</ul>
		
	</div>
</div>