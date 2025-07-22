# DEPRECATED: Events Module

**⚠️ This module has been DEPRECATED as of [current date]**

## Migration Notice

The Events feature has been replaced by the new **Attendance** module which focuses on sessions rather than events. 

### What Changed:
- ❌ **Events** → ✅ **Sessions/Attendance**
- More focus on attendance tracking and session management
- Improved UI/UX with modern design patterns
- Better analytics and insights for participation tracking

### Migration Path:
- All event-related functionality has been moved to `/attendance`
- Navigation has been updated to point to the new attendance module
- The old `/events` route now redirects to `/attendance`

### For Developers:
- Do not add new features to this module
- Do not import components from this module in new code
- Use the new `AttendanceService` instead of any event services
- Refer to the new attendance module at `/src/app/attendance/`

### Removal Timeline:
This deprecated module will be removed in a future release after ensuring all functionality has been properly migrated and tested.
