"""add solution field to challenges

Revision ID: 002
Revises: 001
Create Date: 2026-04-06
"""
from alembic import op
import sqlalchemy as sa

revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('challenges', sa.Column('solution', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('challenges', 'solution')
