"""Structured logging setup using structlog for the AI service."""

import structlog
import logging
import sys
from config import LOG_LEVEL


def setup_logging():
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, LOG_LEVEL.upper, logging.INFO),
    )

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, LOG_LEVEL.upper(), logging.INFO)
        ),
        cache_logger_on_first_use=True,
    )

    return structlog.get_logger()


logger = setup_logging()
