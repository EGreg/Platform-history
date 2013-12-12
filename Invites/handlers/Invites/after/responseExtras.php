<?php

function Invites_after_responseExtras () {
	Q_Response::addScript('js/Invites.js');
	Q_Response::addStylesheet('plugins/Q/css/Ui.css');
}