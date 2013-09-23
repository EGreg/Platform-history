<?php

/**
 * @module Users
 */
class Users_Exception_NoSuchUser extends Q_Exception
{
	/**
	 * An exception is raised if user does not exists in the system
	 * @class Users_Exception_NoSuchUser
	 * @constructor
	 * @extends Q_Exception
	 */
};

Q_Exception::add('Users_Exception_NoSuchUser', 'there is no such user on the system');
