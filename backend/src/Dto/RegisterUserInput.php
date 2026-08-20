<?php

declare(strict_types=1);

namespace App\Dto;

use Symfony\Component\Validator\Constraints as Assert;

/**
 * Input DTO for POST /api/register.
 *
 * Deliberately only carries email + plaintext password: it is never mapped
 * directly onto the User entity, so a client can never smuggle a "roles" or
 * "password" (already-hashed) field through registration.
 */
final class RegisterUserInput
{
    #[Assert\NotBlank]
    #[Assert\Email]
    #[Assert\Length(max: 180)]
    public string $email = '';

    #[Assert\NotBlank]
    #[Assert\Length(min: 12, max: 4096)]
    public string $password = '';
}
