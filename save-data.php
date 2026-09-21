<?php
// Enable error reporting untuk debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Log untuk debugging
error_log("=== save-data.php accessed ===");
error_log("Method: " . $_SERVER['REQUEST_METHOD']);

$dataFile = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function readData() {
    global $dataFile;
    error_log("Reading data from: " . $dataFile);
    
    if (!file_exists($dataFile)) {
        error_log("File does not exist, creating new one");
        file_put_contents($dataFile, json_encode([]));
        return [];
    }
    
    $content = file_get_contents($dataFile);
    error_log("File content length: " . strlen($content));
    
    if ($content === false || empty($content)) {
        error_log("File empty or cannot read");
        return [];
    }
    
    $decoded = json_decode($content, true);
    if ($decoded === null) {
        error_log("JSON decode error: " . json_last_error_msg());
        return [];
    }
    
    return is_array($decoded) ? $decoded : [];
}

function writeData($data) {
    global $dataFile;
    error_log("Writing data to: " . $dataFile);
    
    $json = json_encode($data, JSON_PRETTY_PRINT);
    if ($json === false) {
        error_log("JSON encode error: " . json_last_error_msg());
        return false;
    }
    
    $result = file_put_contents($dataFile, $json);
    error_log("Write result: " . ($result ? "Success" : "Failed"));
    
    return $result !== false;
}

function sendResponse($success, $message, $data = null) {
    $response = [
        'success' => $success,
        'message' => $message
    ];
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    error_log("Sending response: " . json_encode($response));
    echo json_encode($response);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];
$data = readData();

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'getAll') {
            sendResponse(true, 'Data berhasil dimuat', $data);
        } else {
            sendResponse(true, 'Data berhasil dimuat', $data);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("POST input: " . json_encode($input));
        
        if ($input === null) {
            sendResponse(false, 'Invalid JSON input');
            break;
        }
        
        if (!isset($input['question']) || empty(trim($input['question']))) {
            sendResponse(false, 'Pertanyaan tidak boleh kosong');
            break;
        }
        
        if (!isset($input['category']) || empty(trim($input['category']))) {
            sendResponse(false, 'Kategori tidak boleh kosong');
            break;
        }
        
        $newId = empty($data) ? 1 : max(array_column($data, 'id')) + 1;
        
        $newItem = [
            'id' => $newId,
            'question' => trim($input['question']),
            'category' => trim($input['category']),
            'answer' => isset($input['answer']) ? trim($input['answer']) : '',
            'timestamp' => $input['timestamp'] ?? date('Y-m-d H:i:s'),
            'status' => (!empty($input['answer']) && trim($input['answer']) !== '') ? 'answered' : 'unanswered'
        ];
        
        $data[] = $newItem;
        if (writeData($data)) {
            sendResponse(true, 'Data berhasil disimpan', ['id' => $newId]);
        } else {
            sendResponse(false, 'Gagal menyimpan data ke file');
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("PUT input: " . json_encode($input));
        
        if ($input === null) {
            sendResponse(false, 'Invalid JSON input');
            break;
        }
        
        if (!isset($input['id'])) {
            sendResponse(false, 'ID tidak ditemukan');
            break;
        }
        
        $found = false;
        foreach ($data as $key => $item) {
            if ($item['id'] === $input['id']) {
                if (isset($input['question'])) {
                    $data[$key]['question'] = trim($input['question']);
                }
                if (isset($input['category'])) {
                    $data[$key]['category'] = trim($input['category']);
                }
                if (isset($input['answer'])) {
                    $data[$key]['answer'] = trim($input['answer']);
                }
                if (isset($input['timestamp'])) {
                    $data[$key]['timestamp'] = $input['timestamp'];
                }
                $data[$key]['status'] = (!empty($data[$key]['answer']) && trim($data[$key]['answer']) !== '') ? 'answered' : 'unanswered';
                $found = true;
                break;
            }
        }
        
        if ($found) {
            if (writeData($data)) {
                sendResponse(true, 'Data berhasil diupdate');
            } else {
                sendResponse(false, 'Gagal menyimpan data ke file');
            }
        } else {
            sendResponse(false, 'Data tidak ditemukan');
        }
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        error_log("DELETE input: " . json_encode($input));
        
        if ($input === null) {
            sendResponse(false, 'Invalid JSON input');
            break;
        }
        
        if (!isset($input['id'])) {
            sendResponse(false, 'ID tidak ditemukan');
            break;
        }
        
        $found = false;
        foreach ($data as $key => $item) {
            if ($item['id'] === $input['id']) {
                unset($data[$key]);
                $found = true;
                break;
            }
        }
        
        if ($found) {
            $data = array_values($data);
            if (writeData($data)) {
                sendResponse(true, 'Data berhasil dihapus');
            } else {
                sendResponse(false, 'Gagal menyimpan data ke file');
            }
        } else {
            sendResponse(false, 'Data tidak ditemukan');
        }
        break;

    default:
        http_response_code(405);
        sendResponse(false, 'Method not allowed');
        break;
}
?>
