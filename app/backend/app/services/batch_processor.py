"""Batch processing service for handling multiple images."""

import asyncio
import uuid
import time
from enum import Enum
from typing import Optional
from PIL import Image
import io

from app.services.image_processor import remove_background, remove_background_raw, image_to_bytes


class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    DONE = "done"
    FAILED = "failed"
    CANCELLED = "cancelled"


class BatchTask:
    """Represents a single image in a batch."""

    def __init__(self, task_id: str, filename: str, image_bytes: bytes):
        self.task_id = task_id
        self.filename = filename
        self.image_bytes = image_bytes
        self.status = TaskStatus.PENDING
        self.result_bytes: Optional[bytes] = None
        self.error: Optional[str] = None
        self.processing_time: float = 0


class BatchJob:
    """Represents a batch processing job."""

    def __init__(self, batch_id: str, model_id: str, threshold: int, smoothing: int):
        self.batch_id = batch_id
        self.model_id = model_id
        self.threshold = threshold
        self.smoothing = smoothing
        self.tasks: list[BatchTask] = []
        self.is_cancelled = False
        self.created_at = time.time()
        self._progress_callbacks: list = []

    @property
    def total(self) -> int:
        return len(self.tasks)

    @property
    def completed(self) -> int:
        return sum(1 for t in self.tasks if t.status in (TaskStatus.DONE, TaskStatus.FAILED))

    @property
    def is_done(self) -> bool:
        return self.completed == self.total or self.is_cancelled

    def add_progress_callback(self, callback):
        """Add a callback for progress updates."""
        self._progress_callbacks.append(callback)

    async def _notify_progress(self, task: BatchTask):
        """Notify all progress callbacks."""
        for callback in self._progress_callbacks:
            await callback(self, task)


# In-memory batch storage
_batches: dict[str, BatchJob] = {}


def create_batch(
    files: list[tuple[str, bytes]],
    model_id: str = "u2net",
    threshold: int = 128,
    smoothing: int = 0,
) -> BatchJob:
    """Create a new batch processing job.

    Args:
        files: List of (filename, image_bytes) tuples
        model_id: Model to use
        threshold: Edge threshold
        smoothing: Edge smoothing

    Returns:
        BatchJob object
    """
    batch_id = str(uuid.uuid4())[:8]
    batch = BatchJob(batch_id, model_id, threshold, smoothing)

    for i, (filename, image_bytes) in enumerate(files):
        task_id = f"{batch_id}_{i}"
        task = BatchTask(task_id, filename, image_bytes)
        batch.tasks.append(task)

    _batches[batch_id] = batch
    return batch


def get_batch(batch_id: str) -> Optional[BatchJob]:
    """Get a batch job by ID."""
    return _batches.get(batch_id)


def cancel_batch(batch_id: str) -> bool:
    """Cancel a batch processing job.

    Returns:
        True if cancelled, False if not found or already done
    """
    batch = _batches.get(batch_id)
    if batch and not batch.is_done:
        batch.is_cancelled = True
        return True
    return False


async def process_batch(batch: BatchJob):
    """Process all tasks in a batch.

    Args:
        batch: BatchJob to process
    """
    for task in batch.tasks:
        if batch.is_cancelled:
            task.status = TaskStatus.CANCELLED
            continue

        task.status = TaskStatus.PROCESSING
        await batch._notify_progress(task)

        try:
            start_time = time.time()

            # Load image
            image = Image.open(io.BytesIO(task.image_bytes))
            image = image.convert("RGB")

            # Process
            if batch.threshold == 128 and batch.smoothing == 0:
                result = remove_background_raw(image, batch.model_id)
            else:
                result = remove_background(image, batch.model_id, batch.threshold, batch.smoothing)

            # Convert to PNG
            task.result_bytes = image_to_bytes(result, format="PNG")
            task.processing_time = time.time() - start_time
            task.status = TaskStatus.DONE

        except Exception as e:
            task.status = TaskStatus.FAILED
            task.error = str(e)

        await batch._notify_progress(task)


def get_batch_results(batch_id: str) -> dict:
    """Get results summary for a batch job.

    Returns:
        Dict with batch status and results
    """
    batch = _batches.get(batch_id)
    if not batch:
        return None

    return {
        "batch_id": batch.batch_id,
        "total": batch.total,
        "completed": batch.completed,
        "is_cancelled": batch.is_cancelled,
        "is_done": batch.is_done,
        "tasks": [
            {
                "task_id": t.task_id,
                "filename": t.filename,
                "status": t.status.value,
                "processing_time": t.processing_time,
                "error": t.error,
            }
            for t in batch.tasks
        ],
    }
