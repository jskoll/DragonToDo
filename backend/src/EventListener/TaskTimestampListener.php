<?php

declare(strict_types=1);

namespace App\EventListener;

use App\Entity\Task;
use Doctrine\Bundle\DoctrineBundle\Attribute\AsDoctrineListener;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Event\PrePersistEventArgs;
use Doctrine\ORM\Event\PreUpdateEventArgs;
use Doctrine\ORM\Events;

/**
 * Maintains Task's `createdAt`/`updatedAt`/`extensions` on every write.
 *
 * This is a listener rather than #[ORM\PrePersist]/#[ORM\PreUpdate] entity lifecycle
 * callbacks specifically because of `preUpdate`: Doctrine computes an entity's changeset
 * *before* invoking a bare lifecycle-callback method, so a plain property mutation made
 * from inside one (e.g. `$this->updatedAt = ...`) is silently never written to the
 * database — the in-memory object looks right for the rest of that request (which is why
 * this went unnoticed in manual/HTTP-response-only testing), but a fresh read from the
 * database afterwards shows stale values.
 *
 * A preUpdate *listener* has the same problem by default — `PreUpdateEventArgs` only
 * lets `setNewValue()` touch a field that's already part of this update's changeset
 * (e.g. it can't introduce `updatedAt` into the diff when the client's PATCH never
 * touched it), which is the more commonly-reached-for fix and doesn't actually work
 * here. What does: mutate the entity directly via Task::touchUpdatedAt(), then explicitly
 * ask Doctrine to recompute that entity's changeset with
 * `UnitOfWork::recomputeSingleEntityChangeSet()`, the API Doctrine provides for exactly
 * this ("I changed more fields after you already computed the diff").
 */
#[AsDoctrineListener(event: Events::prePersist)]
#[AsDoctrineListener(event: Events::preUpdate)]
final class TaskTimestampListener
{
    public function prePersist(PrePersistEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Task) {
            return;
        }

        $entity->initializeTimestamps();
    }

    public function preUpdate(PreUpdateEventArgs $args): void
    {
        $entity = $args->getObject();
        if (!$entity instanceof Task) {
            return;
        }

        $entity->touchUpdatedAt();

        $entityManager = $args->getObjectManager();
        \assert($entityManager instanceof EntityManagerInterface);
        $entityManager->getUnitOfWork()->recomputeSingleEntityChangeSet(
            $entityManager->getClassMetadata(Task::class),
            $entity,
        );
    }
}
