from typing import Generic, TypeVar, List, Optional
from pydantic import BaseModel, Field

# Define a TypeVar for generic item typing in Pydantic models
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    """
    Generic paginated response wrapper for API endpoints.
    Allows returning items of type T alongside structured pagination metadata.
    """
    items: List[T] = Field(..., description="List of items for the requested page")
    total: int = Field(..., description="Total number of matching records in database")
    page: int = Field(..., description="Current page number (1-indexed)")
    limit: int = Field(..., description="Number of items per page")
    total_pages: int = Field(..., description="Total number of calculated pages")

    class Config:
        from_attributes = True
