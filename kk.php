<?php
require './conn.php'; // DB connection

function wh_log($log_msg)
{
    $log_filename = "/var/www/html/citizenlog";
    if (!file_exists($log_filename)) {
        mkdir($log_filename, 0777, true);
    }
    $log_file_data = $log_filename . '/log_' . date('d-M-Y') . '.log';
    file_put_contents($log_file_data, date('Y-m-d H:i:s') . ' ' . $log_msg . "\n\n", FILE_APPEND);
}

// Read input
$data = json_decode(file_get_contents("php://input"), true);

$fullname = trim($data['fullname'] ?? '');
$company_name = trim($data['company_name'] ?? '');
$phone_number = trim($data['phone_number'] ?? '');
$email_address = trim($data['email_address'] ?? '');
$website = trim($data['website'] ?? '');
$comments = trim($data['comments'] ?? '');

// Validate required
if (empty($company_name) || empty($phone_number) || empty($email_address)) {
    $msg = "Missing required fields: ";
    if (empty($company_name)) $msg .= "company_name ";
    if (empty($phone_number)) $msg .= "phone_number ";
    if (empty($email_address)) $msg .= "email_address ";
    wh_log("Validation failed: " . $msg);
    echo json_encode(['status' => false, 'message' => 'Validation failed', 'error' => trim($msg)]);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO contacts (fullname, company_name, phone_number, email_address, website, comments) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssss", $fullname, $company_name, $phone_number, $email_address, $website, $comments);

    if ($stmt->execute()) {
        wh_log("Inserted contact: $fullname | $company_name | $phone_number | $email_address");

        // Construct email body
        $htmlBody = "
        <div style='font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 20px; border-radius: 6px; max-width: 600px; margin: auto;'>
            <h2 style='color: #2c3e50; text-align: center;'>📬 New Contact Submission</h2>
            <table style='width: 100%; border-collapse: collapse; margin-top: 20px;'>
                <tr>
                    <td style='padding: 10px; font-weight: bold; width: 150px;'>Full Name:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$fullname}</td>
                </tr>
                <tr>
                    <td style='padding: 10px; font-weight: bold;'>Company Name:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$company_name}</td>
                </tr>
                <tr>
                    <td style='padding: 10px; font-weight: bold;'>Phone Number:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$phone_number}</td>
                </tr>
                <tr>
                    <td style='padding: 10px; font-weight: bold;'>Email Address:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$email_address}</td>
                </tr>
                <tr>
                    <td style='padding: 10px; font-weight: bold;'>Website:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$website}</td>
                </tr>
                <tr>
                    <td style='padding: 10px; font-weight: bold;'>Comments:</td>
                    <td style='padding: 10px; background-color: #ffffff; border-radius: 4px;'>{$comments}</td>
                </tr>
            </table>
            <p style='margin-top: 30px; font-size: 13px; color: #7f8c8d; text-align: center;'>This message was generated automatically from the website contact form.</p>
        </div>
    ";


        $emailData = array(
            'From' => 'support@ringo.ng',
            'To' => 'Ringoapi@ringo.com.ng',
            'Subject' => 'New Contact Submission from Website',
            'HtmlBody' => $htmlBody,
        );

        $data_string = json_encode($emailData);

        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, 'https://api.postmarkapp.com/email');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
        curl_setopt($ch, CURLOPT_VERBOSE, 1);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");

        $headers = [
            'X-Postmark-Server-Token: 604ccef6-7866-499c-9f25-674eed0dc35a',
            'Content-Type: application/json',
            'Accept: application/json'
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data_string);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $result = curl_exec($ch);
        curl_close($ch);
        $response = json_decode($result);

        if ($response) {
            wh_log("Mail sent to Ringoapi@ringo.com.ng successfully.");
        } else {
            wh_log("Mail sending failed: " . $result);
        }

        echo json_encode(['status' => true, 'message' => 'Contact saved and email sent']);
    } else {
        wh_log("DB Insert Error: " . $stmt->error);
        echo json_encode(['status' => false, 'message' => 'Failed to insert contact']);
    }
    $stmt->close();
} catch (Exception $e) {
    wh_log("Exception: " . $e->getMessage());
    echo json_encode(['status' => false, 'message' => 'Internal server error']);
}