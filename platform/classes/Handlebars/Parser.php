<?php
/**
 * Handlebars parser (based on mustache)
 *
 * This class is responsible for turning raw template source into a set of
 * Handlebars tokens.
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

class Handlebars_Parser
{
    /**
     * Process array of tokens and convert them into parse tree
     *
     * @param array $tokens Set of
     *
     * @return array Token parse tree
     */
    public function parse(Array $tokens = [])
    {
        return $this->buildTree(new ArrayIterator($tokens));
    }

    /**
     * Helper method for recursively building a parse tree.
     *
     * @param \ArrayIterator $tokens Stream of tokens
     *
     * @throws \LogicException when nesting errors or mismatched section tags
     * are encountered.
     * @return array Token parse tree
     *
     */
    private function buildTree(ArrayIterator $tokens)
    {
        $stack = [];

        do {
            $token = $tokens->current();
            $tokens->next();

            if ($token === null) {
                continue;
            } else {
                switch ($token[Handlebars_Tokenizer::TYPE]) {
                case Handlebars_Tokenizer::T_END_SECTION:
                    $newNodes = [];
                    do {
                        $result = array_pop($stack);
                        if ($result === null) {
                            throw new LogicException(
                                'Unexpected closing tag: /' . $token[Handlebars_Tokenizer::NAME]
                            );
                        }

                        if (!array_key_exists(Handlebars_Tokenizer::NODES, $result)
                            && isset($result[Handlebars_Tokenizer::NAME])
                            && $result[Handlebars_Tokenizer::NAME] == $token[Handlebars_Tokenizer::NAME]
                        ) {
                            $result[Handlebars_Tokenizer::NODES] = $newNodes;
                            $result[Handlebars_Tokenizer::END] = $token[Handlebars_Tokenizer::INDEX];
                            array_push($stack, $result);
                            break 2;
                        } else {
                            array_unshift($newNodes, $result);
                        }
                    } while (true);
                    break;
                default:
                    array_push($stack, $token);
                }
            }

        } while ($tokens->valid());

        return $stack;

    }

}
