<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\Task;
use PHPUnit\Framework\TestCase;

final class TaskTest extends TestCase
{
    public function testDefaults(): void
    {
        $task = new Task();

        self::assertFalse($task->isDone());
        self::assertSame([], $task->getProjects());
        self::assertSame([], $task->getContexts());
        self::assertSame([], $task->getExtensions());
        self::assertNull($task->getPriority());
        self::assertNull($task->getDueDate());
        self::assertCount(0, $task->getChildren());
    }

    public function testInitializeTimestampsSetsCreatedAtAndSyncsDueExtension(): void
    {
        $task = (new Task())->setDueDate(new \DateTimeImmutable('2026-09-01'));

        $task->initializeTimestamps();

        self::assertSame('2026-09-01', $task->getExtensions()['due']);
        self::assertInstanceOf(\DateTimeImmutable::class, $task->getCreatedAt());
    }

    public function testClearingDueDateRemovesTheExtension(): void
    {
        $task = (new Task())->setDueDate(new \DateTimeImmutable('2026-09-01'));
        $task->initializeTimestamps();
        self::assertArrayHasKey('due', $task->getExtensions());

        $task->setDueDate(null);
        $task->touchUpdatedAt();

        self::assertArrayNotHasKey('due', $task->getExtensions());
        self::assertInstanceOf(\DateTimeImmutable::class, $task->getUpdatedAt());
    }

    public function testSettersReindexListArrays(): void
    {
        $task = new Task();

        $task->setProjects(['dragon']);
        $task->setContexts(['home']);

        self::assertSame(['dragon'], $task->getProjects());
        self::assertSame(['home'], $task->getContexts());
    }
}
