"""Initial tables

Revision ID: 001
Revises:
Create Date: 2026-04-05
"""
from alembic import op
import sqlalchemy as sa

revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'users',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('username', sa.String(50), nullable=False, unique=True),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
    )
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])

    op.create_table(
        'challenges',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('difficulty', sa.String(10), nullable=False),
        sa.Column('category', sa.String(100), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('starter_code', sa.Text(), nullable=False),
        sa.Column('hint', sa.Text(), nullable=True),
    )
    op.create_index('ix_challenges_slug', 'challenges', ['slug'])

    op.create_table(
        'test_cases',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('challenge_id', sa.Integer(), sa.ForeignKey('challenges.id', ondelete='CASCADE'), nullable=False),
        sa.Column('args', sa.JSON(), nullable=False),
        sa.Column('expected', sa.JSON(), nullable=False),
        sa.Column('label', sa.String(255), nullable=True),
    )

    op.create_table(
        'challenge_progress',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('challenge_slug', sa.String(100), nullable=False),
        sa.Column('solved_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'challenge_slug', name='uq_challenge_progress'),
    )

    op.create_table(
        'topic_progress',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('topic_slug', sa.String(100), nullable=False),
        sa.Column('solved_tasks', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now()),
        sa.UniqueConstraint('user_id', 'topic_slug', name='uq_topic_progress'),
    )


def downgrade() -> None:
    op.drop_table('topic_progress')
    op.drop_table('challenge_progress')
    op.drop_table('test_cases')
    op.drop_table('challenges')
    op.drop_table('users')
