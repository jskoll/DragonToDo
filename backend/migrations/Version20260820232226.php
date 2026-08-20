<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260820232226 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema: app_user, task, refresh_tokens';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE app_user (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, email VARCHAR(180) NOT NULL, roles CLOB NOT NULL, password VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX uniq_user_email ON app_user (email)');
        $this->addSql('CREATE TABLE refresh_tokens (refresh_token VARCHAR(128) NOT NULL, username VARCHAR(255) NOT NULL, valid DATETIME NOT NULL, family VARCHAR(32) DEFAULT NULL, family_valid DATETIME DEFAULT NULL, id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9BACE7E1C74F2195 ON refresh_tokens (refresh_token)');
        $this->addSql('CREATE TABLE task (id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL, description VARCHAR(1000) NOT NULL, details CLOB DEFAULT NULL, done BOOLEAN NOT NULL, priority VARCHAR(1) DEFAULT NULL, created_on DATE DEFAULT NULL, completed_on DATE DEFAULT NULL, due_date DATE DEFAULT NULL, projects CLOB NOT NULL, contexts CLOB NOT NULL, extensions CLOB NOT NULL, created_at DATETIME NOT NULL, updated_at DATETIME DEFAULT NULL, parent_task_id INTEGER DEFAULT NULL, owner_id INTEGER NOT NULL, CONSTRAINT FK_527EDB25FFFE75C0 FOREIGN KEY (parent_task_id) REFERENCES task (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE, CONSTRAINT FK_527EDB257E3C61F9 FOREIGN KEY (owner_id) REFERENCES app_user (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE)');
        $this->addSql('CREATE INDEX IDX_527EDB25FFFE75C0 ON task (parent_task_id)');
        $this->addSql('CREATE INDEX idx_task_owner ON task (owner_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('DROP TABLE app_user');
        $this->addSql('DROP TABLE refresh_tokens');
        $this->addSql('DROP TABLE task');
    }
}
