<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead

    <style>
        .no-scroll::-webkit-scrollbar {
            width: 0px;
        }
    </style>

    {{-- <link rel="stylesheet" href="{{ asset('build/assets/app-zwKHeGFw.css') }}">
    <script src="{{ asset('build/assets/app-CiCg9sU4.js') }}" type="module"></script> --}}
</head>


<style>
    ::-webkit-scrollbar-thumb {
        width: 0px
    }
</style>

<body>
    @inertia
</body>

</html>
