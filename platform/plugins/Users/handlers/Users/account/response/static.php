<?php

function Users_account_response_static()
{
        // Calling this will fill the slots
        Q::tool('Users/account', array('_form_static' => true), array('inner' => true));
        return true;
}


