<?php
require 'config.php';

$file = isset($_GET['file']) ? $_GET['file'] : 'cartels';
$filename = '../data/db_cartels.json';
if ($file === 'drafts')
    $filename = '../data/db_drafts.json';
if ($file === 'workshops')
    $filename = '../data/db_workshops.json';
if ($file === 'config') {
    checkAuth(); // REQUIRE AUTH to read config
    $filename = '../data/db_config.json';
}

// Ensure data directory exists
if (!is_dir('../data')) {
    mkdir('../data', 0777, true);
}

// Create file if not exists
if (!file_exists($filename)) {
    file_put_contents($filename, '[]');
}

header('Content-Type: application/json');
readfile($filename);
?>