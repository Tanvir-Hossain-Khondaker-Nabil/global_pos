<!DOCTYPE html>
<html>
<head>
    <title>System On Hold</title>
    <style>
        body {
            font-family: sans-serif;
            background: #f9fafb;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            text-align: center;
        }
        .box {
            max-width: 520px;
        }
        h1 {
            color: #dc2626;
        }
    </style>
</head>
<body>
<div class="box">
    <h1>🚧 System Temporarily On Hold</h1>
    <p>{{ $exception->getMessage() }}</p>
    <small>Please contact support if this continues.</small>
</div>
</body>
</html>