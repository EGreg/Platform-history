<?php

/**
 * Autloader for Composer
 */

class Composer_Autoloader
{


require __DIR__ . '/vendor/autoload.php';


//    private $_baseDir;

    /**
     * Composer_Autoloader constructor.
     *
     * @param string $baseDir Composer base directory default is
     *                        __DIR__.'/..'
     */
 /*   protected function __construct($baseDir = null)
    {
        if ($baseDir === null) {
            $this->_baseDir = realpath(__DIR__ . '/..');
        } else {
            $this->_baseDir = rtrim($baseDir, '/');
        }
    }
*/

    /**
     * Register a new instance as an SPL autoloader.
     *
     * @param string $baseDir Composer base directory, default is
     *                        __DIR__.'/..'
     *
     * @return {Composer_Autoloader}
     */

/*    public static function register($baseDir = null)
    {
        $loader = new self($baseDir);
        spl_autoload_register(array($loader, 'autoload'));

//require_once "vendors/autoloader.php";

        return $loader;
    }
*/

/*
function autoLoader ($class) {
  if (file_exists(__DIR__.'/classes/'.$class.'.php')) {
    require __DIR__.'/classes/'.$class.'.php';
  }
}
spl_autoload_register('autoLoader');

*/

    /**
     * Autoload Composer classes.
     *
     * @param string $class class to load
     *
     * @return {void}
     */
/*    public function autoload($class)
    {
        if ($class[0] !== '\\') {
            $class = '\\' . $class;
        }

        if (strpos($class, 'Composer') !== 1) {
            return;
        }

        $file = sprintf(
            '%s%s.php',
            $this->_baseDir,
            str_replace('\\', '/', $class)
        );

        if (is_file($file)) {
            include $file;
        }
    }
*/

}