<?php

/**
 * Websites/seo tool
 */
function Websites_seo_tool($params)
{
	Q_Response::addStylesheet('plugins/Websites/css/Websites.css');
	Q_Response::addScript("plugins/Websites/js/Websites.js");
	Q_Response::setToolOptions($params);
}