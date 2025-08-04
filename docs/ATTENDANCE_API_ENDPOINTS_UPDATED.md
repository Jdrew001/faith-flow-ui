# Attendance API Endpoints - Updated (Without Type Filter)

This document describes the updated API endpoints for the attendance page after removing the session type filter.

## 1. Get Filtered Sessions

**Endpoint:** `GET /attendance/sessions`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (ISO 8601) | No | Start of date range filter |
| endDate | string (ISO 8601) | No | End of date range filter |
| search | string | No | Search term for title/location/description |
| status | string | No | Session status: "upcoming", "active", "completed", "cancelled" |

**Example Request:**
```
GET /attendance/sessions?startDate=2025-01-12T00:00:00.000Z&endDate=2025-01-12T23:59:59.999Z&search=sunday
```

**Response Contract:**
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "date": "2025-01-12T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:30",
    "type": "service | meeting | event | class",
    "location": "string",
    "status": "upcoming | active | completed | cancelled",
    "presentCount": 0,
    "totalExpected": 0,
    "attendanceRate": 0.0,
    "leader": "string",
    "tags": ["string"],
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

## Filter Implementation Details

### Date Range Filtering
The frontend sends date ranges based on the selected time filter:

**Today:**
- startDate: Current date at 00:00:00.000Z
- endDate: Current date at 23:59:59.999Z

**Week:**
- startDate: Sunday of current week at 00:00:00.000Z
- endDate: Saturday of current week at 23:59:59.999Z

**Month:**
- startDate: First day of current month at 00:00:00.000Z
- endDate: Last day of current month at 23:59:59.999Z

### Search Functionality
When the `search` parameter is provided, the backend should search in:
- Session title (case-insensitive)
- Session location (case-insensitive)
- Session description (case-insensitive)

### Example Filter Combinations

**1. Today's Sessions:**
```
GET /attendance/sessions?startDate=2025-01-11T00:00:00.000Z&endDate=2025-01-11T23:59:59.999Z
```

**2. This Week's Sessions with Search:**
```
GET /attendance/sessions?startDate=2025-01-05T00:00:00.000Z&endDate=2025-01-11T23:59:59.999Z&search=youth
```

**3. This Month's Upcoming Sessions:**
```
GET /attendance/sessions?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z&status=upcoming
```

## Other Endpoints (Unchanged)

All other endpoints remain the same:

2. **Get Attendance Statistics:** `GET /attendance/reports/summary`
3. **Create Session:** `POST /attendance/sessions`
4. **Get Session Attendance:** `GET /attendance/sessions/{sessionId}/attendance`
5. **Mark Individual Attendance:** `POST /attendance/sessions/{sessionId}/attendance/{personId}`
6. **Bulk Mark Attendance:** `POST /attendance/sessions/{sessionId}/bulk-attendance`
7. **Auto-mark Absent:** `POST /attendance/sessions/{sessionId}/auto-mark-absent`
8. **Search Attendance Records:** `GET /attendance/search`
9. **Get Active Members:** `GET /members?status=ACTIVE&limit=1000`

## Important Notes

1. **No Type Filtering:** The session type filter has been removed from the UI and API
2. **Sessions Still Have Types:** Sessions still have a `type` field in the response, but it's not used for filtering
3. **Default Sorting:** Sessions should be sorted by date (ascending), then by startTime
4. **Performance:** Implement database indexes on `date`, `title`, `location`, and `description` fields for efficient searching

This simplified approach reduces UI complexity while maintaining essential filtering capabilities through date ranges and search functionality.