<html>
    <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Pietyl</title>
        @viteReactRefresh
        <link rel="icon" type="icon/image" href="{{ Vite::asset('resources/images/Header_Logo.png') }}" />
        @vite(['resources/css/app.css', 'resources/js/app.jsx'])

        @inertiaHead
    </head>
    <body>
        @inertia
    </body>
</html>