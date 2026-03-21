<?php
require 'config.php';

$input = json_decode(file_get_contents('php://input'), true);

if ($input === null && json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid JSON: " . json_last_error_msg()]);
    exit;
}

$file = isset($_GET['file']) ? $_GET['file'] : 'cartels';
$filename = '../data/db_cartels.json';
if ($file === 'drafts')
    $filename = '../data/db_drafts.json';
if ($file === 'workshops')
    $filename = '../data/db_workshops.json';
if ($file === 'config')
    $filename = '../data/db_config.json';

// Security: Only allow writing to 'cartels' or 'workshops' if Authenticated
if ($file === 'cartels' || $file === 'workshops' || $file === 'config') {
    checkAuth();
}

// Safety check: Avoid overwriting arrays with objects (e.g. saving config into cartels)
if ($file === 'cartels' || $file === 'drafts' || $file === 'workshops') {
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(["error" => "Expected array for $file data"]);
        exit;
    }
}

// Drafts are open for submission (Public)

if (!is_dir('../data'))
    mkdir('../data', 0777, true);

// Read existing to minimize race conditions (primitive locking)
// In a real DB this is handled better, here JSON file replace
// We expect the Payload to be the COMPLETE list or a Delta?
// REACT APP sends the COMPLETE DB usually.
// ISSUE: If 2 visitors submit at same time, one overwrites.
// BETTER: The API should accept ONE item and append it.
// BUT: The current architecture in AppContext `addCartel` usually creates a new array and saves it.
// REFACTOR: `phpService` should act like `githubService` which commits the whole file.
// RISK: Race condition.
// FIX: For Drafts (Submission), let's make the PHP script Append-Only or handle the Merge?
// NO, sticking to "Simple Replacement" provided the App handles state. With separate visitors, they don't have the full state of OTHER visitors drafts unless they reload.
// This is the flaw of JSON-DB.
// DECISION: For this "Proto-Production", we accept Last-Write-Wins.
// Ideally, the App sends "Add Item X".
// Let's implement full Write for now to match `githubService.saveContent`.

// BACKUP SYSTEM
// 1. Create backup dir if not exists
$backupDir = '../data/backups';
if (!is_dir($backupDir)) {
    mkdir($backupDir, 0777, true);
}

// 2. Copy current file to backup if it exists
if (file_exists($filename)) {
    $timestamp = date('Ymd_His');
    $backupFile = $backupDir . '/' . basename($filename, '.json') . '_' . $timestamp . '.json';
    copy($filename, $backupFile);

    // 3. Rotate backups (Keep last 10)
    $files = glob($backupDir . '/' . basename($filename, '.json') . '_*.json');
    if (count($files) > 10) {
        // Sort specifically by time in filename if standard sorting is not enough, but default glob+timestamp usually sorts OLD to NEW
        usort($files, function ($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        // Delete oldest until 10 remain
        while (count($files) > 10) {
            $toDelete = array_shift($files);
            unlink($toDelete);
        }
    }
}

file_put_contents($filename, json_encode($input, JSON_PRETTY_PRINT));

echo json_encode(["success" => true, "count" => count($input)]);
?>