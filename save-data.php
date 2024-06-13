<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

$dataFile = 'data.json';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

function readData() {
    global $dataFile;
    if (!file_exists($dataFile)) {
        return [];
    }
    $content = file_get_contents($dataFile);
    return json_decode($content, true) ?: [];
}

function writeData($data) {
    global $dataFile;
    file_put_contents($dataFile, json_encode($data, JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];
$data = readData();

switch ($method) {
    case 'GET':
        if (isset($_GET['action']) && $_GET['action'] === 'getAll') {
            echo json_encode(['success' => true, 'data' => $data]);
        } else {
            echo json_encode(['success' => true, 'data' => $data]);
        }
        break;

    case 'POST':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input && isset($input['question'])) {
            $newId = empty($data) ? 1 : max(array_column($data, 'id')) + 1;
            
            $newItem = [
                'id' => $newId,
                'question' => $input['question'],
                'answer' => $input['answer'] ?? '',
                'timestamp' => $input['timestamp'] ?? date('Y-m-d H:i:s'),
                'status' => (!empty($input['answer'])) ? 'answered' : 'unanswered'
            ];
            
            $data[] = $newItem;
            writeData($data);
            
            echo json_encode(['success' => true, 'message' => 'Data berhasil disimpan', 'id' => $newId]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        }
        break;

    case 'PUT':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input && isset($input['id'])) {
            $found = false;
            foreach ($data as $key => $item) {
                if ($item['id'] === $input['id']) {
                    $data[$key]['answer'] = $input['answer'] ?? $item['answer'];
                    $data[$key]['timestamp'] = $input['timestamp'] ?? date('Y-m-d H:i:s');
                    $data[$key]['status'] = (!empty($data[$key]['answer'])) ? 'answered' : 'unanswered';
                    $found = true;
                    break;
                }
            }
            
            if ($found) {
                writeData($data);
                echo json_encode(['success' => true, 'message' => 'Data berhasil diupdate']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Data tidak ditemukan']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Data tidak lengkap']);
        }
        break;

    case 'DELETE':
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input && isset($input['id'])) {
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
                writeData($data);
                echo json_encode(['success' => true, 'message' => 'Data berhasil dihapus']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Data tidak ditemukan']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'ID tidak ditemukan']);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>