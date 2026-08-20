<?php

use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\Process\Process;

require dirname(__DIR__).'/vendor/autoload.php';

if (method_exists(Dotenv::class, 'bootEnv')) {
    (new Dotenv())->bootEnv(dirname(__DIR__).'/.env');
}

if ($_SERVER['APP_DEBUG']) {
    umask(0000);
}

// Give every test run a fresh SQLite database migrated from scratch, so tests never
// see data (e.g. a previously registered email) left behind by an earlier run.
if ('test' === ($_SERVER['APP_ENV'] ?? null) && str_starts_with((string) ($_SERVER['DATABASE_URL'] ?? ''), 'sqlite:///')) {
    $dbPath = str_replace('%kernel.project_dir%', dirname(__DIR__), substr($_SERVER['DATABASE_URL'], \strlen('sqlite:///')));
    @unlink($dbPath);

    $process = new Process(['php', 'bin/console', 'doctrine:migrations:migrate', '--no-interaction', '--env=test'], dirname(__DIR__));
    $process->setTimeout(120);
    $process->run();

    if (!$process->isSuccessful()) {
        throw new RuntimeException('Could not migrate the test database: '.$process->getErrorOutput());
    }
}
