<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;

abstract class FunctionalTestCase extends ApiTestCase
{
    // Opt in to API Platform 5's future default explicitly, silencing the
    // "kernel will always be booted" deprecation from every ::createClient() call.
    protected static ?bool $alwaysBootKernel = true;
}
