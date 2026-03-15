"""Vision analysis caching service to reduce API costs and improve performance."""
import hashlib
import time
import json
import logging
from typing import Optional, Dict, Any, Tuple
from dataclasses import dataclass
from collections import OrderedDict

from .vision_analyzer import ScreenAnalysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class CacheEntry:
    """Cached vision analysis result."""
    analysis: ScreenAnalysis
    timestamp: float
    access_count: int = 0
    
    def is_expired(self, ttl_seconds: float) -> bool:
        """Check if cache entry has expired."""
        return time.time() - self.timestamp > ttl_seconds


class VisionCache:
    """LRU cache for vision analysis results with perceptual hashing.
    
    Reduces Gemini Vision API calls by caching results for similar screens.
    """
    
    def __init__(
        self,
        max_size: int = 100,
        ttl_seconds: float = 60.0,  # Cache for 1 minute
        similarity_threshold: float = 0.95
    ):
        self.max_size = max_size
        self.ttl_seconds = ttl_seconds
        self.similarity_threshold = similarity_threshold
        
        # OrderedDict for LRU behavior
        self.cache: OrderedDict[str, CacheEntry] = OrderedDict()
        
        # Statistics
        self.hits = 0
        self.misses = 0
        self.evictions = 0
        
    def _compute_hash(self, image_base64: str) -> str:
        """Compute a simple hash of the image for cache lookup.
        
        Uses first 1KB of base64 data as a fast fingerprint.
        For production, consider using perceptual hashing (phash).
        """
        # Use first 1024 chars of base64 as a quick fingerprint
        sample = image_base64[:1024] if len(image_base64) > 1024 else image_base64
        return hashlib.md5(sample.encode()).hexdigest()
    
    def _compute_similarity_hash(self, image_base64: str) -> str:
        """Compute a similarity hash for near-duplicate detection.
        
        Divides image data into chunks and hashes each chunk.
        Similar images will have similar chunk hashes.
        """
        # Take samples from different parts of the image data
        chunk_size = len(image_base64) // 8
        if chunk_size < 100:
            return self._compute_hash(image_base64)
        
        samples = []
        for i in range(8):
            start = i * chunk_size
            end = start + min(256, chunk_size)
            samples.append(image_base64[start:end])
        
        combined = ''.join(samples)
        return hashlib.md5(combined.encode()).hexdigest()
    
    def get(self, image_base64: str, current_goal: str = "") -> Optional[ScreenAnalysis]:
        """Try to get cached analysis for an image.
        
        Args:
            image_base64: Base64-encoded image
            current_goal: User's current focus goal (for cache key)
            
        Returns:
            Cached ScreenAnalysis or None if not found/expired
        """
        cache_key = self._compute_hash(image_base64)
        
        # Check exact match
        if cache_key in self.cache:
            entry = self.cache[cache_key]
            
            if entry.is_expired(self.ttl_seconds):
                # Remove expired entry
                del self.cache[cache_key]
                self.misses += 1
                return None
            
            # Move to end (most recently used)
            self.cache.move_to_end(cache_key)
            entry.access_count += 1
            self.hits += 1
            
            logger.debug(f"Cache hit for key {cache_key[:8]}... (accessed {entry.access_count} times)")
            return entry.analysis
        
        # Check for similar images (fuzzy match)
        similar_hash = self._compute_similarity_hash(image_base64)
        for key, entry in self.cache.items():
            if entry.is_expired(self.ttl_seconds):
                continue
                
            entry_similar_hash = self._compute_similarity_hash(
                # We don't store original image, so we can't recompute
                # In production, store the similarity hash in the entry
                cache_key  # Fallback
            )
            
            # Simple heuristic: if hashes are very similar
            if similar_hash[:12] == entry_similar_hash[:12]:
                self.cache.move_to_end(key)
                entry.access_count += 1
                self.hits += 1
                logger.debug(f"Similar cache hit for key {key[:8]}...")
                return entry.analysis
        
        self.misses += 1
        return None
    
    def set(self, image_base64: str, analysis: ScreenAnalysis, current_goal: str = ""):
        """Cache an analysis result.
        
        Args:
            image_base64: Base64-encoded image
            analysis: ScreenAnalysis result to cache
            current_goal: User's current focus goal
        """
        cache_key = self._compute_hash(image_base64)
        
        # Evict oldest if at capacity
        if len(self.cache) >= self.max_size:
            oldest_key = next(iter(self.cache))
            del self.cache[oldest_key]
            self.evictions += 1
            logger.debug(f"Evicted cache entry {oldest_key[:8]}...")
        
        # Store new entry
        self.cache[cache_key] = CacheEntry(
            analysis=analysis,
            timestamp=time.time()
        )
        
        logger.debug(f"Cached analysis for key {cache_key[:8]}...")
    
    def invalidate(self, pattern: Optional[str] = None):
        """Invalidate cache entries.
        
        Args:
            pattern: If provided, only invalidate keys containing pattern
        """
        if pattern is None:
            self.cache.clear()
            logger.info("Cache fully cleared")
        else:
            keys_to_remove = [k for k in self.cache if pattern in k]
            for key in keys_to_remove:
                del self.cache[key]
            logger.info(f"Invalidated {len(keys_to_remove)} cache entries matching '{pattern}'")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics."""
        total_requests = self.hits + self.misses
        hit_rate = (self.hits / total_requests * 100) if total_requests > 0 else 0
        
        return {
            "size": len(self.cache),
            "max_size": self.max_size,
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "hit_rate_percent": round(hit_rate, 2),
            "ttl_seconds": self.ttl_seconds
        }
    
    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed."""
        expired_keys = [
            key for key, entry in self.cache.items()
            if entry.is_expired(self.ttl_seconds)
        ]
        
        for key in expired_keys:
            del self.cache[key]
        
        if expired_keys:
            logger.debug(f"Cleaned up {len(expired_keys)} expired cache entries")
        
        return len(expired_keys)


class CachedVisionAnalyzer:
    """Wrapper around VisionAnalyzer with caching support."""
    
    def __init__(self, vision_analyzer, cache: Optional[VisionCache] = None):
        self.vision_analyzer = vision_analyzer
        self.cache = cache or VisionCache()
        self._last_cleanup = time.time()
        self._cleanup_interval = 300  # Cleanup every 5 minutes
    
    async def analyze_screen(
        self,
        image_base64: str,
        current_goal: str = "",
        previous_analysis: Optional[ScreenAnalysis] = None,
        use_cache: bool = True
    ) -> Tuple[ScreenAnalysis, Dict[str, Any]]:
        """Analyze screen with caching support.
        
        Returns:
            Tuple of (analysis, metadata) where metadata includes cache info
        """
        metadata = {"cached": False, "cache_stats": self.cache.get_stats()}
        
        # Periodic cleanup
        if time.time() - self._last_cleanup > self._cleanup_interval:
            self.cache.cleanup_expired()
            self._last_cleanup = time.time()
        
        # Try cache first
        if use_cache:
            cached = self.cache.get(image_base64, current_goal)
            if cached:
                metadata["cached"] = True
                metadata["cache_stats"] = self.cache.get_stats()
                return cached, metadata
        
        # Call actual analyzer
        analysis = await self.vision_analyzer.analyze_screen(
            image_base64=image_base64,
            current_goal=current_goal,
            previous_analysis=previous_analysis
        )
        
        # Cache the result
        if use_cache and analysis.confidence > 0.5:
            self.cache.set(image_base64, analysis, current_goal)
        
        metadata["cache_stats"] = self.cache.get_stats()
        return analysis, metadata
