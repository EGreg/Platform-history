<div id="Q_dashboard_item_app" class="Q_dashboard_item">
	<?php echo Q_Html::img(Q_Html::themedUrl('img/logo.png')) ?>
	<span>Platform</span>
</div>
<div id="listing_slot" class="Q_main Q_dashboard_expandable">
	<?php echo Q::tool('SmartApp/listing', array('items' => $main_items)) ?>
</div>
<div id="Q_dashboard_item_documentation" class="Q_dashboard_item">
	<?php echo Q_Html::img(Q_Html::themedUrl('plugins/Q/img/icons/docs30.png')) ?>
	<span>Docs</span>
</div>
<div id="documentation_slot" class="Q_docs Q_dashboard_expandable">
	<?php echo Q::tool('SmartApp/listing', array('items' => $docs_items)) ?>
</div>
<?php echo Q::tool('Users/status', array(
	'icon' => 'plugins/Q/img/icons/login30.png',
	'menuItems' => array(
		array('contents' => 'Profile', 'action' => Q_Uri::url('QF/home')),
		array('contents' => 'Home', 'action' => Q_Uri::url('QF/home')),
		array('contents' => 'Settings', 'action' => Q_Uri::url('QF/home'))
	),
	'onMenuSelect' => 'SmartApp.userMenuHandler'
)); ?>
<div class="Q_dashboard_bottom_edge"></div>