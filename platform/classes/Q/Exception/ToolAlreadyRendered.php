<?php

/**
 * @module Q
 */
class Q_Exception_ToolAlreadyRendered extends Q_Exception
{
	/**
	 * @class Q_Exception_ToolAlreadyRendered
	 * @constructor
	 * @extends Q_Exception
	 * @param {string} $tool_name
	 * @param {string} $id
	 */
};

Q_Exception::add('Q_Exception_ToolAlreadyRendered', 'tool named "$tool_name" with id "$id" already rendered');
