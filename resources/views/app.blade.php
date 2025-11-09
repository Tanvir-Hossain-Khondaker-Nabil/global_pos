<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @inertiaHead

@if(app()->environment('local'))
    @viteReactRefresh
    @vite('resources/js/app.jsx')
@else
    <link rel="stylesheet" href="{{ asset('build/assets/app-1jVSF02g.css') }}">
    <script type="module" src="{{ asset('build/assets/app-Dlfr3Kbh.js') }}"></script>
@endif

</head>

<body>
    @inertia
</body>
</html>
