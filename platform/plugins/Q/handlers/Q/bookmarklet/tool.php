<?php

/**
 * Makes an infomation block for adding a bookmarklet on the browser's bookmarks bar
 * the way similar to how facebook does: http://www.facebook.com/share_options.php .
 * Main purpose of the tool is to present in cross-browser way how bookmarklet button will look, how bookmarklet will
 * look on browser panel and instructions how to add bookmarklet to that panel.
 * @param {array} $options
 *   An associative array of parameters, which can include:
 *   "content" => Required. Javascript code or url of the script.
 *   "title" => Required. Title for the button which will be added to user's browser bar.
 *   "usage" => Required. Text which is appended to instructions, identifying purpose and usage of this bookmarklet.
 *   "icon" => Optional. Icon for the button which will be added to user's browser bar.
 *   Can contain placeholders supported by strftime() and also few special placeholders with specific functionality.
 * @return {string}
 */
function Q_bookmarklet_tool($options)
{
  Q_Response::addScript('plugins/Q/js/tools/bookmarklet.js');
  Q_Response::addStylesheet('plugins/Q/css/Ui.css');
  
  $defaults = array(
		'icon' => null
  );
  //$options['content'] = addslashes($options['content']);
  $options = array_merge($defaults, $options);
  Q_Response::setToolOptions($options);
  return '';
}
