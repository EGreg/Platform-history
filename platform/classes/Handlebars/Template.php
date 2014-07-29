<?php
/**
 * Handlebars base template
 * contain some utility method to get context and helpers
 *
 * @category  Xamin
 * @package   Handlebars
 * @author    fzerorubigd <fzerorubigd@gmail.com>
 * @author    Behrooz Shabani <everplays@gmail.com>
 * @author    Mardix <https://github.com/mardix>
 * @copyright 2012 (c) ParsPooyesh Co
 * @copyright 2013 (c) Behrooz Shabani
 * @copyright 2013 (c) Mardix
 * @license   MIT
 * @link      http://voodoophp.org/docs/handlebars
 */


class Handlebars_Template
{
    /**
     * @var Handlebars
     */
    protected $handlebars;


    protected $tree = array();

    protected $source = '';

    /**
     * @var array Run stack
     */
    private $stack = array();
    private $_stack = array();

    /**
     * Handlebars template constructor
     *
     * @param Handlebars $engine handlebar engine
     * @param array      $tree   Parsed tree
     * @param string     $source Handlebars source
     */
    public function __construct(Handlebars_Engine $engine, $tree, $source)
    {
        $this->handlebars = $engine;
        $this->tree = $tree;
        $this->source = $source;
        array_push($this->stack, array(0, $this->getTree(), false));

    }

    /**
     * Get current tree
     *
     * @return array
     */
    public function getTree()
    {
        return $this->tree;
    }

    /**
     * Get current source
     *
     * @return string
     */
    public function getSource()
    {
        return $this->source;
    }

    /**
     * Get current engine associated with this object
     *
     * @return Handlebars
     */
    public function getEngine()
    {
        return $this->handlebars;
    }

    /**
     * set stop token for render and discard method
     *
     * @param string $token token to set as stop token or false to remove
     *
     * @return void
     */

    public function setStopToken($token)
    {
        $this->_stack = $this->stack;
        $topStack = array_pop($this->stack);
        $topStack[2] = $token;
        array_push($this->stack, $topStack);
    }

    /**
     * get current stop token
     *
     * @return string|bool
     */

    public function getStopToken()
    {
		$result = end($this->stack);
        return $result[2];
    }

    /**
     * Render top tree
     *
     * @param mixed $context current context
     *
     * @throws RuntimeInvalidArgumentException
     * @return string
     */
    public function render($context)
    {
        if (!$context instanceof Handlebars_Context) {
            $context = new Handlebars_Context($context);
        }
        $topTree = end($this->stack); // never pop a value from stack
        list($index, $tree, $stop) = $topTree;

        $buffer = '';
        while (array_key_exists($index, $tree)) {
            $current = $tree[$index];
            $index++;
            //if the section is exactly like waitFor
            if (is_string($stop)
                && $current[Handlebars_Tokenizer::TYPE] == Handlebars_Tokenizer::T_ESCAPED
                && $current[Handlebars_Tokenizer::NAME] === $stop
            ) {
                break;
            }
            switch ($current[Handlebars_Tokenizer::TYPE]) {
            case Handlebars_Tokenizer::T_SECTION :
                $newStack = isset($current[Handlebars_Tokenizer::NODES])
                    ? $current[Handlebars_Tokenizer::NODES] : array();
                array_push($this->stack, array(0, $newStack, false));
                $buffer .= $this->section($context, $current);
                array_pop($this->stack);
                break;
            case Handlebars_Tokenizer::T_INVERTED :
                $newStack = isset($current[Handlebars_Tokenizer::NODES]) ?
                    $current[Handlebars_Tokenizer::NODES] : array();
                array_push($this->stack, array(0, $newStack, false));
                $buffer .= $this->inverted($context, $current);
                array_pop($this->stack);
                break;
            case Handlebars_Tokenizer::T_COMMENT :
                $buffer .= '';
                break;
            case Handlebars_Tokenizer::T_PARTIAL:
            case Handlebars_Tokenizer::T_PARTIAL_2:
                $buffer .= $this->partial($context, $current);
                break;
            case Handlebars_Tokenizer::T_UNESCAPED:
            case Handlebars_Tokenizer::T_UNESCAPED_2:
                $buffer .= $this->variables($context, $current, false);
                break;
            case Handlebars_Tokenizer::T_ESCAPED:
                $buffer .= $this->variables($context, $current, true);
                break;
            case Handlebars_Tokenizer::T_TEXT:
                $buffer .= $current[Handlebars_Tokenizer::VALUE];
                break;
            default:
                throw new RuntimeInvalidArgumentException(
                    'Invalid node type : ' . json_encode($current)
                );
            }
        }
        if ($stop) {
            //Ok break here, the helper should be aware of this.
            $newStack = array_pop($this->stack);
            $newStack[0] = $index;
            $newStack[2] = false; //No stop token from now on
            array_push($this->stack, $newStack);
        }

        return $buffer;
    }

    /**
     * Discard top tree
     *
     * @param mixed $context current context
     *
     * @return string
     */
    public function discard()
    {
        $topTree = end($this->stack); //This method never pop a value from stack
        list($index, $tree, $stop) = $topTree;
        while (array_key_exists($index, $tree)) {
            $current = $tree[$index];
            $index++;
            //if the section is exactly like waitFor
            if (is_string($stop)
                && $current[Handlebars_Tokenizer::TYPE] == Handlebars_Tokenizer::T_ESCAPED
                && $current[Handlebars_Tokenizer::NAME] === $stop
            ) {
                break;
            }
        }
        if ($stop) {
            //Ok break here, the helper should be aware of this.
            $newStack = array_pop($this->stack);
            $newStack[0] = $index;
            $newStack[2] = false;
            array_push($this->stack, $newStack);
        }

        return '';
    }

    /**
     * Process section nodes
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @throws RuntimeInvalidArgumentException
     * @return string the result
     */
    private function section(Handlebars_Context $context, $current)
    {
        $helpers = $this->handlebars->getHelpers();
        $sectionName = $current[Handlebars_Tokenizer::NAME];
        if ($helpers->has($sectionName)) {
            if (isset($current[Handlebars_Tokenizer::END])) {
                $source = substr(
                    $this->getSource(),
                    $current[Handlebars_Tokenizer::INDEX],
                    $current[Handlebars_Tokenizer::END] - $current[Handlebars_Tokenizer::INDEX]
                );
            } else {
                $source = '';
            }
            $params = array(
                $this, //First argument is this template
                $context, //Second is current context
                $current[Handlebars_Tokenizer::ARGS], //Arguments
                $source
            );

            $return = call_user_func_array($helpers->$sectionName, $params);
            if ($return instanceof Handlebars_String) {
                return $this->handlebars->loadString($return)->render($context);
            } else {
                return $return;
            }
        } elseif (trim($current[Handlebars_Tokenizer::ARGS]) == '') {
            // fallback to mustache style each/with/for just if there is
            // no argument at all.
            try {
                $sectionVar = $context->get($sectionName, true);
            } catch (InvalidArgumentException $e) {
                throw new RuntimeInvalidArgumentException(
                    $sectionName . ' is not registered as a helper'
                );
            }
            $buffer = '';
            if (is_array($sectionVar) || $sectionVar instanceof Traversable) {
                foreach ($sectionVar as $index => $d) {
                    $context->pushIndex($index);
                    $context->push($d);
                    $buffer .= $this->render($context);
                    $context->pop();
                    $context->popIndex();
                }
            } elseif (is_object($sectionVar)) {
                //Act like with
                $context->push($sectionVar);
                $buffer = $this->render($context);
                $context->pop();
            } elseif ($sectionVar) {
                $buffer = $this->render($context);
            }

            return $buffer;
        } else {
            throw new RuntimeInvalidArgumentException(
                $sectionName . ' is not registered as a helper'
            );
        }
    }

    /**
     * Process inverted section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @return string the result
     */
    private function inverted(Handlebars_Context $context, $current)
    {
        $sectionName = $current[Handlebars_Tokenizer::NAME];
        $data = $context->get($sectionName);
        if (!$data) {
            return $this->render($context);
        } else {
            //No need to discard here, since it has no else
            return '';
        }
    }

    /**
     * Process partial section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     *
     * @return string the result
     */
    private function partial(Handlebars_Context $context, $current)
    {
        $partial = $this->handlebars->loadPartial($current[Handlebars_Tokenizer::NAME]);

        if ($current[Handlebars_Tokenizer::ARGS]) {
            $context = $context->get($current[Handlebars_Tokenizer::ARGS]);
        }

        return $partial->render($context);
    }

    /**
     * Process partial section
     *
     * @param Handlebars_Context $context current context
     * @param array   $current section node data
     * @param boolean $escaped escape result or not
     *
     * @return string the result
     */
    private function variables(Handlebars_Context $context, $current, $escaped)
    {
        $name = $current[Handlebars_Tokenizer::NAME];
        $value = $context->get($name);
        if ($name == '@index') {
            return $context->lastIndex();
        }
        if ($name == '@key') {
            return $context->lastKey();
        }
        if ($escaped) {
            $args = $this->handlebars->getEscapeArgs();
            array_unshift($args, $value);
            $value = call_user_func_array(
                $this->handlebars->getEscape(),
                array_values($args)
            );
        }

        return $value;
    }

    public function __clone()
    {
        return $this;
    }
}
