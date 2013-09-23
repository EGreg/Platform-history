<?php echo Q_Response::scripts("\n\t") ?>

<?php 
if (Q_Config::get('Q', 'socketbug', 'on', false))
{
	$app = Q_Config::expect('Q', 'app');
	$host = Q_Config::get('Q', 'socketbug', 'host', 'localhost');
	$port = Q_Config::get('Q', 'socketbug', 'port', '8080');
	$scriptUrl = Q_Config::get('Q', 'socketbug', 'scriptUrl', '');
	echo
<<<EOT

<script type="text/javascript">
	var _sbs = _sbs || {
		'version': '0.2.0',
		'host': 'http://$host',
		'port': $port,
		'group_id': '49415D06-BFE5-5464-2135-3D48B6BBEF6F',
		'group_name': 'Qbix',
		'application_id': '9F199338-6C8A-6FF4-3DB6-C94B0626646C',
		'application_name': '$app',
		'debug_level': 5
	};
</script>
<script src="$scriptUrl" type="text/javascript"></script>

EOT;
}
?>

<?php echo Q_Html::script(Q_Response::scriptLines()) ?>