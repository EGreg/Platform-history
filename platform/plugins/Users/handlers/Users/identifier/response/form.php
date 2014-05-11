<?php

function Users_identifier_response_form()
{
    // Calling this will fill the slots
    Q::tool('Users/identifier', array('_form_static' => true), array('tag' => null));
    return true;
}
