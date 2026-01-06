# Assignment Tracking System Documentation

## Overview

The Assignment tracking system provides a complete audit trail for ticket assignments, allowing admins to track:

- Who created tickets (assignees/admins)
- Who was assigned each ticket (users)
- All reassignment history
- Revocation records

This is essential for the movie-ticket-counter style system where assignees create tickets and assign them to users.

## Database Schema

### Assignments Table

```sql
CREATE TABLE "Assignments" (
  id SERIAL PRIMARY KEY,
  ticketId INTEGER NOT NULL REFERENCES "Tickets"(id),
  assignedByUserId INTEGER NOT NULL REFERENCES "Users"(id),  -- Who made the assignment
  assignedToUserId INTEGER NOT NULL REFERENCES "Users"(id),  -- Who was assigned
  action ENUM('assigned', 'reassigned', 'revoked'),
  previousAssignedToUserId INTEGER REFERENCES "Users"(id),  -- For reassignments
  notes TEXT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

## API Endpoints

### 1. GET /assignments (Admin Only)

Get all assignments with pagination and filtering.

**Query Parameters:**

- `page` - Page number (default: 1)
- `limit` - Results per page (default: 50)
- `ticketId` - Filter by ticket
- `assignedBy` - Filter by assignee user ID
- `assignedTo` - Filter by assigned user ID

**Response:**

```json
{
  "assignments": [...],
  "total": 100,
  "page": 1,
  "pages": 10
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <admin-token>" \
  "http://localhost:3000/assignments?page=1&limit=10"
```

### 2. GET /assignments/ticket/:ticketId

Get assignment history for a specific ticket.

**Access Control:**

- Users: Can only view assignments for tickets assigned to them
- Assignees: Can only view assignments for tickets they created
- Admins: Can view all assignments

**Response:**

```json
[
  {
    "id": 1,
    "ticketId": 5,
    "action": "assigned",
    "notes": "Initial assignment",
    "createdAt": "2025-12-30T10:00:00.000Z",
    "assignedBy": {
      "id": 2,
      "name": "Assignee User",
      "email": "assignee@example.com",
      "role": "assignee"
    },
    "assignedTo": {
      "id": 3,
      "name": "Regular User",
      "email": "user@example.com",
      "role": "user"
    }
  }
]
```

**Example:**

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/assignments/ticket/5
```

### 3. GET /assignments/stats (Admin Only)

Get comprehensive assignment statistics.

**Response:**

```json
{
  "totalAssignments": 150,
  "assignmentsByAction": [
    { "action": "assigned", "count": 100 },
    { "action": "reassigned", "count": 30 },
    { "action": "revoked", "count": 20 }
  ],
  "topAssignees": [
    {
      "assignedBy": {
        "id": 2,
        "name": "Top Assignee",
        "email": "assignee@example.com",
        "role": "assignee"
      },
      "assignmentCount": 50
    }
  ],
  "topAssignedUsers": [
    {
      "assignedTo": {
        "id": 10,
        "name": "Busy User",
        "email": "busy@example.com",
        "role": "user"
      },
      "ticketCount": 25
    }
  ]
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/assignments/stats
```

### 4. GET /assignments/user/:userId (Admin Only)

Get all assignment activity for a specific user.

**Response:**

```json
{
  "user": {
    "id": 2,
    "name": "Assignee User",
    "email": "assignee@example.com",
    "role": "assignee"
  },
  "assignedByUser": [
    // Tickets assigned BY this user (if assignee/admin)
  ],
  "assignedToUser": [
    // Tickets assigned TO this user
  ]
}
```

**Example:**

```bash
curl -H "Authorization: Bearer <admin-token>" \
  http://localhost:3000/assignments/user/2
```

## Automatic Tracking

Assignment records are automatically created when:

### 1. Ticket Creation

When an assignee creates a ticket:

```javascript
POST /tickets
{
  "title": "Movie Ticket: Avengers",
  "description": "One ticket for 7pm showing",
  "priority": "high",
  "assignedToUserId": 5
}
```

Creates assignment record:

```json
{
  "action": "assigned",
  "assignedByUserId": 2, // Assignee who created
  "assignedToUserId": 5, // User assigned
  "notes": "Initial assignment"
}
```

### 2. Ticket Reassignment

When an assignee reassigns a ticket:

```javascript
PUT /tickets/:id/assign
{
  "assignedToUserId": 7  // New user
}
```

Creates assignment record:

```json
{
  "action": "reassigned",
  "assignedByUserId": 2,
  "assignedToUserId": 7,
  "previousAssignedToUserId": 5,
  "notes": "Reassigned from user 5"
}
```

### 3. Ticket Revocation

When a user revokes their ticket:

```javascript
PUT /tickets/:id/revoke
{}
```

Creates assignment record:

```json
{
  "action": "revoked",
  "assignedByUserId": 5, // User who revoked
  "assignedToUserId": 5, // Same user
  "notes": "Ticket revoked by user"
}
```

## Use Cases

### Admin Dashboard - Track Assignee Performance

```javascript
// Get all assignments by a specific assignee
const response = await axios.get(
  `http://localhost:3000/assignments/user/${assigneeId}`,
  { headers: { Authorization: `Bearer ${adminToken}` } }
);

console.log(
  `Assignee created ${response.data.assignedByUser.length} assignments`
);
```

### Admin Report - Most Active Users

```javascript
const stats = await axios.get("http://localhost:3000/assignments/stats", {
  headers: { Authorization: `Bearer ${adminToken}` },
});

console.log("Top Assignees:", stats.data.topAssignees);
console.log("Users with most tickets:", stats.data.topAssignedUsers);
```

### Audit Trail - View Ticket History

```javascript
const history = await axios.get(
  `http://localhost:3000/assignments/ticket/${ticketId}`,
  { headers: { Authorization: `Bearer ${token}` } }
);

history.data.forEach((record) => {
  console.log(
    `${record.action} by ${record.assignedBy.name} at ${record.createdAt}`
  );
});
```

### Filter Assignments - Find Revoked Tickets

```javascript
const assignments = await axios.get("http://localhost:3000/assignments", {
  params: { page: 1, limit: 100 },
  headers: { Authorization: `Bearer ${adminToken}` },
});

const revoked = assignments.data.assignments.filter(
  (a) => a.action === "revoked"
);
console.log(`${revoked.length} tickets were revoked`);
```

## Role-Based Access Summary

| Endpoint                    | Admin          | Assignee       | User           |
| --------------------------- | -------------- | -------------- | -------------- |
| GET /assignments            | ✅ Full access | ❌             | ❌             |
| GET /assignments/ticket/:id | ✅ All tickets | ✅ Own tickets | ✅ Own tickets |
| GET /assignments/stats      | ✅             | ❌             | ❌             |
| GET /assignments/user/:id   | ✅             | ❌             | ❌             |

## Model Relationships

```javascript
Assignment.belongsTo(Ticket, { foreignKey: "ticketId", as: "ticket" });
Assignment.belongsTo(User, {
  foreignKey: "assignedByUserId",
  as: "assignedBy",
});
Assignment.belongsTo(User, {
  foreignKey: "assignedToUserId",
  as: "assignedTo",
});
```

## Migration

The Assignments table is created via migration:

```bash
npx sequelize-cli db:migrate
```

Migration file: `src/migrations/08-create-assignments.js`

## Testing

Run the comprehensive test suite:

```bash
node testAssignments.js
```

This tests:

1. User registration (admin, assignee, user)
2. Ticket creation and assignment
3. Assignment record creation
4. Ticket reassignment
5. Assignment history tracking
6. Ticket revocation
7. Admin viewing all assignments
8. Assignment statistics
9. User-specific assignment activity

## Benefits

1. **Complete Audit Trail**: Track every assignment action with timestamp and user details
2. **Admin Oversight**: Admins can monitor assignee performance and user activity
3. **Accountability**: Know exactly who assigned what to whom and when
4. **Reassignment History**: Never lose track of previous assignments
5. **Revocation Tracking**: See when and why users revoked tickets
6. **Performance Metrics**: Identify top assignees and most active users
7. **Troubleshooting**: Debug issues by reviewing complete assignment history

## Database Query Examples

### Find all tickets assigned by a specific assignee

```sql
SELECT * FROM "Assignments"
WHERE "assignedByUserId" = 2
ORDER BY "createdAt" DESC;
```

### Count assignments by action type

```sql
SELECT action, COUNT(*) as count
FROM "Assignments"
GROUP BY action;
```

### Find users who revoked most tickets

```sql
SELECT "assignedByUserId", COUNT(*) as revoke_count
FROM "Assignments"
WHERE action = 'revoked'
GROUP BY "assignedByUserId"
ORDER BY revoke_count DESC;
```

## Future Enhancements

Potential additions:

- Email notifications when assignments change
- Assignment duration tracking (time between assign and revoke)
- Bulk assignment operations
- Assignment approval workflow
- Export assignment history to CSV/PDF
- Real-time dashboard with WebSockets
- Assignment templates for common patterns
