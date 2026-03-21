<?php
// proxy_deepl.php
// Proxies translation requests to DeepL to avoid CORS issues and expose API Key issues (if key was on server)
// Here key is sent by client, but we need proxy for CORS usually on Free tier, or just consistency.

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$input = json_decode(file_get_contents('php://input'), true);

// SECURE: Load API Key from server-side config
$configFile = '../data/db_config.json';
$serverConfig = [];
if (file_exists($configFile)) {
    $serverConfig = json_decode(file_get_contents($configFile), true);
}

// User-provided key (via Input) is IGNORED in favor of Server Key for security,
// unless server key is missing.
$authKey = isset($serverConfig['openaiKey']) ? $serverConfig['openaiKey'] : (isset($input['auth_key']) ? $input['auth_key'] : '');

if (!$authKey) {
    http_response_code(500);
    echo json_encode(["error" => "Server misconfiguration: No API Key found."]);
    exit;
}
$isPro = strpos($authKey, ':fx') === false;
// Logic: Free keys usually end in :fx. Pro keys don't.
// Wait, official docs: "DeepL API Free authentication keys end with :fx"
// So if it has :fx, it is FREE. 
// However, the endpoint differs.
// Free: https://api-free.deepl.com/v2/translate
// Pro: https://api.deepl.com/v2/translate

$url = 'https://api.deepl.com/v2/translate';
if (strpos($authKey, ':fx') !== false) {
    $url = 'https://api-free.deepl.com/v2/translate';
}

// Prepare payload for DeepL (JSON format is cleaner and supports arrays natively)
$deeplPayload = [
    'text' => $input['text'],
    'target_lang' => $input['target_lang']
];

if (isset($input['source_lang']) && $input['source_lang']) {
    $deeplPayload['source_lang'] = $input['source_lang'];
}

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($deeplPayload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: DeepL-Auth-Key ' . $authKey,
    'Content-Type: application/json'
]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Fix for local dev environments lacking certs

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(["error" => curl_error($ch)]);
} else {
    http_response_code($httpCode);
    echo $response;
}

curl_close($ch);
?>