# Attendance API Endpoints Documentation

This document describes all the API endpoints used by the attendance page with sample requests and responses.

## 1. Get Sessions (with Filters)

**Endpoint:** `GET /attendance/sessions`

**Query Parameters:**
- `startDate` (optional): ISO 8601 date string for start of date range
- `endDate` (optional): ISO 8601 date string for end of date range
- `type` (optional): Filter by session type ("service", "meeting", "event", "class")
- `search` (optional): Search term to filter by title, location, or description
- `status` (optional): Filter by status ("upcoming", "active", "completed", "cancelled")

**Example Request:**
```
GET /attendance/sessions?startDate=2025-01-01T00:00:00.000Z&endDate=2025-01-31T23:59:59.999Z&type=service&search=sunday
```

**Sample Response:**
```json
[
  {
    "id": "session_123",
    "title": "Sunday Morning Service",
    "description": "Weekly worship service with sermon and communion",
    "date": "2025-01-12T10:00:00.000Z",
    "startTime": "10:00",
    "endTime": "11:30",
    "type": "service",
    "location": "Main Sanctuary",
    "status": "upcoming",
    "presentCount": 142,
    "totalExpected": 150,
    "attendanceRate": 94.7,
    "leader": "Pastor John Smith",
    "tags": ["worship", "sermon", "communion"],
    "createdAt": "2025-01-01T08:00:00.000Z",
    "updatedAt": "2025-01-10T14:30:00.000Z"
  },
  {
    "id": "session_124",
    "title": "Sunday Evening Service",
    "description": "Evening worship and prayer meeting",
    "date": "2025-01-12T18:00:00.000Z",
    "startTime": "18:00",
    "endTime": "19:30",
    "type": "service",
    "location": "Main Sanctuary",
    "status": "upcoming",
    "presentCount": 0,
    "totalExpected": 80,
    "attendanceRate": 0,
    "leader": "Pastor Sarah Johnson",
    "tags": ["worship", "prayer"],
    "createdAt": "2025-01-01T08:00:00.000Z",
    "updatedAt": "2025-01-01T08:00:00.000Z"
  }
]
```

## 2. Get Attendance Statistics

**Endpoint:** `GET /attendance/reports/summary`

**Sample Response:**
```json
{
  "summary": {
    "totalRecords": 287,
    "attendanceRate": 89.3,
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  },
  "occurrenceBreakdown": [
    {
      "sessionId": "session_123",
      "title": "Sunday Morning Service",
      "date": "2025-01-05",
      "presentCount": 145,
      "absentCount": 5,
      "attendanceRate": 96.7
    },
    {
      "sessionId": "session_124",
      "title": "Youth Group Meeting",
      "date": "2025-01-06",
      "presentCount": 32,
      "absentCount": 3,
      "attendanceRate": 91.4
    }
  ],
  "trends": {
    "weekly": [
      { "week": "2025-W01", "rate": 87.5 },
      { "week": "2025-W02", "rate": 89.2 },
      { "week": "2025-W03", "rate": 91.0 },
      { "week": "2025-W04", "rate": 89.3 }
    ],
    "monthly": [
      { "month": "2024-12", "rate": 85.5 },
      { "month": "2025-01", "rate": 89.3 }
    ]
  }
}
```

## 3. Create New Session

**Endpoint:** `POST /attendance/sessions`

**Request Body:**
```json
{
  "title": "Wednesday Bible Study",
  "description": "Mid-week Bible study and prayer meeting",
  "date": "2025-01-15T19:00:00.000Z",
  "startTime": "19:00",
  "endTime": "20:30",
  "type": "meeting",
  "location": "Fellowship Hall",
  "leader": "Pastor Mike Wilson",
  "tags": ["bible study", "prayer", "midweek"],
  "isRecurring": false
}
```

**Sample Response:**
```json
{
  "id": "session_125",
  "title": "Wednesday Bible Study",
  "description": "Mid-week Bible study and prayer meeting",
  "date": "2025-01-15T19:00:00.000Z",
  "startTime": "19:00",
  "endTime": "20:30",
  "type": "meeting",
  "location": "Fellowship Hall",
  "status": "upcoming",
  "presentCount": 0,
  "totalExpected": 0,
  "attendanceRate": 0,
  "leader": "Pastor Mike Wilson",
  "tags": ["bible study", "prayer", "midweek"],
  "createdAt": "2025-01-11T10:00:00.000Z",
  "updatedAt": "2025-01-11T10:00:00.000Z"
}
```

## 4. Get Session Attendance Records

**Endpoint:** `GET /attendance/sessions/{sessionId}/attendance`

**Sample Response:**
```json
[
  {
    "id": "att_001",
    "sessionId": "session_123",
    "personId": "member_456",
    "personName": "John Smith",
    "status": "Present",
    "timestamp": "2025-01-12T10:05:00.000Z",
    "notes": "Arrived on time",
    "markedBy": "user_789"
  },
  {
    "id": "att_002",
    "sessionId": "session_123",
    "personId": "member_457",
    "personName": "Sarah Johnson",
    "status": "Present",
    "timestamp": "2025-01-12T10:15:00.000Z",
    "notes": "Arrived late",
    "markedBy": "user_789"
  },
  {
    "id": "att_003",
    "sessionId": "session_123",
    "personId": "member_458",
    "personName": "Mike Wilson",
    "status": "Absent",
    "timestamp": "2025-01-12T11:30:00.000Z",
    "notes": "Called in sick",
    "markedBy": "user_789"
  }
]
```

## 5. Mark Individual Attendance

**Endpoint:** `POST /attendance/sessions/{sessionId}/attendance/{personId}`

**Request Body:**
```json
{
  "status": "Present",
  "notes": "Arrived on time"
}
```

**Sample Response:**
```json
{
  "id": "att_004",
  "sessionId": "session_123",
  "personId": "member_459",
  "personName": "Lisa Chen",
  "status": "Present",
  "timestamp": "2025-01-12T10:20:00.000Z",
  "notes": "Arrived on time",
  "markedBy": "user_789"
}
```

## 6. Bulk Mark Attendance

**Endpoint:** `POST /attendance/sessions/{sessionId}/bulk-attendance`

**Request Body:**
```json
{
  "attendanceData": [
    {
      "personId": "member_460",
      "status": "Present"
    },
    {
      "personId": "member_461",
      "status": "Present"
    },
    {
      "personId": "member_462",
      "status": "Absent"
    }
  ]
}
```

**Sample Response:**
```json
[
  {
    "id": "att_005",
    "sessionId": "session_123",
    "personId": "member_460",
    "personName": "David Brown",
    "status": "Present",
    "timestamp": "2025-01-12T10:25:00.000Z",
    "markedBy": "user_789"
  },
  {
    "id": "att_006",
    "sessionId": "session_123",
    "personId": "member_461",
    "personName": "Emily Davis",
    "status": "Present",
    "timestamp": "2025-01-12T10:25:00.000Z",
    "markedBy": "user_789"
  },
  {
    "id": "att_007",
    "sessionId": "session_123",
    "personId": "member_462",
    "personName": "Robert Taylor",
    "status": "Absent",
    "timestamp": "2025-01-12T10:25:00.000Z",
    "markedBy": "user_789"
  }
]
```

## 7. Auto-mark Unmarked as Absent

**Endpoint:** `POST /attendance/sessions/{sessionId}/auto-mark-absent`

**Request Body:**
```json
{}
```

**Sample Response:**
```json
{
  "success": true,
  "message": "Successfully marked 15 members as absent",
  "data": {
    "markedCount": 15,
    "memberIds": [
      "member_463",
      "member_464",
      "member_465",
      "member_466",
      "member_467"
    ]
  }
}
```

## 8. Search Attendance Records

**Endpoint:** `GET /attendance/search`

**Query Parameters:**
- `query` (optional): General search term
- `personId` (optional): Filter by specific person
- `sessionId` (optional): Filter by specific session
- `status` (optional): Filter by status ("Present" or "Absent")
- `startDate` (optional): Start date for filtering
- `endDate` (optional): End date for filtering
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 20)

**Example Request:**
```
GET /attendance/search?status=Absent&startDate=2025-01-01&endDate=2025-01-31&page=1&limit=20
```

**Sample Response:**
```json
{
  "data": [
    {
      "id": "att_008",
      "sessionId": "session_123",
      "sessionTitle": "Sunday Morning Service",
      "sessionDate": "2025-01-05T10:00:00.000Z",
      "personId": "member_468",
      "personName": "James Miller",
      "status": "Absent",
      "timestamp": "2025-01-05T11:30:00.000Z",
      "notes": "Out of town"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## 9. Get Active Members (for attendance marking)

**Endpoint:** `GET /members?status=ACTIVE&limit=1000`

**Sample Response:**
```json
{
  "members": [
    {
      "id": "member_456",
      "name": "John Smith",
      "firstName": "John",
      "lastName": "Smith",
      "email": "john.smith@email.com",
      "phone": "+1-555-0123",
      "status": "ACTIVE",
      "membershipDate": "2020-01-15",
      "avatar": "https://api.example.com/avatars/member_456.jpg"
    },
    {
      "id": "member_457",
      "name": "Sarah Johnson",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "email": "sarah.j@email.com",
      "phone": "+1-555-0124",
      "status": "ACTIVE",
      "membershipDate": "2019-06-20",
      "avatar": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 1000,
    "total": 287
  }
}
```

## Important Notes:

1. **Date Format**: All dates should be in ISO 8601 format
2. **Status Values**: 
   - Session status: "upcoming", "active", "completed", "cancelled"
   - Attendance status: "Present", "Absent" (case-sensitive)
   - Member status: "ACTIVE", "INACTIVE", "PENDING"
3. **Session Types**: "service", "meeting", "event", "class"
4. **Authentication**: All endpoints require authentication headers
5. **Error Responses**: Follow standard HTTP status codes with error details

## Filter Integration Flow:

1. User selects filters in the UI (date range, session type, search term)
2. Frontend sends GET request to `/attendance/sessions` with query parameters
3. Backend filters sessions based on parameters and returns filtered results
4. Frontend displays the filtered sessions without additional client-side filtering
5. Any filter change triggers a new API request for updated data

This approach ensures:
- Better performance with large datasets
- Consistent filtering logic between frontend and backend
- Reduced client-side processing
- Proper pagination support for large result sets