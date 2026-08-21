<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Initial schema: app_user, task, refresh_tokens.
 *
 * Written against Doctrine's portable Schema/Table API (createTable()/addColumn())
 * rather than raw addSql() so Doctrine Migrations generates correct DDL for
 * whichever platform this runs against (SQLite/MySQL/PostgreSQL), instead of the
 * SQL literally being whatever platform `doctrine:migrations:diff` happened to be
 * run against.
 */
final class Version20260820232226 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema: app_user, task, refresh_tokens';
    }

    public function up(Schema $schema): void
    {
        $appUser = $schema->createTable('app_user');
        $appUser->addColumn('id', 'integer', ['autoincrement' => true]);
        $appUser->addColumn('email', 'string', ['length' => 180]);
        $appUser->addColumn('roles', 'json');
        $appUser->addColumn('password', 'string', ['length' => 255]);
        $appUser->addColumn('created_at', 'datetime_immutable');
        $appUser->setPrimaryKey(['id']);
        $appUser->addUniqueIndex(['email'], 'uniq_user_email');

        $refreshTokens = $schema->createTable('refresh_tokens');
        $refreshTokens->addColumn('id', 'integer', ['autoincrement' => true]);
        $refreshTokens->addColumn('refresh_token', 'string', ['length' => 128]);
        $refreshTokens->addColumn('username', 'string', ['length' => 255]);
        $refreshTokens->addColumn('valid', 'datetime');
        $refreshTokens->addColumn('family', 'string', ['length' => 32, 'notnull' => false]);
        $refreshTokens->addColumn('family_valid', 'datetime', ['notnull' => false]);
        $refreshTokens->setPrimaryKey(['id']);
        $refreshTokens->addUniqueIndex(['refresh_token'], 'UNIQ_9BACE7E1C74F2195');

        $task = $schema->createTable('task');
        $task->addColumn('id', 'integer', ['autoincrement' => true]);
        $task->addColumn('description', 'string', ['length' => 1000]);
        $task->addColumn('details', 'text', ['notnull' => false]);
        $task->addColumn('done', 'boolean');
        $task->addColumn('priority', 'string', ['length' => 1, 'notnull' => false]);
        $task->addColumn('created_on', 'date_immutable', ['notnull' => false]);
        $task->addColumn('completed_on', 'date_immutable', ['notnull' => false]);
        $task->addColumn('due_date', 'date_immutable', ['notnull' => false]);
        $task->addColumn('projects', 'json');
        $task->addColumn('contexts', 'json');
        $task->addColumn('extensions', 'json');
        $task->addColumn('created_at', 'datetime_immutable');
        $task->addColumn('updated_at', 'datetime_immutable', ['notnull' => false]);
        $task->addColumn('parent_task_id', 'integer', ['notnull' => false]);
        $task->addColumn('owner_id', 'integer');
        $task->setPrimaryKey(['id']);
        $task->addIndex(['parent_task_id'], 'IDX_527EDB25FFFE75C0');
        $task->addIndex(['owner_id'], 'idx_task_owner');
        $task->addForeignKeyConstraint(
            'task',
            ['parent_task_id'],
            ['id'],
            ['onDelete' => 'CASCADE'],
            'FK_527EDB25FFFE75C0',
        );
        $task->addForeignKeyConstraint(
            'app_user',
            ['owner_id'],
            ['id'],
            ['onDelete' => 'CASCADE'],
            'FK_527EDB257E3C61F9',
        );
    }

    public function down(Schema $schema): void
    {
        // task first: it has FK constraints onto app_user (owner_id) and itself
        // (parent_task_id), so it must go before app_user under FK enforcement.
        $schema->dropTable('task');
        $schema->dropTable('refresh_tokens');
        $schema->dropTable('app_user');
    }
}
