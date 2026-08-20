<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\Task;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Vote;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Defense-in-depth ownership check for Task item operations (Get/Patch/Delete),
 * wired up via the `TASK_OWNER` attribute in Task's API Platform `security` expressions.
 *
 * This is intentionally redundant with App\Doctrine\CurrentUserExtension, which already
 * scopes every query so a cross-owner item id resolves to nothing (404) before an object
 * ever reaches this voter. That query-level scoping is the real boundary — see its
 * docblock for why a voter alone would not be enough (it can't stop a collection query
 * from leaking another user's row *count*). This voter only guards against the case
 * where that scoping was ever bypassed or misconfigured for a given operation.
 */
final class TaskVoter extends Voter
{
    public const OWNER = 'TASK_OWNER';

    protected function supports(string $attribute, mixed $subject): bool
    {
        return self::OWNER === $attribute && $subject instanceof Task;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token, ?Vote $vote = null): bool
    {
        $user = $token->getUser();

        return $user instanceof User
            && $subject instanceof Task
            && $subject->getOwner()?->getId() === $user->getId();
    }
}
