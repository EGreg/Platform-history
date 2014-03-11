<?php
/**
 * Websites model
 * @module Websites
 * @main Websites
 */
/**
 * Static methods for the Websites models.
 * @class Websites
 * @extends Base_Websites
 */
abstract class Websites extends Base_Websites
{
	static function permalinksFilename()
	{
		return WEBSITES_PLUGIN_FILES_DIR.DS.'Websites'.DS.'permalinks.json';
	}
	
	static function fetchSeoStream($url = null)
	{
		if (!isset($url)) {
			$url = Q_Request::url();
			if (!isset($url)) {
				return null;
			}
		}
		$tail = Q_Request::tail($url);
		
	}
};