<?php

declare(strict_types=1);

namespace App\Tests\Functional;

use ApiPlatform\Symfony\Bundle\Test\Client;

final class TaskApiTest extends FunctionalTestCase
{
    private function registerAndLogin(Client $client, string $email): string
    {
        $client->request('POST', '/api/register', [
            'json' => ['email' => $email, 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/login', [
            'json' => ['email' => $email, 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseIsSuccessful();

        return $client->getResponse()->toArray()['token'];
    }

    private function authHeaders(string $token): array
    {
        return ['headers' => ['Authorization' => 'Bearer '.$token]];
    }

    public function testCreateTaskIgnoresClientSuppliedOwner(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'owner-test@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => [
                'description' => 'Write the report',
                'owner' => '/api/users/999999',
            ],
        ]);

        self::assertResponseStatusCodeSame(201);
        $task = $client->getResponse()->toArray();
        self::assertSame('Write the report', $task['description']);
        self::assertArrayNotHasKey('owner', $task);
    }

    public function testUsersOnlySeeTheirOwnTasks(): void
    {
        $client = static::createClient();

        $tokenA = $this->registerAndLogin($client, 'alice-tasks@example.com');
        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($tokenA),
            'json' => ['description' => "Alice's task"],
        ]);
        self::assertResponseStatusCodeSame(201);
        $aliceTaskIri = $client->getResponse()->toArray()['@id'];

        $tokenB = $this->registerAndLogin($client, 'bob-tasks@example.com');
        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($tokenB),
            'json' => ['description' => "Bob's task"],
        ]);
        self::assertResponseStatusCodeSame(201);

        // Bob's collection must not contain Alice's task.
        $client->request('GET', '/api/tasks', $this->authHeaders($tokenB));
        self::assertResponseIsSuccessful();
        $bobsView = $client->getResponse()->toArray();
        $descriptions = array_map(static fn (array $t) => $t['description'], $bobsView['member'] ?? $bobsView['hydra:member'] ?? []);
        self::assertContains("Bob's task", $descriptions);
        self::assertNotContains("Alice's task", $descriptions);

        // Bob fetching Alice's task id directly gets 404, not 403 (existence isn't confirmed).
        $client->request('GET', $aliceTaskIri, $this->authHeaders($tokenB));
        self::assertResponseStatusCodeSame(404);
    }

    public function testCannotDeleteAnotherUsersTask(): void
    {
        $client = static::createClient();

        $tokenA = $this->registerAndLogin($client, 'alice-delete@example.com');
        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($tokenA),
            'json' => ['description' => 'Protected task'],
        ]);
        $taskIri = $client->getResponse()->toArray()['@id'];

        $tokenB = $this->registerAndLogin($client, 'mallory-delete@example.com');
        $client->request('DELETE', $taskIri, $this->authHeaders($tokenB));
        self::assertResponseStatusCodeSame(404);

        // The task must still exist for its actual owner.
        $client->request('GET', $taskIri, $this->authHeaders($tokenA));
        self::assertResponseIsSuccessful();
    }

    public function testCannotReparentTaskUnderAnotherUsersTask(): void
    {
        $client = static::createClient();

        $tokenA = $this->registerAndLogin($client, 'alice-parent@example.com');
        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($tokenA),
            'json' => ['description' => "Alice's parent task"],
        ]);
        $aliceParentIri = $client->getResponse()->toArray()['@id'];

        $tokenB = $this->registerAndLogin($client, 'bob-parent@example.com');
        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($tokenB),
            'json' => ['description' => "Bob's task", 'parentTask' => $aliceParentIri],
        ]);

        self::assertContains($client->getResponse()->getStatusCode(), [400, 404, 422]);
    }

    public function testDueDateIsFilterableAndSortable(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'due-date@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Due soon', 'dueDate' => '2026-09-01'],
        ]);
        self::assertResponseStatusCodeSame(201);
        $created = $client->getResponse()->toArray();
        self::assertSame('2026-09-01', substr($created['dueDate'], 0, 10));
        // extensions.due mirrors dueDate automatically, it's not client-writable.
        self::assertSame('2026-09-01', $created['extensions']['due']);

        $client->request('GET', '/api/tasks?dueDate[after]=2026-08-01', $this->authHeaders($token));
        self::assertResponseIsSuccessful();
        $results = $client->getResponse()->toArray();
        $descriptions = array_map(static fn (array $t) => $t['description'], $results['member'] ?? $results['hydra:member'] ?? []);
        self::assertContains('Due soon', $descriptions);
    }
}
