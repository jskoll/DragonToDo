<?php

// Warms opcache with the compiled container/kernel classes ahead of the first
// request, referenced by frankenphp/conf.d/20-app.prod.ini's opcache.preload.
if (file_exists(dirname(__DIR__).'/var/cache/prod/App_KernelProdContainer.preload.php')) {
    require dirname(__DIR__).'/var/cache/prod/App_KernelProdContainer.preload.php';
}
