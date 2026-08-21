<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Doctrine\Orm\Filter\DateFilter;
use ApiPlatform\Doctrine\Orm\Filter\OrderFilter;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiProperty;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\TaskRepository;
use App\State\TaskOwnerProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

/**
 * A single task, mirroring the todo.txt data model from internal/todotxt/task.go:
 * description/details, done, priority, created/completed/due dates, +project and
 * @context tags, and an indent-based subtask hierarchy (here a real parentTask FK).
 *
 * `owner` is deliberately never in a serialization group, so it can never be read
 * or written through the API — it is set only by TaskOwnerProcessor from the
 * authenticated user, and every query is additionally scoped to it server-side by
 * App\Doctrine\CurrentUserExtension.
 */
#[ORM\Entity(repositoryClass: TaskRepository::class)]
#[ORM\Table(name: 'task')]
#[ORM\Index(columns: ['owner_id'], name: 'idx_task_owner')]
#[ApiResource(
    operations: [
        new GetCollection(),
        new Get(security: "is_granted('ROLE_USER') and is_granted('TASK_OWNER', object)"),
        new Post(processor: TaskOwnerProcessor::class),
        new Patch(processor: TaskOwnerProcessor::class, security: "is_granted('ROLE_USER') and is_granted('TASK_OWNER', object)"),
        new Delete(processor: TaskOwnerProcessor::class, security: "is_granted('ROLE_USER') and is_granted('TASK_OWNER', object)"),
    ],
    normalizationContext: ['groups' => ['task:read']],
    denormalizationContext: ['groups' => ['task:write']],
    security: "is_granted('ROLE_USER')",
)]
#[ApiFilter(SearchFilter::class, properties: [
    'done' => 'exact',
    'priority' => 'exact',
    'projects' => 'partial',
    'contexts' => 'partial',
    'parentTask' => 'exact',
])]
#[ApiFilter(OrderFilter::class, properties: ['dueDate', 'priority', 'createdOn', 'createdAt'])]
#[ApiFilter(DateFilter::class, properties: ['dueDate'])]
class Task
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['task:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 1000)]
    #[Assert\NotBlank]
    #[Assert\Length(max: 1000)]
    #[Groups(['task:read', 'task:write'])]
    private string $description = '';

    #[ORM\Column(type: Types::TEXT, nullable: true)]
    #[Groups(['task:read', 'task:write'])]
    private ?string $details = null;

    #[ORM\Column]
    #[Groups(['task:read', 'task:write'])]
    private bool $done = false;

    #[ORM\Column(length: 1, nullable: true)]
    #[Assert\Regex(pattern: '/^[A-Z]$/', message: 'Priority must be a single uppercase letter A-Z.')]
    #[Groups(['task:read', 'task:write'])]
    private ?string $priority = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['task:read', 'task:write'])]
    private ?\DateTimeImmutable $createdOn = null;

    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['task:read', 'task:write'])]
    private ?\DateTimeImmutable $completedOn = null;

    /**
     * The only writable source of "when is this due" — promoted to a first-class
     * typed column (instead of only living in `extensions`) so it can be indexed,
     * filtered and sorted efficiently and portably across SQLite/MySQL/PostgreSQL.
     */
    #[ORM\Column(type: Types::DATE_IMMUTABLE, nullable: true)]
    #[Groups(['task:read', 'task:write'])]
    private ?\DateTimeImmutable $dueDate = null;

    /**
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Assert\All([new Assert\Type('string')])]
    #[Groups(['task:read', 'task:write'])]
    private array $projects = [];

    /**
     * @var list<string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Assert\All([new Assert\Type('string')])]
    #[Groups(['task:read', 'task:write'])]
    private array $contexts = [];

    /**
     * Arbitrary todo.txt-style key:value tokens, kept for round-trip fidelity with
     * the file format. Read-only via the API: it is derived (currently just a `due`
     * key mirroring dueDate, see computeExtensions()), never accepted as input, so it
     * can never drift from the fields that are actually writable.
     *
     * @var array<string, string>
     */
    #[ORM\Column(type: Types::JSON)]
    #[Groups(['task:read'])]
    private array $extensions = [];

    /**
     * readableLink/writableLink: false forces this self-relation to always serialize
     * as (and only ever accept) an IRI string, in both directions. Without it, API
     * Platform's normalizer can end up trying to embed the related Task object instead
     * of a plain IRI reference — since it's the same resource class in the same
     * `task:read`/`task:write` groups as every scalar field here, there's otherwise
     * nothing to disambiguate "reference" from "embed", which risks recursive or
     * deeply-nested payloads on a task with a parent/child chain. This also matches
     * what the Go client already assumes (`ParentTask *string`, an IRI, not a nested
     * struct).
     */
    #[ORM\ManyToOne(targetEntity: self::class, inversedBy: 'children')]
    #[ORM\JoinColumn(name: 'parent_task_id', nullable: true, onDelete: 'CASCADE')]
    #[ApiProperty(readableLink: false, writableLink: false)]
    #[Groups(['task:read', 'task:write'])]
    private ?self $parentTask = null;

    /**
     * @var Collection<int, self>
     */
    #[ORM\OneToMany(mappedBy: 'parentTask', targetEntity: self::class)]
    #[ApiProperty(readableLink: false, writableLink: false)]
    #[Groups(['task:read'])]
    private Collection $children;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(name: 'owner_id', nullable: false, onDelete: 'CASCADE')]
    private ?User $owner = null;

    #[ORM\Column]
    #[Groups(['task:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['task:read'])]
    private ?\DateTimeImmutable $updatedAt = null;

    public function __construct()
    {
        $this->children = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function setDescription(string $description): static
    {
        $this->description = $description;

        return $this;
    }

    public function getDetails(): ?string
    {
        return $this->details;
    }

    public function setDetails(?string $details): static
    {
        $this->details = $details;

        return $this;
    }

    public function isDone(): bool
    {
        return $this->done;
    }

    public function setDone(bool $done): static
    {
        $this->done = $done;

        return $this;
    }

    public function getPriority(): ?string
    {
        return $this->priority;
    }

    public function setPriority(?string $priority): static
    {
        $this->priority = $priority;

        return $this;
    }

    public function getCreatedOn(): ?\DateTimeImmutable
    {
        return $this->createdOn;
    }

    public function setCreatedOn(?\DateTimeImmutable $createdOn): static
    {
        $this->createdOn = $createdOn;

        return $this;
    }

    public function getCompletedOn(): ?\DateTimeImmutable
    {
        return $this->completedOn;
    }

    public function setCompletedOn(?\DateTimeImmutable $completedOn): static
    {
        $this->completedOn = $completedOn;

        return $this;
    }

    public function getDueDate(): ?\DateTimeImmutable
    {
        return $this->dueDate;
    }

    public function setDueDate(?\DateTimeImmutable $dueDate): static
    {
        $this->dueDate = $dueDate;

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getProjects(): array
    {
        return $this->projects;
    }

    /**
     * @param list<string> $projects
     */
    public function setProjects(array $projects): static
    {
        $this->projects = array_values($projects);

        return $this;
    }

    /**
     * @return list<string>
     */
    public function getContexts(): array
    {
        return $this->contexts;
    }

    /**
     * @param list<string> $contexts
     */
    public function setContexts(array $contexts): static
    {
        $this->contexts = array_values($contexts);

        return $this;
    }

    /**
     * @return array<string, string>
     */
    public function getExtensions(): array
    {
        return $this->extensions;
    }

    public function getParentTask(): ?self
    {
        return $this->parentTask;
    }

    public function setParentTask(?self $parentTask): static
    {
        $this->parentTask = $parentTask;

        return $this;
    }

    /**
     * @return Collection<int, self>
     */
    public function getChildren(): Collection
    {
        return $this->children;
    }

    public function getOwner(): ?User
    {
        return $this->owner;
    }

    public function setOwner(User $owner): static
    {
        $this->owner = $owner;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    /**
     * Called from App\EventListener\TaskTimestampListener::prePersist(). Not itself an
     * #[ORM\PrePersist] lifecycle callback because keeping both prePersist and preUpdate
     * handling together in one listener (rather than splitting prePersist into an entity
     * callback and preUpdate into a listener) is less surprising to a reader than having
     * timestamp logic live in two different places for what looks like one concern — see
     * that listener's docblock for why preUpdate specifically *can't* be a bare lifecycle
     * callback here.
     */
    public function initializeTimestamps(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->extensions = $this->computeExtensions();
    }

    /**
     * Called from TaskTimestampListener::preUpdate(). A plain mutation like this made
     * from inside preUpdate is invisible to Doctrine unless the listener also calls
     * UnitOfWork::recomputeSingleEntityChangeSet() afterwards — see that listener's
     * docblock for why (`PreUpdateEventArgs::setNewValue()`, the more commonly-reached-for
     * fix, only works for a field Doctrine *already* considers changed in this update, so
     * it can't introduce `updatedAt` into the changeset when nothing else touched it).
     */
    public function touchUpdatedAt(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
        $this->extensions = $this->computeExtensions();
    }

    /**
     * @return array<string, string>
     */
    public function computeExtensions(): array
    {
        $extensions = $this->extensions;
        if (null !== $this->dueDate) {
            $extensions['due'] = $this->dueDate->format('Y-m-d');
        } else {
            unset($extensions['due']);
        }

        return $extensions;
    }
}
