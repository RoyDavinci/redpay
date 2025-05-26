<?php

// Database connection details
$servername = "10.128.0.7";
$username = "ringoDB";
$password = "ringoGbosa1@#$";
$dbname = "ringo";

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$inputFile = 'lorisic1.csv';
$outputFile = 'output.csv';

$transCodes = [];

// Open the input CSV and collect trans_codes
if (($handle = fopen($inputFile, 'r')) !== false) {
    while (($data = fgetcsv($handle, 1000, ',')) !== false) {
        foreach ($data as $value) {
            $trimmed = trim($value);
            if (!empty($trimmed)) {
                $transCodes[] = $trimmed;
            }
        }
    }
    fclose($handle);
}

$outputData = [];
$outputData[] = ['request_id', 'trans_code', 'source', 'status', 'token'];

foreach ($transCodes as $code) {
    $code = trim($code);

    // Check bet_requests
    $stmt = $conn->prepare("SELECT trans_code, status FROM bet_requests WHERE request_id = ?");
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $status = $row['status'] === '1' ? 'Successful' : ($row['status'] === '2' ? 'Failed' : 'Pending');
        $outputData[] = ["'" . $code, "'" . $row['trans_code'], 'bet_requests', "'" . $status, ''];
        continue;
    }

    // Check disco_requests
    $stmt = $conn->prepare("SELECT trans_code, status, response FROM disco_requests WHERE request_id = ?");
    $stmt->bind_param("s", $code);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $status = $row['status'] === '1' ? 'Successful' : ($row['status'] === '2' ? 'Failed' : 'Pending');
        $responseJson = json_decode($row['response'], true);
        $token = isset($responseJson['token']) ? $responseJson['token'] : '';
        $outputData[] = ["'" .  $code, "'" . $row['trans_code'], 'disco_requests', "'" . $status, "," . $token];
        continue;
    }

    // Not found in either table
    $outputData[] = [$code, '', 'not_found', 'Not Found', ''];
}

// Write to output CSV
if (($handle = fopen($outputFile, 'w')) !== false) {
    foreach ($outputData as $row) {
        fputcsv($handle, $row);
    }
    fclose($handle);
    echo "Output written to $outputFile\n";
} else {
    echo "Failed to open $outputFile for writing.\n";
}
