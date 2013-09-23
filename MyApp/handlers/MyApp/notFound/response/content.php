<?php

function MyApp_notFound_response_content($params)
{
        header("HTTP/1.0 404 Not Found");
        $url = Q_Request::url();
        return Q::view("MyApp/content/notFound.php", compact('url'));
}

