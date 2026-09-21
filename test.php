<?php
echo "PHP is running!<br>";
echo "PHP Version: " . phpversion() . "<br>";

// Test write permission
$testFile = 'test.txt';
if (file_put_contents($testFile, 'Test write permission')) {
    echo "Write permission: OK<br>";
    unlink($testFile);
} else {
    echo "Write permission: FAILED<br>";
}

// Test JSON
$testData = ['test' => 'success'];
$json = json_encode($testData);
echo "JSON encode: " . $json . "<br>";

// Test read data.json
if (file_exists('data.json')) {
    echo "data.json exists<br>";
    $content = file_get_contents('data.json');
    echo "data.json content: " . $content . "<br>";
} else {
    echo "data.json does not exist<br>";
}
?>
