<?php

declare(strict_types=1);

namespace App\Doctrine;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Extension\QueryItemExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Task;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Scopes every Task collection/item query to the authenticated user, so it is
 * structurally impossible for a query to return (or even reveal the existence of)
 * another user's task — no code path can "forget" this the way a controller-level
 * check could, since it runs inside Doctrine query building itself.
 *
 * Paired with App\State\TaskOwnerProcessor, which enforces the same boundary on
 * writes (forcing `owner` on create, and validating `parentTask` ownership).
 */
final class CurrentUserExtension implements QueryCollectionExtensionInterface, QueryItemExtensionInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function applyToCollection(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, ?Operation $operation = null, array $context = []): void
    {
        $this->addOwnerCondition($queryBuilder, $resourceClass);
    }

    public function applyToItem(QueryBuilder $queryBuilder, QueryNameGeneratorInterface $queryNameGenerator, string $resourceClass, array $identifiers, ?Operation $operation = null, array $context = []): void
    {
        $this->addOwnerCondition($queryBuilder, $resourceClass);
    }

    private function addOwnerCondition(QueryBuilder $queryBuilder, string $resourceClass): void
    {
        if (Task::class !== $resourceClass) {
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            // No authenticated user: match nothing rather than every row. In practice the
            // security firewall already refuses unauthenticated requests to /api/tasks,
            // this is a defense-in-depth fallback for any code path that reaches here anyway.
            $queryBuilder->andWhere('1 = 0');

            return;
        }

        $queryBuilder
            ->andWhere(sprintf('%s.owner = :current_user', $rootAlias))
            ->setParameter('current_user', $user->getId());
    }
}
