<?php

function Users_before_Q_init()
{
	$facebook_apps = Q_Config::get('Users', 'facebookApps', array());
	foreach ($facebook_apps as $appId => $fb_info) {
		if (isset($fb_info['url']) and isset($fb_info['addProxy'])) {
			$subpath = isset($fb_info['subpath']) ? $fb_info['subpath'] : '';
			Q_Config::set('Q', 'proxies', Q_Request::baseUrl(true).$subpath, $fb_info['url']);
		}
	}
}
