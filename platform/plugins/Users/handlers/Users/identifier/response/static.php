<?php

function Users_identifier_response_static()
{
        // Calling this will fill the slots
        Q::tool('Users/identifier', array('_form_static' => true), array('inner' => true));
        return true;
}
