<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\RegisterUserInput;
use App\Entity\User;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Serializer\SerializerInterface;
use Symfony\Component\Validator\Validator\ValidatorInterface;

final class RegistrationController
{
    public function __construct(
        private readonly SerializerInterface $serializer,
        private readonly ValidatorInterface $validator,
        private readonly UserPasswordHasherInterface $passwordHasher,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/api/register', name: 'api_register', methods: ['POST'])]
    public function __invoke(Request $request): JsonResponse
    {
        try {
            $input = $this->serializer->deserialize($request->getContent(), RegisterUserInput::class, 'json');
        } catch (\Throwable) {
            return new JsonResponse(['error' => 'Invalid request body.'], Response::HTTP_BAD_REQUEST);
        }

        $violations = $this->validator->validate($input);
        if (\count($violations) > 0) {
            $errors = [];
            foreach ($violations as $violation) {
                $errors[$violation->getPropertyPath()] = $violation->getMessage();
            }

            return new JsonResponse(['error' => 'Validation failed.', 'violations' => $errors], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = new User(strtolower($input->email));
        $user->setPassword($this->passwordHasher->hashPassword($user, $input->password));

        try {
            $this->entityManager->persist($user);
            $this->entityManager->flush();
        } catch (UniqueConstraintViolationException) {
            return new JsonResponse(['error' => 'An account with this email already exists.'], Response::HTTP_CONFLICT);
        }

        return new JsonResponse([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
        ], Response::HTTP_CREATED);
    }
}
