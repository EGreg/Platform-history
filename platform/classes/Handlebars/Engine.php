<?php
/**
 * This file is part of Handlebars-php
 * Based on mustache-php https://github.com/bobthecow/mustache.php
 *
 * PHP version 5.2
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Jeff Turcotte <jeff.turcotte@gmail.com>
 * @copyright 2010-2012 (c) Justin Hileman
 * @copyright 2012 (c) ParsPooyesh Co
 * @copyright 2013 (c) Behrooz Shabani
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   GIT: $Id$
 * @link      http://xamin.ir
 */

/**
 * Handlebars template engine, based on mustache.
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @copyright 2012 (c) ParsPooyesh Co
 * @license   MIT <http://opensource.org/licenses/MIT>
 * @version   Release: @package_version@
 * @link      http://xamin.ir
 */

class Handlebars_Engine
{
    private static $_instance = false;
    const VERSION = '1.0.0';

    /**
     * factory method
     *
     * @param array $options see __construct's options parameter
     *
     * @return {Handlebars}
     */
    public static function factory($options = array())
    {
        if (self::$_instance === false) {
            self::$_instance = new Handlebars_Engine($options);
        }

        return self::$_instance;
    }

    /**
     * @var Handlebars_Tokenizer
     */
    private $_tokenizer;

    /**
     * @var Handlebars_Parser
     */
    private $_parser;

    /**
     * @var Handlebars_Helpers
     */
    private $_helpers;

    /**
     * @var Handlebars_Loader
     */
    private $_loader;

    /**
     * @var Handlebars_Loader
     */
    private $_partialsLoader;

    /**
     * @var Handlebars_Cache
     */
    private $_cache;

    /**
     * @var string the class to use for the template
     */
    private $_templateClass = 'Handlebars_Template';

    /**
     * @var callable escape function to use
     */
    private $_escape = 'htmlspecialchars';

    /**
     * @var array parametes to pass to escape function
     */
    private $_escapeArgs = array(
        ENT_COMPAT,
        'UTF-8'
    );

    private $_aliases = array();

    /**
     * Handlebars engine constructor
     * $options array can contain :
     * helpers        => Handlebars_Helpers object
     * escape         => a callable function to escape values
     * escapeArgs     => array to pass as extra parameter to escape function
     * loader         => Handlebars_Loader object
     * partials_loader => Handlebars_Loader object
     * cache          => Handlebars_Cache object
     * template_class => the class to use for the template object
     *
     * @param array $options array of options to set
     *
     * @throws {$1}
     */
    public function __construct(array $options = array())
    {
        if (isset($options['helpers'])) {
            $this->setHelpers($options['helpers']);
        }

        if (isset($options['loader'])) {
            $this->setLoader($options['loader']);
        }

        if (isset($options['partials_loader'])) {
            $this->setPartialsLoader($options['partials_loader']);
        }

        if (isset($options['cache'])) {
            $this->setCache($options['cache']);
        }

        if (isset($options['template_class'])) {
            $this->setTemplateClass($options['template_class']);
        }

        if (isset($options['escape'])) {
            if (!is_callable($options['escape'])) {
                throw new InvalidArgumentException(
                    'Handlebars Constructor "escape" option must be callable'
                );
            }

            $this->_escape = $options['escape'];
        }

        if (isset($options['escapeArgs'])) {
            if (!is_array($options['escapeArgs'])) {
                $options['escapeArgs'] = array($options['escapeArgs']);
            }
            $this->_escapeArgs = $options['escapeArgs'];
        }

        if (isset($options['partials_alias'])
            && is_array($options['partials_alias'])
        ) {
            $this->_aliases = $options['partials_alias'];
        }
    }


    /**
     * Shortcut 'render' invocation.
     *
     * Equivalent to calling `$handlebars->loadTemplate($template)->render($data);`
     *
     * @param string $template template name
     * @param mixed  $data     data to use as context
     *
     * @return {string} Rendered template
     * @see Handlebars_Engine::loadTemplate
     * @see Handlebars_Template::render
     */
    public function render($template, $data)
    {
        return $this->loadTemplate($template)->render($data);
    }

    /**
     * Set helpers for current enfine
     *
     * @param Handlebars_Helpers $helpers handlebars helper
     *
     * @return {void} Handlebars_helpers
     */
    public function setHelpers(Handlebars_Helpers $helpers)
    {
        $this->_helpers = $helpers;
    }

    /**
     * Get helpers, or create new one if ther is no helper
     *
     * @return {void}
     */
    public function getHelpers()
    {
        if (!isset($this->_helpers)) {
            $this->_helpers = new Handlebars_Helpers();
        }

        return $this->_helpers;
    }

    /**
     * Add a new helper.
     *
     * @param string $name   helper name
     * @param mixed  $helper helper callable
     *
     * @return {callable} Handlebars_Helper
     */
    public function addHelper($name, $helper)
    {
        $this->getHelpers()->add($name, $helper);
    }

    /**
     * Get a helper by name.
     *
     * @param string $name helper name
     *
     * @return {boolean} True if helper is present
     */
    public function getHelper($name)
    {
        return $this->getHelpers()->__get($name);
    }

    /**
     * Check whether this instance has a helper.
     *
     * @param string $name helper name
     *
     * @return {void}
     */
    public function hasHelper($name)
    {
        return $this->getHelpers()->has($name);
    }

    /**
     * Remove a helper by name.
     *
     * @param string $name helper name
     *
     * @return {void}
     */
    public function removeHelper($name)
    {
        $this->getHelpers()->remove($name);
    }

    /**
     * Set current loader
     *
     * @param Handlebars_Loader $loader handlebars loader
     *
     * @return {void}
     */
    public function setLoader(Handlebars_Loader $loader)
    {
        $this->_loader = $loader;
    }

    /**
     * get current loader
     *
     * @return {Handlebars_Loader}
     */
    public function getLoader()
    {
        if (!isset($this->_loader)) {
            $this->_loader = new Handlebars_Loader_StringLoader();
        }

        return $this->_loader;
    }

    /**
     * Set current partials loader
     *
     * @param Handlebars_Loader $loader handlebars loader
     *
     * @return {void}
     */
    public function setPartialsLoader(Handlebars_Loader $loader)
    {
        $this->_partialsLoader = $loader;
    }

    /**
     * get current partials loader
     *
     * @return {Handlebars_loader}
     */
    public function getPartialsLoader()
    {
        if (!isset($this->_partialsLoader)) {
            $this->_partialsLoader = new Handlebars_Loader_StringLoader();
        }

        return $this->_partialsLoader;
    }

    /**
     * Set cache  for current engine
     *
     * @param Handlebars_Cache $cache handlebars cache
     *
     * @return {void}
     */
    public function setCache(Handlebars_Cache $cache)
    {
        $this->_cache = $cache;
    }

    /**
     * Get cache
     *
     * @return {Handlebars_Cache}
     */
    public function getCache()
    {
        if (!isset($this->_cache)) {
            $this->_cache = new Dummy();
        }

        return $this->_cache;
    }

    /**
     * Get current escape function
     *
     * @return {callable}
     */
    public function getEscape()
    {
        return $this->_escape;
    }

    /**
     * Set current escape function
     *
     * @param callable $escape function
     *
     * @throws {$1}
     * @return {void}
     */
    public function setEscape($escape)
    {
        if (!is_callable($escape)) {
            throw new InvalidArgumentException(
                'Escape function must be a callable'
            );
        }
        $this->_escape = $escape;
    }

    /**
     * Get current escape function
     *
     * @return {array}
     */
    public function getEscapeArgs()
    {
        return $this->_escapeArgs;
    }

    /**
     * Set current escape function
     *
     * @param array $escapeArgs arguments to pass as extra arg to function
     *
     * @return {void}
     */
    public function setEscapeArgs($escapeArgs)
    {
        if (!is_array($escapeArgs)) {
            $escapeArgs = array($escapeArgs);
        }
        $this->_escapeArgs = $escapeArgs;
    }


    /**
     * Set the Handlebars Handlebars_Tokenizer instance.
     *
     * @param Handlebars_Tokenizer $tokenizer tokenizer
     *
     * @return {void}
     */
    public function setTokenizer(Handlebars_Tokenizer $tokenizer)
    {
        $this->_tokenizer = $tokenizer;
    }

    /**
     * Get the current Handlebars Handlebars_Tokenizer instance.
     *
     * If no Handlebars_Tokenizer instance has been explicitly specified, this method will
     * instantiate and return a new one.
     *
     * @return {Handlebars_Tokenizer}
     */
    public function getTokenizer()
    {
        if (!isset($this->_tokenizer)) {
            $this->_tokenizer = new Handlebars_Tokenizer();
        }

        return $this->_tokenizer;
    }

    /**
     * Set the Handlebars Handlebars_Parser instance.
     *
     * @param Handlebars_Parser $parser parser object
     *
     * @return {void}
     */
    public function setParser(Handlebars_Parser $parser)
    {
        $this->_parser = $parser;
    }

    /**
     * Get the current Handlebars Handlebars_Parser instance.
     *
     * If no Handlebars_Parser instance has been explicitly specified, this method will
     * instantiate and return a new one.
     *
     * @return {Handlebars_Parser}
     */
    public function getParser()
    {
        if (!isset($this->_parser)) {
            $this->_parser = new Handlebars_Parser();
        }

        return $this->_parser;
    }

    /**
     * Sets the class to use for the template object
     *
     * @param string $class the class name
     *
     * @return {void}
     */
    public function setTemplateClass($class)
    {
        if (!is_a($class, 'Handlebars_Template', true)) {
            throw new InvalidArgumentException(
                'Custom template class must extend Handlebars_Template'
            );
        }

        $this->_templateClass = $class;
    }

    /**
     * Load a template by name with current template loader
     *
     * @param string $name template name
     *
     * @return {Handlebars_Template}
     */
    public function loadTemplate($name)
    {
        $source = $this->getLoader()->load($name);
        $tree = $this->_tokenize($source);

        return new $this->_templateClass($this, $tree, $source);
    }

    /**
     * Load a partial by name with current partial loader
     *
     * @param string $name partial name
     *
     * @return {Handlebars_Template}
     */
    public function loadPartial($name)
    {
        if (isset($this->_aliases[$name])) {
            $name = $this->_aliases[$name];
        }
        $source = $this->getPartialsLoader()->load($name);
        $tree = $this->_tokenize($source);

        return new $this->_templateClass($this, $tree, $source);
    }

    /**
     * Register partial alias
     *
     * @param string $alias   Partial alias
     * @param string $content The real value
     *
     * @return {void}
     */
    public function registerPartial($alias, $content)
    {
        $this->_aliases[$alias] = $content;
    }

    /**
     * Un-register partial alias
     *
     * @param string $alias Partial alias
     *
     * @return {void}
     */
    public function unRegisterPartial($alias)
    {
        if (isset($this->_aliases[$alias])) {
            unset($this->_aliases[$alias]);
        }
    }

    /**
     * Load string into a template object
     *
     * @param string $source string to load
     *
     * @return {Handlebars_Template}
     */
    public function loadString($source)
    {
        $tree = $this->_tokenize($source);

        return new $this->_templateClass($this, $tree, $source);
    }

    /**
     * try to tokenize source, or get them from cache if available
     *
     * @param string $source handlebars source code
     *
     * @return {array} Handlebarsparsed data into array
     */
    private function _tokenize($source)
    {
        $hash = md5(sprintf('version: %s, data : %s', self::VERSION, $source));
        $tree = $this->getCache()->get($hash);
        if ($tree === false) {
            $tokens = $this->getTokenizer()->scan($source);
            $tree = $this->getParser()->parse($tokens);
            $this->getCache()->set($hash, $tree);
        }

        return $tree;
    }

}
