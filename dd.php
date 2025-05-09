<?php

require './conn.php'; // Include the database connection file


// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

function wh_log($log_msg, $level = 'INFO', $context = null)
{
    $log_filename = "neewlog";

    // Create the log directory if it doesn't exist
    if (!file_exists($log_filename)) {
        mkdir($log_filename, 0777, true);
    }

    // Define the log file name based on the current date
    $log_file_data = $log_filename . '/log_' . date('d-M-Y') . '.log';

    // Create a formatted log message
    $timestamp = date('Y-m-d H:i:s'); // Current timestamp
    $context_info = $context ? " | Context: " . json_encode($context) : ''; // Optional context information
    $formatted_log = "[{$timestamp}] [{$level}] : {$log_msg}{$context_info}\n";

    // Write the formatted log message to the log file with append mode
    file_put_contents($log_file_data, $formatted_log, FILE_APPEND);
}

// Log incoming request parameters
$requestDetails = print_r($_REQUEST, true);
wh_log("Received Request Parameters", 'INFO', $_REQUEST);

// Capture variables from $_REQUEST and validate them
$id = isset($_REQUEST['sMessageId']) ? $_REQUEST['sMessageId'] : null;
$status = isset($_REQUEST['sStatus']) ? $_REQUEST['sStatus'] : null;
$date = isset($_REQUEST['dtDone']) ? $_REQUEST['dtDone'] : null;
$err = isset($_REQUEST['ErrorCode']) ? $_REQUEST['ErrorCode'] : null;
$phone = isset($_REQUEST['sMobileNo']) ? $_REQUEST['sMobileNo'] : null;

if ($id) {
    wh_log("Searching for ID: {$id} in `messages` table", 'INFO');

    // $query = "SELECT * FROM messages WHERE response = '1701|$phone|$id'";
    $query = "SELECT * FROM messages WHERE response = '1701|$phone|$id' OR response = '1701|+$phone|$id'";


    wh_log("LOGGING QUERY", "INFO", $query);

    $result = $conn->query($query);
    if (!$result) {
        wh_log("Error executing query on messages table: " . $conn->error, 'ERROR');
        exit("Database query error.");
    }
    wh_log("Query executed successfully on `messages` table.", 'INFO');

    $url = '';
    $data = array();

    if ($result->num_rows > 0) {
        // Record found in messages table
        $row = $result->fetch_assoc();
        $data = array(
            "Id" => $row['id'],
            "Status" => $status == 'DELIVRD' ? 1 : 2,
            "ErrorCode" => $status == 'DELIVRD' ? '000' : '255',
            "DlrDate" => $date
        );

        // URL for messages table records
        $url = 'https://198.18.8.191:3000/dlrtrans';
        wh_log("Record found in `messages` table. Preparing to send data to messages URL.", 'INFO', $data);
    } else {
        wh_log("No record found in `messages` table. Checking `OTPmessages` table.", 'INFO');



        // Use the top query if $id has a hyphen
        $query = "SELECT * FROM OTPmessages WHERE response = '1701|$phone|$id' OR response = '1701|+$phone|$id'";





        //$query = "SELECT * FROM OTPmessages WHERE response = '1701|$phone|$id'";
        wh_log("LOGGING QUERY", "INFO", $query);

        $result = $conn->query($query);
        if (!$result) {
            wh_log("Error executing query on OTPmessages table: " . $conn->error, 'ERROR');
            exit("Database query error.");
        }
        if ($result->num_rows > 0) {
            // Record found in OTPmessages table
            $row = $result->fetch_assoc();
            $data = array(
                "Id" => $row['id'],
                "Status" => $status == 'DELIVRD' ? 1 : 2,
                "ErrorCode" => $status == 'DELIVRD' ? '000' : '255',
                "DlrDate" => $date
            );

            // URL for OTPmessages table records
            $url = 'https://198.18.8.191:3000/dlrotp';
            wh_log("Record found in `OTPmessages` table. Preparing to send data to OTPmessages URL.", 'INFO', $data);
        } else {
            wh_log("No record found in `OTPmessages` table. Checking `NonTrans_messages` table.", 'INFO');

            // Search in NonTrans_messages table if no record found in messages or OTPmessages
            //        $query = "SELECT * FROM NonTrans_messages WHERE response = '1701|$phone|$id'";

            // Use the top query if $id has a hyphen
            $query = "SELECT * FROM NonTrans_messages WHERE response = '1701|$phone|$id' OR response = '1701|+$phone|$id'";



            wh_log("LOGGING QUERY", "INFO", $query);



            $result = $conn->query($query);
            if (!$result) {
                wh_log("Error executing query on NonTrans_messages table: " . $conn->error, 'ERROR');
                exit("Database query error.");
            }

            if ($result->num_rows > 0) {
                // Record found in NonTrans_messages table
                $row = $result->fetch_assoc();
                $data = array(
                    "Id" => $row['id'],
                    "Status" => $status == 'DELIVRD' ? 1 : 2,
                    "ErrorCode" => $status == 'DELIVRD' ? '000' : '255',
                    "DlrDate" => $date
                );

                // URL for NonTrans_messages table records
                $url = 'https://198.18.8.191:3000/dlrnontrans';
                wh_log("Record found in `NonTrans_messages` table. Preparing to send data to NonTrans_messages URL.", 'INFO', $data);
            } else {
                // If no record found in any of the tables, handle the scenario
                wh_log("No matching record found in any table for ID: {$id}.", 'ERROR');
                echo "No matching record found in any table.";
                exit;
            }
        }
    }

    // Retrieve the token
    $sql = "SELECT token FROM token LIMIT 1";
    wh_log($sql);

    $result = $conn->query($sql);
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        $token = $row['token'];
    } else {
        wh_log("No token found in token table.", 'ERROR');
        exit("No token found.");
    }

    $jsonData = json_encode($data);

    // Check for empty URL or data
    if (empty($url) || empty($jsonData)) {
        wh_log("URL or JSON data is empty. Cannot send request.", 'ERROR');
        exit("URL or JSON data is empty.");
    }

    wh_log("Sending data to URL: {$url}", 'INFO', array('Payload' => $data));
    // Send the data using cURL
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Content-Type: application/json',
        'Authorization: Bearer ' . $token
    ));
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_TIMEOUT, 200);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        $errorMessage = curl_error($ch);
        wh_log("Curl error: {$errorMessage}", 'ERROR');
        echo 'Curl error: ' . $errorMessage;
    } else {
        $responseCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        wh_log("Response received from URL: " . $response . " with HTTP code: " . $responseCode, 'INFO');
        echo 'Response from URL: ' . $response;
    }

    curl_close($ch);
} else {
    wh_log("No ID provided in request.", 'ERROR');
    echo "No ID provided in request.";
}

$conn->close();
