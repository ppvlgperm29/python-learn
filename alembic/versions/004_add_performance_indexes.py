"""add performance indexes

Revision ID: 004
Revises: 003
Create Date: 2026-06-10
"""
from alembic import op

revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    op.create_index('ix_test_cases_challenge_id', 'test_cases', ['challenge_id'])
    op.create_index('ix_challenge_progress_user_id', 'challenge_progress', ['user_id'])
    op.create_index('ix_topic_progress_user_id', 'topic_progress', ['user_id'])


def downgrade():
    op.drop_index('ix_topic_progress_user_id', 'topic_progress')
    op.drop_index('ix_challenge_progress_user_id', 'challenge_progress')
    op.drop_index('ix_test_cases_challenge_id', 'test_cases')
