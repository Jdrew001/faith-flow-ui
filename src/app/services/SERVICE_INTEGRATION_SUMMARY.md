# Service Integration Summary

## Overview
This document summarizes all service integrations in the Faith Flow UI application and their corresponding API contracts.

## Services Created

### 1. **Authentication Service** (`auth.service.ts`)
- **Purpose**: Handles user authentication, login, logout, and session management
- **Key Methods**:
  - `login(email, password)`
  - `register(email, password, name, churchName)`
  - `logout()`
  - `getCurrentUser()`
  - `isAuthenticated()`

### 2. **Attendance Service** (`attendance.service.ts`)
- **Purpose**: Manages attendance sessions, marking attendance, and attendance statistics
- **Key Methods**:
  - `getSessions(filters?)`
  - `createSession(sessionData)`
  - `getSessionAttendance(sessionId)`
  - `markAttendance(sessionId, personId, status)`
  - `bulkMarkAttendance(sessionId, attendanceData[])`
  - `autoMarkUnmarkedAsAbsent(sessionId)`
  - `getAttendanceStats()`

### 3. **Followup Service** (`followup.service.ts`)
- **Purpose**: Manages follow-up items for church members and visitors
- **Key Methods**:
  - `getFollowups(filters?)`
  - `createFollowup(followupData)`
  - `updateFollowup(id, updates)`
  - `deleteFollowup(id)`
  - `updateStatus(id, status)`
  - `assignFollowup(assignment)`
  - `getOverdueFollowups()`
  - `getStats()`

### 4. **Member Service** (`member.service.ts`)
- **Purpose**: Manages church member information and member-related operations
- **Key Methods**:
  - `getMembers(filters?)`
  - `getMember(id)`
  - `createMember(memberData)`
  - `updateMember(id, updates)`
  - `deleteMember(id)`
  - `getMemberAttendance(id, startDate?, endDate?)`
  - `searchMembers(query)`
  - `getActiveMembers(limit?)`

### 5. **Dashboard Service** (`dashboard.service.ts`)
- **Purpose**: Provides aggregated data for the dashboard/summary screen
- **Key Methods**:
  - `getDashboardSummary()`
  - `getAttendanceStats()`
  - `getEngagementTrends(weeks?)`
  - `getFollowUps(priority?, limit?)`
  - `getUpcomingSessions(limit?)`
  - `getWorkflowStats()`
  - `getRecentActivity(limit?)`

### 6. **Assignee Service** (`assignee.service.ts`)
- **Purpose**: Manages staff and volunteer assignees for tasks and follow-ups
- **Key Methods**:
  - `getAssignees()`
  - `getAssignee(value)`
  - `getAssigneesByRole(role)`
  - `getActiveAssignees()`

## API Contract Structure

The complete API contract is defined in `api-contracts.json` with the following structure:

```json
{
  "apiBaseUrl": "http://localhost:3000/faith-flow-service",
  "services": {
    "authentication": { ... },
    "attendance": { ... },
    "followups": { ... },
    "dashboard": { ... },
    "members": { ... },
    "assignees": { ... }
  },
  "commonTypes": { ... },
  "httpStatusCodes": { ... },
  "authentication": { ... }
}
```

## Integration Features

### 1. **Error Handling**
All services include error handling with fallback to mock data when API is unavailable.

### 2. **Observable Pattern**
Services use RxJS BehaviorSubjects for reactive data updates across components.

### 3. **Type Safety**
Full TypeScript interfaces for all API requests and responses.

### 4. **Mock Data**
Each service includes mock data for development and testing.

### 5. **Authentication**
All API calls include Bearer token authentication via HTTP interceptor.

## Usage Example

```typescript
// In a component
import { FollowupService } from '../services/followup.service';

constructor(private followupService: FollowupService) {}

async loadFollowups() {
  const response = await this.followupService.getFollowups({
    status: 'pending',
    priority: 'high',
    limit: 10
  });
  
  this.followups = response.followups;
  this.stats = response.stats;
}
```

## Environment Configuration

All services use the environment configuration for API URLs:

```typescript
// environments/environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/faith-flow-service'
};
```

## Models

All data models are organized in the `models` directory:
- `attendance.model.ts` - Attendance-related interfaces
- `followup.model.ts` - Follow-up related interfaces
- `member.model.ts` - Member-related interfaces
- `dashboard.model.ts` - Dashboard-related interfaces

## Next Steps

1. Update components to use the new services instead of local mock data
2. Implement error handling and loading states in UI
3. Add unit tests for all services
4. Set up proper environment configurations for different deployments
5. Implement refresh token logic for authentication