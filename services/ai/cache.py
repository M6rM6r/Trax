"""Redis cache layer for AI predictions and analysis results."""

import json
import redis
from config import REDIS_URL, CACHE_TTL
from logging_config import logger


class CacheManager:
    def __init__(self):
        self._client: redis.Redis | None = None

    @property
    def client(self) -> redis.Redis:
        if self._client is None:
            self._client = redis.from_url(REDIS_URL, decode_responses=True)
        return self._client

    def _key(self, namespace: str, identifier: str) -> str:
        return f"trax:ai:{namespace}:{identifier}"

    def get(self, namespace: str, identifier: str) -> dict | None:
        try:
            raw = self.client.get(self._key(namespace, identifier))
            if raw:
                logger.info("cache_hit", namespace=namespace, identifier=identifier)
                return json.loads(raw)
            logger.info("cache_miss", namespace=namespace, identifier=identifier)
            return None
        except redis.RedisError as e:
            logger.error("cache_get_error", error=str(e))
            return None

    def set(self, namespace: str, identifier: str, value: dict, ttl: int | None = None) -> bool:
        try:
            self.client.setex(
                self._key(namespace, identifier),
                ttl or CACHE_TTL,
                json.dumps(value, default=str),
            )
            return True
        except redis.RedisError as e:
            logger.error("cache_set_error", error=str(e))
            return False

    def invalidate(self, namespace: str, identifier: str) -> bool:
        try:
            self.client.delete(self._key(namespace, identifier))
            return True
        except redis.RedisError as e:
            logger.error("cache_invalidate_error", error=str(e))
            return False

    def health(self) -> bool:
        try:
            return self.client.ping()
        except redis.RedisError:
            return False


cache = CacheManager()
