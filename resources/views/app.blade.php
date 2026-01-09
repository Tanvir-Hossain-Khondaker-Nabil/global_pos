<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>The Total Biz</title>
    <link rel="shortcut icon" href="https://i.ibb.co.com/B2GvYy9s/b54ce146-32b3-4c73-9a14-5b7dfea2a11c-1.png" type="image/x-icon">
    @routes
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead

    <link rel="stylesheet" href="{{ asset('build/assets/app-BS3vnINi.css') }}">
    <script src="{{ asset('build/assets/app-D8J59MPk.js') }}" type="module"></script>
</head>


<style>
    ::-webkit-scrollbar-thumb{
        width: 0px
    }
</style>

<body>
    @inertia
</body>

</html>
