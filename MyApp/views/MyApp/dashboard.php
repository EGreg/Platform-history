<div id='dashboard'>
	<h1>This is MyApp: </h1>
	<h2><?php echo Q_Html::text($slogan) ?></h2>

	<div id="dashboard_user">
		<?php if ($user): ?>
			<?php echo Q::tool("Users/avatar", array('user' => $user, 'icon' => true, 'short' => true)) ?>
		<?php else: ?>
			<a href="#login" class="MyApp_login">log in</a>
		<?php endif; ?>
		<div id="dashboard_user_contextual" class="Q_contextual" data-handler="MyApp.userContextual">
			 <ul class="Q_listing">
				 <li data-action="logout">log out</li>
			 </ul>
		</div>
	</div>
</div>
