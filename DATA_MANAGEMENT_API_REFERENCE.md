# MySchool Data Management API Reference

## Quick Reference Guide for Backend Services

### Schools Service

```typescript
import { SchoolsService } from './lib/services/schools.service';

const schoolsService = new SchoolsService();

// Create a school
const school = await schoolsService.createSchool({
  name: 'Test School',
  address: '123 Main St',         // optional
  contactEmail: 'test@school.com' // optional
});

// Get school by ID
const school = await schoolsService.getSchoolById('schoolId');

// Update school
const updated = await schoolsService.updateSchool('schoolId', {
  name: 'New Name',
  address: 'New Address'
});

// Delete school
await schoolsService.deleteSchool('schoolId');

// List all schools
const schools = await schoolsService.listSchools();
```

### Groups Service

```typescript
import { GroupsService } from './lib/services/groups.service';

const groupsService = new GroupsService();

// Create a group
const group = await groupsService.createGroup({
  schoolId: 'school123',
  name: 'Grade 10A',
  description: 'Tenth grade class A' // optional
});

// Get group by ID
const group = await groupsService.getGroupById('groupId');

// Update group
const updated = await groupsService.updateGroup('groupId', {
  name: 'Grade 10B',
  description: 'Updated description'
});

// Delete group
await groupsService.deleteGroup('groupId');

// List groups by school
const groups = await groupsService.listGroupsBySchool('schoolId');
```

### Notices Service

```typescript
import { NoticesService } from './lib/services/notices.service';

const noticesService = new NoticesService();

// Create a notice
const notice = await noticesService.createNotice({
  schoolId: 'school123',
  title: 'Important Announcement',
  body: 'This is the notice content',
  status: 'published', // 'draft' | 'published' | 'archived'
  attachments: [       // optional
    {
      fileName: 'doc.pdf',
      fileType: 'application/pdf',
      downloadURL: '/api/attachments/download/xyz',
      size: 12345
    }
  ]
});

// Get notice by ID
const notice = await noticesService.getNoticeById('noticeId');

// Update notice
const updated = await noticesService.updateNotice('noticeId', {
  title: 'Updated Title',
  status: 'archived'
});

// Delete notice
await noticesService.deleteNotice('noticeId');

// List notices by school (with optional status filter)
const notices = await noticesService.listNoticesBySchool(
  'schoolId',
  'published' // optional: 'draft' | 'published' | 'archived'
);
```

### Attachments Service

```typescript
import { AttachmentsService } from './lib/services/attachments.service';

const attachmentsService = new AttachmentsService();

// Upload an attachment
const attachment = await attachmentsService.uploadAttachment({
  buffer: fileBuffer,           // Buffer
  fileName: 'document.pdf',
  mimeType: 'application/pdf',
  schoolId: 'school123',
  noticeId: 'notice123'
});

// Get signed download URL
const url = await attachmentsService.getAttachmentDownloadUrl(
  'attachmentId',
  'schoolId',
  'noticeId'
);

// Delete attachment
await attachmentsService.deleteAttachment(
  'attachmentId',
  'schoolId',
  'noticeId'
);

// Validate file type
attachmentsService.validateFileType('application/pdf'); // throws if invalid

// Supported file types:
// - application/pdf
// - image/jpeg, image/jpg, image/png, image/gif, image/webp
```

## Authorization Utilities

```typescript
import {
  requireAdmin,
  requireAuth,
  checkSchoolAccess,
  checkGroupAccess
} from './lib/auth/authorization';

// Require admin role
requireAdmin(session); // throws AuthenticationError or AuthorizationError

// Require any authenticated user
requireAuth(session); // throws AuthenticationError

// Check school access (admins: all schools, users: own school only)
checkSchoolAccess(session, 'schoolId'); // throws if no access

// Check group access (admins: all groups, users: only assigned groups)
checkGroupAccess(session, 'schoolId', 'groupId'); // throws if no access
```

## Handler Usage with RLS

### Schools Handler

```typescript
import {
  createSchoolHandler,
  getSchoolHandler,
  updateSchoolHandler,
  deleteSchoolHandler,
  listSchoolsHandler
} from './lib/handlers/schools-handler';

// Create school (admin only)
const school = await createSchoolHandler(session, {
  name: 'New School'
});

// Get school (requires school access)
const school = await getSchoolHandler(session, 'schoolId');

// Update school (admin only)
const updated = await updateSchoolHandler(session, 'schoolId', {
  name: 'Updated Name'
});

// Delete school (admin only)
await deleteSchoolHandler(session, 'schoolId');

// List schools (admin: all, user: own school only)
const schools = await listSchoolsHandler(session);
```

### Groups Handler

```typescript
import {
  createGroupHandler,
  getGroupHandler,
  updateGroupHandler,
  deleteGroupHandler,
  listGroupsHandler
} from './lib/handlers/groups-handler';

// Create group (admin only)
const group = await createGroupHandler(session, {
  schoolId: 'school123',
  name: 'Grade 10A'
});

// Get group (requires group access for users)
const group = await getGroupHandler(session, 'groupId', 'schoolId');

// Update group (admin only)
const updated = await updateGroupHandler(session, 'groupId', {
  name: 'Updated Name'
});

// Delete group (admin only)
await deleteGroupHandler(session, 'groupId');

// List groups (admin: all, user: only assigned groups)
const groups = await listGroupsHandler(session, 'schoolId');
```

### Notices Handler

```typescript
import {
  createNoticeHandler,
  getNoticeHandler,
  updateNoticeHandler,
  deleteNoticeHandler,
  listNoticesHandler
} from './lib/handlers/notices-handler';

// Create notice (admin only)
const notice = await createNoticeHandler(session, {
  schoolId: 'school123',
  title: 'Announcement',
  body: 'Content here',
  status: 'published'
});

// Get notice (requires school access)
const notice = await getNoticeHandler(session, 'noticeId', 'schoolId');

// Update notice (admin only)
const updated = await updateNoticeHandler(session, 'noticeId', {
  status: 'archived'
});

// Delete notice (admin only)
await deleteNoticeHandler(session, 'noticeId');

// List notices (admin: all statuses, user: published only)
const notices = await listNoticesHandler(
  session,
  'schoolId',
  'published' // optional for admins
);
```

## Session Object Structure

```typescript
interface UserSession {
  uid: string;              // Firebase Auth UID
  email: string;            // User email
  schoolId: string;         // Assigned school ID
  role: 'user' | 'admin';   // User role
  displayName?: string;     // Optional display name
  groupIds?: string[];      // Optional array of group IDs
}
```

## Error Handling

```typescript
import {
  AuthenticationError,
  AuthorizationError
} from './lib/auth/authorization';

try {
  await someHandler(session, data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Handle 401 Unauthorized
    return { error: error.message, code: 'UNAUTHORIZED' };
  }
  if (error instanceof AuthorizationError) {
    // Handle 403 Forbidden
    return { error: error.message, code: 'FORBIDDEN' };
  }
  // Handle other errors
  return { error: 'Internal server error', code: 'INTERNAL_ERROR' };
}
```

## RLS Rules Summary

| Operation | Admin | User |
|-----------|-------|------|
| Create School | ✅ | ❌ |
| Read School | All schools | Own school only |
| Update School | ✅ | ❌ |
| Delete School | ✅ | ❌ |
| Create Group | ✅ | ❌ |
| Read Group | All groups | Assigned groups only |
| Update Group | ✅ | ❌ |
| Delete Group | ✅ | ❌ |
| Create Notice | ✅ | ❌ |
| Read Notice | All notices | Published notices in own school |
| Update Notice | ✅ | ❌ |
| Delete Notice | ✅ | ❌ |
| Upload Attachment | ✅ | ❌ |
| Download Attachment | ✅ | If has notice access |
| Delete Attachment | ✅ | ❌ |

## Future API Routes Structure (Not Yet Implemented)

When creating Next.js API routes, use this structure:

```typescript
// app/api/admin/schools/route.ts
import { createSchoolHandler } from '@/lib/handlers/schools-handler';
import { getSession } from '@/lib/auth/session';

export async function POST(request: Request) {
  const session = await getSession(request);
  const data = await request.json();
  
  try {
    const school = await createSchoolHandler(session, data);
    return Response.json(school, { status: 201 });
  } catch (error) {
    // Handle errors with appropriate status codes
    return Response.json(
      { error: error.message, code: error.code },
      { status: error instanceof AuthorizationError ? 403 : 401 }
    );
  }
}
```

## Testing

All services and handlers include comprehensive test coverage:

```bash
# Run all tests
npm test

# Run specific test file
npm test -- schools.service.test.ts

# Run integration tests
npm test -- integration/data-management
```

## Implementation Notes

1. **Service Layer**: Pure business logic, no authorization
2. **Handler Layer**: Adds authorization and RLS checks
3. **Dependency Injection**: Services can be injected for testing
4. **Error Handling**: Use custom error types for clarity
5. **Timestamps**: Automatically managed by services
6. **Validation**: Performed at service layer
7. **Storage Paths**: Organized as `attachments/{schoolId}/{noticeId}/{attachmentId}`
