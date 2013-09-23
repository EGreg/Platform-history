<?php

function SmartApp_home_response_column1()
{
	// sample player contents
	$players = array();
	for ($i = 0; $i < 5; $i++)
	{
		$players[$i] = "<h3>Test player #" . ($i + 1) . " contents</h3>\n";
		$players[$i] .= "<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed porttitor, justo at feugiat venenatis, tellus sem ultrices felis, at faucibus augue lectus et lectus. Nulla nec nisi quis lectus posuere fringilla eget vulputate magna. Sed non sapien in mi pretium aliquet. Nullam lacus tortor, interdum sit amet ullamcorper sed, porttitor ac arcu. Nulla eu est dolor. Vestibulum at consequat dolor. Pellentesque interdum augue massa. Nunc molestie pulvinar lacus vitae cursus. Suspendisse eu leo arcu. Morbi feugiat mattis elit nec tincidunt. Vestibulum tincidunt risus non metus euismod eu vestibulum est ullamcorper.</p>\n";
	}
	return Q::view('SmartApp/column1/welcome.php', compact('players'));
}
