<?php
require './conn.php';
require './log.php';

header("Content-Type: application/json");

// Expecting: username, password, role, email
$data = json_decode(file_get_contents("php://input"), true);

$username = trim($data['username'] ?? '');
$password = trim($data['password'] ?? '');
$role = trim($data['role'] ?? 'user');
$email = trim($data['email'] ?? '');

if (!$username || !$password) {
    echo json_encode(['error' => 'Username and password are required']);
    exit();
}

// Check if user already exists
$check = $conn->prepare("SELECT id FROM users WHERE username = ?");
$check->bind_param("s", $username);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {
    echo json_encode(['error' => 'Username already exists']);
    exit();
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (username, password, role, email) VALUES (?, ?, ?, ?)");
$stmt->bind_param("ssss", $username, $hashedPassword, $role, $email);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'User created successfully']);
} else {
    echo json_encode(['error' => 'Failed to create user']);
}
