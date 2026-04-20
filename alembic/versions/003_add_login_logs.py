"""add login_logs table

Revision ID: 003
Revises: 002
Create Date: 2026-04-20
"""
from alembic import op
import sqlalchemy as sa

revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'login_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(50), nullable=False),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('logged_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_login_logs_user_id', 'login_logs', ['user_id'])
    op.create_index('ix_login_logs_logged_at', 'login_logs', ['logged_at'])


def downgrade():
    op.drop_index('ix_login_logs_logged_at', 'login_logs')
    op.drop_index('ix_login_logs_user_id', 'login_logs')
    op.drop_table('login_logs')
