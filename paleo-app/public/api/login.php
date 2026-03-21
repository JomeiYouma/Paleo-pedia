<?php
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);
$password = isset($input['password']) ? $input['password'] : '';

// Validate against the config password hash
if (hash('sha256', $password) === $ADMIN_PASSWORD_HASH) {
    echo json_encode(["success" => true]);
} else {
    http_response_code(401);
    echo json_encode(["error" => "Invalid password"]);
}
?>