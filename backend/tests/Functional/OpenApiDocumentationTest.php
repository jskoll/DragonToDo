<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class OpenApiDocumentationTest extends FunctionalTestCase
{
    public function testOpenApiDocsExposeTheTaskResource(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/docs.jsonopenapi', [
            'headers' => ['Accept' => 'application/vnd.openapi+json'],
        ]);
        self::assertResponseIsSuccessful();

        $docs = $client->getResponse()->toArray();
        self::assertArrayHasKey('/api/tasks', $docs['paths']);
        self::assertArrayHasKey('post', $docs['paths']['/api/tasks']);
        self::assertArrayHasKey('get', $docs['paths']['/api/tasks']);
    }
}
