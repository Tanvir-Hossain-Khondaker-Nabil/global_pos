<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1">
    @routes
    @viteReactRefresh
    @vite('resources/js/app.jsx')
    @inertiaHead
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
