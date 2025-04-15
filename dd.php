<?php


require './log_request.php';
require './conn.php';
//remember to change to conn
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");


//session_start();

header("Content-Type: application/json");

// Read the JSON data from the request body
$json = file_get_contents('php://input');
$data = json_decode($json, true); // true parameter to decode as an associative array


$content = print_r($data, true);

// wh_log($content); 
logRequest($content, $logFile);


if (isset($data['username']) && isset($data['otp'])) {
    $username = $data["username"];
    $otp = $data["otp"];

    $username = filter_var($username, FILTER_UNSAFE_RAW);

    $otp = filter_var($otp, FILTER_UNSAFE_RAW);

    $query = "SELECT * FROM users where username = '$username'";
    $result = $conn->query($query);
    $content = print_r($result, true);

    // wh_log($content);
    logRequest($content, $logFile);
    $resultsArray = array();
    if ($result) {
        if ($result->num_rows > 0) {
            // Initialize an array to store the results
            // $resultsArray = array();

            // Fetch the data and store it in the array
            while ($row = $result->fetch_assoc()) {
                $resultsArray[] = $row;
            }
        } else {
            $response = [
                'error' => 'Username incorrect',
                'status' => "400"
            ];
            $conn->close();
            header('Content-Type: application/json');
            //$conn->close();
            echo json_encode($response);
            exit();
        }
    } else {
        $response = [
            'error' => $result,
            'status' => "400"
        ];
        $conn->close();
        header('Content-Type: application/json');
        echo json_encode($response);
        exit();
    }
    $content = print_r('here', true);

    logRequest($content, $logFile);
    $dbOtp = $resultsArray[0]['otp'];
    $content = print_r($dbOtp, true);

    // wh_log($content);
    logRequest($content, $logFile);
    if ($otp == $dbOtp) {

        // Password is correct
        // Allow the user to log in
        $conn->close();

        logRequest($content, $logFile);
        $response = [
            'message' => 'otp correct',
            'status' => "200"
        ];
        header('Content-Type: application/json');

        echo json_encode($response);
        // Send the token as a response to the React app
        exit();
    } else {
        $response = [
            'error' => 'incorrect otp',
            'status' => "400"
        ];
        $conn->close();
        header('Content-Type: application/json');
        echo json_encode($response);
        exit();
    }
} else {
    $response = [
        'error' => 'Missing Parameters',
        'status' => "400"
    ];
    $conn->close();
    header('Content-Type: application/json');
    //$conn->close();
    echo json_encode($response);
    exit();
}
