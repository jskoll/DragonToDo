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

    private function patchHeaders(string $token): array
    {
        return ['headers' => [
            'Authorization' => 'Bearer '.$token,
            'Content-Type' => 'application/merge-patch+json',
        ]];
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

    public function testCannotSetATaskAsItsOwnParent(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'self-parent@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Solo task'],
        ]);
        self::assertResponseStatusCodeSame(201);
        $task = $client->getResponse()->toArray();

        $client->request('PATCH', $task['@id'], [
            ...$this->patchHeaders($token),
            'json' => ['parentTask' => $task['@id']],
        ]);
        self::assertResponseStatusCodeSame(422);
    }

    public function testCannotReparentATaskUnderItsOwnDescendant(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'descendant-cycle@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Grandparent'],
        ]);
        self::assertResponseStatusCodeSame(201);
        $grandparent = $client->getResponse()->toArray();

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Parent', 'parentTask' => $grandparent['@id']],
        ]);
        self::assertResponseStatusCodeSame(201);
        $parent = $client->getResponse()->toArray();

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Child', 'parentTask' => $parent['@id']],
        ]);
        self::assertResponseStatusCodeSame(201);
        $child = $client->getResponse()->toArray();

        // grandparent -> parent -> child already; making grandparent a child of its own
        // grandchild would close the loop.
        $client->request('PATCH', $grandparent['@id'], [
            ...$this->patchHeaders($token),
            'json' => ['parentTask' => $child['@id']],
        ]);
        self::assertResponseStatusCodeSame(422);
    }

    public function testPatchPersistsUpdatedAtAndExtensionsPastTheImmediateResponse(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'timestamp-test@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Needs a due date'],
        ]);
        self::assertResponseStatusCodeSame(201);
        $created = $client->getResponse()->toArray();

        $client->request('PATCH', $created['@id'], [
            ...$this->patchHeaders($token),
            'json' => ['dueDate' => '2026-09-01'],
        ]);
        self::assertResponseIsSuccessful();

        // Query the raw DB row directly rather than another $client->request(): within one
        // PHPUnit process Doctrine's identity map could return the same in-memory (already
        // correctly-updated) object for a second request even if the actual SQL UPDATE
        // silently dropped these columns, producing a false pass. This is exactly the
        // scenario a bare #[ORM\PreUpdate] lifecycle callback gets wrong — Doctrine computes
        // the changeset before invoking it, so field mutations made inside are never
        // written — see App\EventListener\TaskTimestampListener's docblock.
        $connection = static::getContainer()->get(\Doctrine\DBAL\Connection::class);
        $row = $connection->fetchAssociative(
            'SELECT updated_at, extensions FROM task WHERE id = ?',
            [$created['id']],
        );

        self::assertNotFalse($row);
        self::assertNotNull($row['updated_at'], 'updated_at was not persisted by the PATCH');
        $extensions = json_decode((string) $row['extensions'], true);
        self::assertSame('2026-09-01', $extensions['due'] ?? null, 'extensions.due was not persisted by the PATCH');
    }

    public function testProjectsAndContextsRejectNonStringElements(): void
    {
        $client = static::createClient();
        $token = $this->registerAndLogin($client, 'element-type@example.com');

        $client->request('POST', '/api/tasks', [
            ...$this->authHeaders($token),
            'json' => ['description' => 'Bad tags', 'projects' => [1], 'contexts' => [true]],
        ]);
        self::assertResponseStatusCodeSame(422);
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
