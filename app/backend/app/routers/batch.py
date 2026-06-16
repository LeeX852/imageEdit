"""Batch processing API router."""

import asyncio
import uuid
from urllib.parse import quote
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse, Response
from pydantic import BaseModel
from typing import Optional
import json

from app.services.batch_processor import (
    create_batch,
    get_batch,
    cancel_batch,
    process_batch,
    get_batch_results,
    TaskStatus,
)
from app.services.model_manager import get_active_model_id

router = APIRouter()


@router.post("/remove-background")
async def batch_remove_background(
    files: list[UploadFile] = File(...),
    model: str = Form(default=None),
    threshold: int = Form(default=128),
    smoothing: int = Form(default=0),
):
    """Start batch background removal.

    Args:
        files: Multiple image files to process
        model: Model to use (None for active model)
        threshold: Edge threshold (0-255)
        smoothing: Edge smoothing radius (0-10)

    Returns:
        batch_id for tracking progress
    """
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # Read all files
    file_data = []
    for f in files:
        if not f.content_type or not f.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"File {f.filename} is not an image")
        contents = await f.read()
        file_data.append((f.filename, contents))

    model_id = model if model else get_active_model_id()

    # Create batch job
    batch = create_batch(file_data, model_id, threshold, smoothing)

    # Start processing in background
    asyncio.create_task(process_batch(batch))

    return {"batch_id": batch.batch_id, "total": batch.total}


@router.get("/{batch_id}/status")
async def get_batch_status(batch_id: str):
    """Get batch processing status.

    Returns:
        JSON with batch progress information
    """
    results = get_batch_results(batch_id)
    if results is None:
        raise HTTPException(status_code=404, detail="Batch not found")

    return results


@router.get("/{batch_id}/stream")
async def stream_batch_status(batch_id: str):
    """Get batch processing status via Server-Sent Events.

    Returns:
        SSE stream with progress updates
    """
    batch = get_batch(batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")

    async def event_generator():
        while not batch.is_done:
            results = get_batch_results(batch_id)
            yield f"data: {json.dumps(results)}\n\n"
            await asyncio.sleep(0.5)

        # Final update
        results = get_batch_results(batch_id)
        yield f"data: {json.dumps(results)}\n\n"
        yield "event: done\ndata: {}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )


@router.post("/{batch_id}/cancel")
async def cancel_batch_endpoint(batch_id: str):
    """Cancel an ongoing batch processing task.

    Returns:
        Cancellation confirmation
    """
    success = cancel_batch(batch_id)
    if not success:
        raise HTTPException(status_code=404, detail="Batch not found or already completed")

    return {"status": "cancelled", "batch_id": batch_id}


@router.get("/{batch_id}/result/{task_id}")
async def get_task_result(batch_id: str, task_id: str):
    """Get the processed image for a specific task.

    Returns:
        PNG image bytes
    """
    batch = get_batch(batch_id)
    if batch is None:
        raise HTTPException(status_code=404, detail="Batch not found")

    for task in batch.tasks:
        if task.task_id == task_id:
            if task.status != TaskStatus.DONE:
                raise HTTPException(status_code=400, detail=f"Task status: {task.status.value}")
            if task.result_bytes is None:
                raise HTTPException(status_code=500, detail="No result available")

            safe_name = f"processed_{uuid.uuid4().hex[:8]}.png"
            return Response(
                content=task.result_bytes,
                media_type="image/png",
                headers={
                    "Content-Disposition": f'inline; filename="{safe_name}"; filename*=UTF-8\'\'{quote(f"processed_{task.filename}")}',
                },
            )

    raise HTTPException(status_code=404, detail="Task not found")
