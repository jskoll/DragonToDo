<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Task;
use App\Entity\User;
use Doctrine\DBAL\LockMode;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Enforces per-user ownership on every Task write:
 *  - Post (create): owner is always the authenticated user — the client can never
 *    set it, since `owner` isn't in any serialization group in the first place.
 *  - Patch/Delete: the item has already been fetched through
 *    App\Doctrine\CurrentUserExtension, so it's already guaranteed to belong to the
 *    current user by the time it reaches here (a cross-owner id 404s earlier, at
 *    the provider stage) — this class re-checks anyway as defense in depth.
 *  - parentTask: rejects linking to a task owned by someone else. The IRI is
 *    normally already unresolvable for another user's task (same query-extension
 *    scoping applies when API Platform dereferences the IRI), this is a second,
 *    explicit check in case that ever changes. Also rejects a parentTask that would
 *    create a cycle (the task itself, or one of its own descendants) — nothing else
 *    stops a same-owner PATCH from doing that, and a cycle breaks hierarchy traversal
 *    and cascade-delete semantics.
 */
final class TaskOwnerProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly Security $security,
        private readonly EntityManagerInterface $entityManager,
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        #[Autowire(service: 'api_platform.doctrine.orm.state.remove_processor')]
        private readonly ProcessorInterface $removeProcessor,
    ) {
    }

    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if ($operation instanceof Delete) {
            $this->assertOwnedByCurrentUser($data);

            return $this->removeProcessor->process($data, $operation, $uriVariables, $context);
        }

        if (!$data instanceof Task) {
            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        }

        $user = $this->currentUser();

        $isCreate = null === $data->getId();
        if ($isCreate) {
            $data->setOwner($user);
        } else {
            $this->assertOwnedByCurrentUser($data);
        }

        return $this->entityManager->wrapInTransaction(function () use ($data, $operation, $uriVariables, $context, $user, $isCreate): mixed {
            if (!$isCreate) {
                $this->lockTaskById($data->getId());
            }

            $parent = $data->getParentTask();
            if (null !== $parent) {
                $lockedParent = $this->lockTaskById($parent->getId());
                if ($lockedParent->getOwner()?->getId() !== $user->getId()) {
                    throw new UnprocessableEntityHttpException('parentTask must belong to the current user.');
                }
                $this->assertNoCycle($data, $lockedParent);
                $data->setParentTask($lockedParent);
            }

            return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
        });
    }

    /**
     * Rejects $parent if setting $data->parentTask = $parent would create a cycle, i.e.
     * if $data is reachable from $parent by following parentTask pointers zero or more
     * times (parent === data covers "self", walking further covers "one of its own
     * descendants"). Relies on Doctrine's identity map: within one request, the same row
     * is always the same object instance, so `===` correctly detects "this is the task
     * being saved" even after Doctrine reloads it by following an association.
     */
    private function assertNoCycle(Task $data, Task $parent): void
    {
        $ancestor = $parent;
        while (null !== $ancestor) {
            if ($ancestor->getId() === $data->getId()) {
                throw new UnprocessableEntityHttpException('parentTask cannot be the task itself or one of its own descendants.');
            }
            $next = $ancestor->getParentTask();
            $ancestor = null !== $next ? $this->lockTaskById($next->getId()) : null;
        }
    }

    private function lockTaskById(?int $id): Task
    {
        if (null === $id) {
            throw new UnprocessableEntityHttpException('parentTask must reference a persisted task.');
        }

        $task = $this->entityManager->find(Task::class, $id, LockMode::PESSIMISTIC_WRITE);
        if (!$task instanceof Task) {
            throw new UnprocessableEntityHttpException('parentTask does not exist.');
        }

        return $task;
    }

    private function assertOwnedByCurrentUser(mixed $data): void
    {
        if (!$data instanceof Task || $data->getOwner()?->getId() !== $this->currentUser()->getId()) {
            // 404, not 403: don't confirm to a caller that another user's task id exists.
            throw new NotFoundHttpException();
        }
    }

    private function currentUser(): User
    {
        $user = $this->security->getUser();
        if (!$user instanceof User) {
            throw new \LogicException('TaskOwnerProcessor requires an authenticated App\Entity\User.');
        }

        return $user;
    }
}
