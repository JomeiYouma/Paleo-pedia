<?php
// Configuration Simple
// NOTE: Change this password on deployment!
// Hashed Password (SHA-256 of 'admin')
$ADMIN_PASSWORD_HASH = "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918";

// Allow CORS during development (if React runs on 5173 and PHP on 80)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function isAdmin()
{
    global $ADMIN_PASSWORD_HASH;
    $auth = '';
    if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (isset($headers['Authorization'])) {
            $auth = $headers['Authorization'];
        }
    }

    if (empty($auth) && isset($_GET['token'])) {
        $auth = 'Bearer ' . $_GET['token'];
    }

    if (strpos($auth, 'Bearer ') === 0) {
        $provided_password = substr($auth, 7);
        if (hash('sha256', $provided_password) === $ADMIN_PASSWORD_HASH) {
            return true;
        }
    }
    return false;
}

function checkAuth()
{
    if (isAdmin()) {
        return true;
    }
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}



?>