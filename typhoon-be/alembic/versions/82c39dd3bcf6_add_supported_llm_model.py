"""add supported LLM model

Revision ID: 82c39dd3bcf6
Revises: 4e7585527e27
Create Date: 2024-12-16 21:53:27.803268

"""

import datetime
import json
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "82c39dd3bcf6"
down_revision: Union[str, None] = "4e7585527e27"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    datetime_now = datetime.datetime.now(datetime.timezone.utc)
    llms_data = [
        {
            "shortname": "typhoon-v2-8b-instruct",
            "fullname": "scb10x/llama-3-typhoon-v1.5-8b-instruct",
            "params": json.dumps(
                {
                    "temperature": {"min": 0, "max": 2, "default": 0.7},
                    "topP": {"min": 0, "max": 1, "default": 0.7},
                    "topK": {"min": 1, "max": 100, "default": 50},
                    "repetitionPenalty": {"min": 0, "max": 2, "default": 1.0},
                    "outputLength": {"min": 0, "max": 512, "default": 512},
                }
            ),
            "created_at": datetime_now,
            "updated_at": datetime_now,
        },
        {
            "shortname": "typhoon-v2-70b-instruct",
            "fullname": "scb10x/llama-3-typhoon-v1.5x-70b-instruct",
            "params": json.dumps(
                {
                    "temperature": {"min": 0, "max": 2, "default": 0.7},
                    "topP": {"min": 0, "max": 1, "default": 0.7},
                    "topK": {"min": 1, "max": 100, "default": 50},
                    "repetitionPenalty": {"min": 0, "max": 2, "default": 1.0},
                    "outputLength": {"min": 0, "max": 4096, "default": 2048},
                }
            ),
            "created_at": datetime_now,
            "updated_at": datetime_now,
        },
    ]

    llms_table = sa.table(
        "llms",
        sa.column("shortname"),
        sa.column("fullname"),
        sa.column("params"),
        sa.column("created_at"),
        sa.column("updated_at"),
    )
    op.bulk_insert(llms_table, llms_data)


def downgrade():
    op.execute(
        """
        DELETE FROM llms
        WHERE shortname IN (
            'typhoon-v1.5-instruct',
            'typhoon-v1.5-instruct-fc',
            'typhoon-v1.5x-70b-instruct'
        )
        """
    )
