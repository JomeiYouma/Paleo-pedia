<?php
require 'config.php';

// Public Upload Allowed (for Drafts)
// Ideally restricts file types to images

// Increase memory limit for processing large images if needed
ini_set('memory_limit', '256M');

// Check for POST size limit violation (empty $_FILES but content-length > 0)
if (empty($_FILES) && empty($_POST) && isset($_SERVER['CONTENT_LENGTH']) && $_SERVER['CONTENT_LENGTH'] > 0) {
    http_response_code(413); // Payload Too Large
    echo json_encode(["error" => "File too large. Server Limit: " . ini_get('post_max_size')]);
    exit;
}

if (!isset($_FILES['image'])) {
    http_response_code(400);
    echo json_encode(["error" => "No file uploaded (Key 'image' missing)"]);
    exit;
}

$target_dir = "../images/";
if (!is_dir($target_dir))
    mkdir($target_dir, 0777, true);

$fileName = basename($_FILES["image"]["name"]);
// Basic sanitization
$fileName = preg_replace("/[^a-zA-Z0-9\._-]/", "", $fileName);
$target_file = $target_dir . $fileName;

// Check if image file is a actual image or fake image
$check = getimagesize($_FILES["image"]["tmp_name"]);
if ($check === false) {
    http_response_code(400);
    echo json_encode(["error" => "File is not an image."]);
    exit;
}

if (move_uploaded_file($_FILES["image"]["tmp_name"], $target_file)) {
    chmod($target_file, 0644); // Ensure web server can read it
    echo json_encode(["success" => true, "path" => "images/" . $fileName]);
} else {
    http_response_code(500);
    echo json_encode(["error" => "Sorry, there was an error uploading your file."]);
}
?>