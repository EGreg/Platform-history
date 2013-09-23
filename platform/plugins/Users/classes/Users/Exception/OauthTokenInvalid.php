<?php

/**
 * @module Users
 */
class Users_Exception_OauthTokenInvalid extends Q_Exception
{
	/**
	 * An exception is raised if oAuth token is invalid
	 * @class Users_Exception_OauthTokenInvalid
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_OauthTokenInvalid', 'Oauth token invalid');
