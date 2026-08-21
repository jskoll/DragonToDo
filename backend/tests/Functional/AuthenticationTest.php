<?php

declare(strict_types=1);

namespace App\Tests\Functional;

final class AuthenticationTest extends FunctionalTestCase
{
    public function testRegisterThenLoginReturnsAccessAndRefreshTokens(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'alice@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/login', [
            'json' => ['email' => 'alice@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseIsSuccessful();

        $data = $client->getResponse()->toArray();
        self::assertArrayHasKey('token', $data);
        self::assertArrayHasKey('refresh_token', $data);
        self::assertNotEmpty($data['token']);
        self::assertNotEmpty($data['refresh_token']);
    }

    public function testRegisterWithDuplicateEmailReturnsConflict(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'bob@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'bob@example.com', 'password' => 'another-long-password'],
        ]);
        self::assertResponseStatusCodeSame(409);
    }

    public function testRegisterWithWeakPasswordIsRejected(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'carol@example.com', 'password' => 'short'],
        ]);
        self::assertResponseStatusCodeSame(422);
    }

    public function testLoginWithWrongPasswordIsUnauthorized(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'dave@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseStatusCodeSame(201);

        $client->request('POST', '/api/login', [
            'json' => ['email' => 'dave@example.com', 'password' => 'totally-wrong-password'],
        ]);
        self::assertResponseStatusCodeSame(401);
    }

    public function testProtectedEndpointWithoutTokenIsUnauthorized(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/tasks');
        self::assertResponseStatusCodeSame(401);
    }

    public function testLoginIsCaseInsensitiveOnEmail(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'Frank@Example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseStatusCodeSame(201);
        // Registration normalizes to lowercase.
        self::assertSame('frank@example.com', $client->getResponse()->toArray()['email']);

        // Logging in with the original, differently-cased address must still work.
        $client->request('POST', '/api/login', [
            'json' => ['email' => 'Frank@Example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        self::assertResponseIsSuccessful();
        self::assertArrayHasKey('token', $client->getResponse()->toArray());
    }

    public function testRefreshTokenIssuesNewAccessToken(): void
    {
        $client = static::createClient();

        $client->request('POST', '/api/register', [
            'json' => ['email' => 'erin@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        $client->request('POST', '/api/login', [
            'json' => ['email' => 'erin@example.com', 'password' => 'correct-horse-battery-staple'],
        ]);
        $login = $client->getResponse()->toArray();

        $client->request('POST', '/api/token/refresh', [
            'json' => ['refresh_token' => $login['refresh_token']],
        ]);
        self::assertResponseIsSuccessful();

        $refreshed = $client->getResponse()->toArray();
        self::assertArrayHasKey('token', $refreshed);
        self::assertArrayHasKey('refresh_token', $refreshed);
        // single_use: true — refresh rotates the token, so it's not just reissued unchanged.
        self::assertNotSame($login['refresh_token'], $refreshed['refresh_token']);
    }
}
