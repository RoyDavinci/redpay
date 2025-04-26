<?php
// Include the database connection file
require './conn.php'; // Ensure this path is correct
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");


// Function to search for phone numbers (MSISDN)
function searchPhoneNumber($phoneNumber)
{
    global $conn;

    // Sanitize input to prevent SQL injection
    $phoneNumber = mysqli_real_escape_string($conn, $phoneNumber);

    // Prepare the SQL query to search for the phone number in the msisdn column
    $sql = "SELECT * FROM messages WHERE msisdn = '$phoneNumber'"; // Limit to 1000 results

    // Execute the query
    $result = mysqli_query($conn, $sql);

    // Initialize an empty array to hold the results
    $messages = [];

    // Check if there are results
    if (mysqli_num_rows($result) > 0) {
        // Fetch the results and add to the $messages array
        while ($row = mysqli_fetch_assoc($result)) {
            $messages[] = [
                "counter" => $row['counter'],
                "created_at" => $row['created_at'],
                "dlr" => $row['dlr'],
                "dlr_report" => $row['dlr_report'],
                "dlr_request" => $row['dlr_request'],
                "dlr_results" => $row['dlr_results'],
                "dlr_status" => $row['dlr_status'],
                "id" => $row['id'],
                "msisdn" => $row['msisdn'],
                "network" => $row['network'],
                "pages" => $row['pages'],
                "response" => $row['response'],
                "senderid" => $row['senderid'],
                "status" => $row['status'],
                "text" => $row['text'],
                "updated_at" => $row['updated_at']
            ];
        }
    }

    // Return the results as a JSON response
    header('Content-Type: application/json');
    echo json_encode($messages, JSON_PRETTY_PRINT);
}

// Check if the 'phone' parameter is passed in the request (GET or POST)
if (isset($_REQUEST['phone'])) {
    $phoneNumber = $_REQUEST['phone'];
    // Search for the phone number and return the results as JSON
    searchPhoneNumber($phoneNumber);
} else {
    // If no phone parameter is provided, return an error in JSON
    echo json_encode(["error" => "Please provide a phone number to search."]);
}