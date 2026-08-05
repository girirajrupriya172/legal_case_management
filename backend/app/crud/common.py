import math
from typing import Tuple

def calculate_pagination(page: int, limit: int, total: int) -> Tuple[int, int]:
    """
    Calculate SQL query offset ('skip') and computed total pages count.
    
    Args:
        page (int): Current requested 1-indexed page number.
        limit (int): Maximum items per page.
        total (int): Total count of matching database records.
        
    Returns:
        Tuple[int, int]: (skip_offset, total_pages_count)
    """
    safe_page = max(1, page)
    safe_limit = max(1, limit)
    
    skip = (safe_page - 1) * safe_limit
    total_pages = math.ceil(total / safe_limit) if total > 0 else 1
    
    return skip, total_pages
