# Complete Database Operations Overview

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Database Schema](#database-schema)
3. [Table Relationships](#table-relationships)
4. [User Roles & Access Control](#user-roles--access-control)
5. [Data Flow Examples](#data-flow-examples)
6. [Migration System](#migration-system)
7. [Models & Associations](#models--associations)
8. [CRUD Operations](#crud-operations)
9. [Query Examples](#query-examples)

---

## Database Architecture

### Technology Stack

- **Database**: PostgreSQL
- **ORM**: Sequelize (v6.37.7)
- **Migration Tool**: Sequelize CLI
- **Connection**: Configured via `src/config/config.js`

### Database Details

```javascript
Database Name: ticketdb
Host: localhost
Port: 5432
Username: postgres
Dialect: postgres
```

---

## Database Schema

### Complete Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
│─────────────────│
│ id (PK)         │──┐
│ name            │  │
│ email (unique)  │  │
│ password_hash   │  │
│ role (ENUM)     │  │  Creates
│ createdAt       │  │  Tickets
│ updatedAt       │  │
└─────────────────┘  │
                     │
        ┌────────────┼────────────┐
        │            │            │
        │            ▼            │  Assigned
        │    ┌─────────────────┐ │  To
        │    │    Tickets      │ │
        │    │─────────────────│ │
        │    │ id (PK)         │◄┘
        │    │ title           │
        │    │ description     │
        │    │ priority (ENUM) │
        │    │ status (ENUM)   │
        │    │ reporterId (FK) │──┐
        │    │ assigneeId (FK) │──┤
        │    │ createdAt       │  │
        │    │ updatedAt       │  │
        │    └─────────────────┘  │
        │            │             │
        │            │             │
┌───────┴────┐  ┌───┴──────┐  ┌──┴──────────┐
│ Comments   │  │ Activity │  │ Assignments │
│────────────│  │ Logs     │  │─────────────│
│ id (PK)    │  │──────────│  │ id (PK)     │
│ body       │  │ id (PK)  │  │ ticketId    │
│ ticketId   │  │ ticketId │  │ assignedBy  │
│ userId     │  │ userId   │  │ assignedTo  │
│ createdAt  │  │ action   │  │ action      │
│ updatedAt  │  │ changes  │  │ previous    │
└────────────┘  │ createdAt│  │ notes       │
                └──────────┘  │ createdAt   │
                              └─────────────┘
        │
        │  Many-to-Many
        │  Through TicketTags
        ▼
┌─────────────────┐
│ Tags            │
│─────────────────│
│ id (PK)         │
│ name (unique)   │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │
        ▼
┌─────────────────┐
│ TicketTags      │
│─────────────────│
│ id (PK)         │
│ ticketId (FK)   │
│ tagId (FK)      │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

---

## Table Relationships

### 1. Users Table

**Purpose**: Store all system users with role-based access

| Column        | Type         | Constraints                 | Description            |
| ------------- | ------------ | --------------------------- | ---------------------- |
| id            | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique user identifier |
| name          | VARCHAR(255) | NOT NULL                    | User's full name       |
| email         | VARCHAR(255) | UNIQUE, NOT NULL            | Login email            |
| password_hash | VARCHAR(255) | NOT NULL                    | Bcrypt hashed password |
| role          | ENUM         | NOT NULL, DEFAULT 'user'    | user/assignee/admin    |
| createdAt     | TIMESTAMP    | NOT NULL                    | Account creation time  |
| updatedAt     | TIMESTAMP    | NOT NULL                    | Last update time       |

**Role Types**:

- `user`: Can view assigned tickets, revoke tickets
- `assignee`: Can create tickets, assign to users, manage status
- `admin`: Full system access

**Relationships**:

- **One-to-Many**: User → Tickets (as creator via reporterId)
- **One-to-Many**: User → Tickets (as assignee via assigneeId)
- **One-to-Many**: User → Comments
- **One-to-Many**: User → ActivityLogs
- **One-to-Many**: User → Assignments (as assigner)
- **One-to-Many**: User → Assignments (as assigned)

---

### 2. Tickets Table

**Purpose**: Core entity representing movie tickets or service requests

| Column      | Type         | Constraints                      | Description                                 |
| ----------- | ------------ | -------------------------------- | ------------------------------------------- |
| id          | INTEGER      | PRIMARY KEY, AUTO_INCREMENT      | Unique ticket identifier                    |
| title       | VARCHAR(255) | NOT NULL                         | Ticket title/summary                        |
| description | TEXT         | -                                | Detailed description                        |
| priority    | ENUM         | DEFAULT 'medium'                 | low/medium/high                             |
| status      | ENUM         | DEFAULT 'pending'                | pending/approved/rejected/completed/revoked |
| reporterId  | INTEGER      | FOREIGN KEY → Users.id, NOT NULL | Who created the ticket (assignee/admin)     |
| assigneeId  | INTEGER      | FOREIGN KEY → Users.id           | Who the ticket is assigned to (user)        |
| createdAt   | TIMESTAMP    | NOT NULL                         | Ticket creation time                        |
| updatedAt   | TIMESTAMP    | NOT NULL                         | Last update time                            |

**Status Flow**:

```
pending → approved → completed
  ↓         ↓           ↓
rejected  revoked    revoked
```

**Priority Levels**:

- `low`: Non-urgent tickets
- `medium`: Standard priority (default)
- `high`: Urgent tickets

**Relationships**:

- **Many-to-One**: Ticket → User (creator, via reporterId)
- **Many-to-One**: Ticket → User (assignedUser, via assigneeId)
- **One-to-Many**: Ticket → Comments
- **One-to-Many**: Ticket → ActivityLogs
- **One-to-Many**: Ticket → Assignments
- **Many-to-Many**: Ticket ↔ Tags (through TicketTags)

---

### 3. Comments Table

**Purpose**: Discussion and updates on tickets

| Column    | Type      | Constraints                              | Description               |
| --------- | --------- | ---------------------------------------- | ------------------------- |
| id        | INTEGER   | PRIMARY KEY, AUTO_INCREMENT              | Unique comment identifier |
| body      | TEXT      | NOT NULL                                 | Comment content           |
| ticketId  | INTEGER   | FOREIGN KEY → Tickets.id, CASCADE DELETE | Associated ticket         |
| userId    | INTEGER   | FOREIGN KEY → Users.id, CASCADE DELETE   | Comment author            |
| createdAt | TIMESTAMP | NOT NULL                                 | Comment creation time     |
| updatedAt | TIMESTAMP | NOT NULL                                 | Last edit time            |

**Relationships**:

- **Many-to-One**: Comment → Ticket
- **Many-to-One**: Comment → User

**Cascade Behavior**: When ticket/user is deleted, comments are automatically deleted

---

### 4. Tags Table

**Purpose**: Categorization labels for tickets

| Column    | Type         | Constraints                 | Description                       |
| --------- | ------------ | --------------------------- | --------------------------------- |
| id        | INTEGER      | PRIMARY KEY, AUTO_INCREMENT | Unique tag identifier             |
| name      | VARCHAR(255) | UNIQUE, NOT NULL            | Tag name (e.g., "bug", "feature") |
| createdAt | TIMESTAMP    | NOT NULL                    | Tag creation time                 |
| updatedAt | TIMESTAMP    | NOT NULL                    | Last update time                  |

**Relationships**:

- **Many-to-Many**: Tag ↔ Tickets (through TicketTags)

**Common Tags**: bug, feature, enhancement, urgent, documentation, question

---

### 5. TicketTags Table

**Purpose**: Junction table for many-to-many relationship between Tickets and Tags

| Column    | Type      | Constraints                              | Description                    |
| --------- | --------- | ---------------------------------------- | ------------------------------ |
| id        | INTEGER   | PRIMARY KEY, AUTO_INCREMENT              | Unique relationship identifier |
| ticketId  | INTEGER   | FOREIGN KEY → Tickets.id, CASCADE DELETE | Associated ticket              |
| tagId     | INTEGER   | FOREIGN KEY → Tags.id, CASCADE DELETE    | Associated tag                 |
| createdAt | TIMESTAMP | NOT NULL                                 | Association creation time      |
| updatedAt | TIMESTAMP | NOT NULL                                 | Last update time               |

**Relationships**:

- **Many-to-One**: TicketTag → Ticket
- **Many-to-One**: TicketTag → Tag

**Cascade Behavior**: When ticket or tag is deleted, junction records are automatically removed

---

### 6. ActivityLogs Table

**Purpose**: Audit trail of all ticket changes

| Column    | Type         | Constraints                              | Description                                       |
| --------- | ------------ | ---------------------------------------- | ------------------------------------------------- |
| id        | INTEGER      | PRIMARY KEY, AUTO_INCREMENT              | Unique log identifier                             |
| ticketId  | INTEGER      | FOREIGN KEY → Tickets.id, CASCADE DELETE | Associated ticket                                 |
| userId    | INTEGER      | FOREIGN KEY → Users.id, CASCADE DELETE   | User who made the change                          |
| action    | VARCHAR(255) | NOT NULL                                 | Type of action (created, updated, status_changed) |
| changes   | TEXT         | -                                        | JSON string of what changed                       |
| createdAt | TIMESTAMP    | NOT NULL                                 | When action occurred                              |
| updatedAt | TIMESTAMP    | NOT NULL                                 | Last update time                                  |

**Common Actions**:

- `created`: Ticket was created
- `updated`: Ticket details changed
- `status_changed`: Status transition
- `comment_added`: New comment posted
- `assigned`: Ticket assigned to user
- `reassigned`: Ticket reassigned to different user
- `revoked`: User revoked their ticket

**Relationships**:

- **Many-to-One**: ActivityLog → Ticket
- **Many-to-One**: ActivityLog → User

---

### 7. Assignments Table

**Purpose**: Complete audit trail of ticket assignments

| Column                   | Type      | Constraints                              | Description                              |
| ------------------------ | --------- | ---------------------------------------- | ---------------------------------------- |
| id                       | INTEGER   | PRIMARY KEY, AUTO_INCREMENT              | Unique assignment identifier             |
| assignedByUserId         | INTEGER   | FOREIGN KEY → Users.id, CASCADE DELETE   | Who made the assignment (assignee/admin) |
| assignedToUserId         | INTEGER   | FOREIGN KEY → Users.id, CASCADE DELETE   | Who was assigned (user)                  |
| action                   | ENUM      | DEFAULT 'assigned'                       | assigned/reassigned/revoked              |
| previousAssignedToUserId | INTEGER   | FOREIGN KEY → Users.id, SET NULL         | Previous assignee (for reassignments)    |
| notes                    | TEXT      | -                                        | Optional notes about the assignment      |
| createdAt                | TIMESTAMP | NOT NULL                                 | Assignment creation time                 |
| updatedAt                | TIMESTAMP | NOT NULL                                 | Last update time                         |

**Action Types**:

- `assigned`: Initial assignment
- `reassigned`: Moved to different user
- `revoked`: User revoked the ticket

**Relationships**:

- **Many-to-One**: Assignment → Ticket
- **Many-to-One**: Assignment → User (assignedBy)
- **Many-to-One**: Assignment → User (assignedTo)
- **Many-to-One**: Assignment → User (previousAssignedTo, nullable)

---

## User Roles & Access Control

### Role Hierarchy

```
┌─────────────────────────────────────────────┐
│              ADMIN                          │
│  - Full system access                       │
│  - View all tickets                         │
│  - Manage users                             │
│  - View all assignments & statistics        │
│  - Delete any ticket                        │
└─────────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────────┐    ┌──────────────────┐
│    ASSIGNEE      │    │      USER        │
│──────────────────│    │──────────────────│
│ - Create tickets │    │ - View assigned  │
│ - Assign to users│    │   tickets only   │
│ - Change status  │    │ - Revoke tickets │
│ - Update details │    │ - Add comments   │
│ - Delete own     │    │ - View details   │
│ - View own only  │    │ - NO creation    │
└──────────────────┘    └──────────────────┘
```

### Permission Matrix

| Operation               | Admin    | Assignee           | User               |
| ----------------------- | -------- | ------------------ | ------------------ |
| **Tickets**             |          |                    |                    |
| Create ticket           | ✅       | ✅                 | ❌                 |
| View all tickets        | ✅       | ❌ (own only)      | ❌ (assigned only) |
| View ticket details     | ✅       | ✅ (own)           | ✅ (assigned)      |
| Update ticket           | ✅       | ✅ (own)           | ❌                 |
| Change status           | ✅       | ✅ (own)           | ❌                 |
| Delete ticket           | ✅       | ✅ (own)           | ❌                 |
| Assign ticket           | ✅       | ✅ (own)           | ❌                 |
| Reassign ticket         | ✅       | ✅ (own)           | ❌                 |
| Revoke ticket           | ✅       | ❌                 | ✅ (own)           |
| **Comments**            |          |                    |                    |
| Add comment             | ✅       | ✅                 | ✅ (on assigned)   |
| View comments           | ✅       | ✅ (on accessible) | ✅ (on assigned)   |
| Update comment          | ✅       | ✅ (own)           | ✅ (own)           |
| Delete comment          | ✅       | ✅ (own)           | ✅ (own)           |
| **Tags**                |          |                    |                    |
| Create tag              | ✅       | ❌                 | ❌                 |
| View tags               | ✅       | ✅                 | ✅                 |
| Delete tag              | ✅       | ❌                 | ❌                 |
| **Assignments**         |          |                    |                    |
| View all assignments    | ✅       | ❌                 | ❌                 |
| View ticket assignments | ✅       | ✅ (own)           | ✅ (assigned)      |
| View statistics         | ✅       | ❌                 | ❌                 |
| View user activity      | ✅       | ❌                 | ❌                 |
| **Users**               |          |                    |                    |
| Register                | Public   | Public             | Public             |
| View profile            | ✅ (all) | ✅ (self)          | ✅ (self)          |

---

## Data Flow Examples

### Example 1: Complete Ticket Lifecycle

```
Step 1: ASSIGNEE CREATES TICKET
┌──────────────────────────────────────────────┐
│ POST /tickets                                │
│ Headers: Authorization: Bearer <assignee>    │
│ Body: {                                      │
│   title: "Movie: Avengers",                  │
│   description: "1 ticket for 7pm",           │
│   priority: "high",                          │
│   assignedToUserId: 5                        │
│ }                                            │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Operations:                         │
│                                              │
│ 1. INSERT INTO Tickets                       │
│    (title, description, priority, status,    │
│     reporterId, assigneeId)                  │
│    VALUES ('Movie: Avengers', ..., 2, 5)     │
│    RETURNING id;  -- e.g., id = 10           │
│                                              │
│ 2. INSERT INTO Assignments                   │
│    (ticketId, assignedByUserId,              │
│     assignedToUserId, action, notes)         │
│    VALUES (10, 2, 5, 'assigned',             │
│            'Initial assignment');            │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Result:                                      │
│ - Ticket created with status: "pending"      │
│ - Assignment record created                  │
│ - User 5 can now see the ticket              │
└──────────────────────────────────────────────┘

Step 2: USER VIEWS TICKET
┌──────────────────────────────────────────────┐
│ GET /tickets/10                              │
│ Headers: Authorization: Bearer <user-5>      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Query:                              │
│                                              │
│ SELECT t.*, u1.name as creator_name,         │
│        u2.name as assigned_name              │
│ FROM Tickets t                               │
│ LEFT JOIN Users u1 ON t.reporterId = u1.id   │
│ LEFT JOIN Users u2 ON t.assigneeId = u2.id   │
│ WHERE t.id = 10                              │
│   AND t.assigneeId = 5;  -- Access check     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Result:                                      │
│ {                                            │
│   id: 10,                                    │
│   title: "Movie: Avengers",                  │
│   status: "pending",                         │
│   creator: { name: "Assignee User" },        │
│   assignedUser: { name: "Regular User" }     │
│ }                                            │
└──────────────────────────────────────────────┘

Step 3: ASSIGNEE CHANGES STATUS TO APPROVED
┌──────────────────────────────────────────────┐
│ PUT /tickets/10/status                       │
│ Headers: Authorization: Bearer <assignee>    │
│ Body: { status: "approved" }                 │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Operations:                         │
│                                              │
│ 1. UPDATE Tickets                            │
│    SET status = 'approved',                  │
│        updatedAt = NOW()                     │
│    WHERE id = 10                             │
│      AND reporterId = 2;  -- Own ticket      │
│                                              │
│ 2. INSERT INTO ActivityLogs                  │
│    (ticketId, userId, action, changes)       │
│    VALUES (10, 2, 'status_changed',          │
│            '{"from":"pending",               │
│              "to":"approved"}');             │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Result:                                      │
│ - Ticket status: pending → approved          │
│ - Activity log created                       │
└──────────────────────────────────────────────┘

Step 4: USER ADDS COMMENT
┌──────────────────────────────────────────────┐
│ POST /comments                               │
│ Headers: Authorization: Bearer <user-5>      │
│ Body: {                                      │
│   ticketId: 10,                              │
│   body: "Thanks for approval!"               │
│ }                                            │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Operations:                         │
│                                              │
│ 1. Verify user has access to ticket         │
│    SELECT * FROM Tickets                     │
│    WHERE id = 10 AND assigneeId = 5;         │
│                                              │
│ 2. INSERT INTO Comments                      │
│    (body, ticketId, userId)                  │
│    VALUES ('Thanks...', 10, 5);              │
└──────────────────────────────────────────────┘

Step 5: USER REVOKES TICKET
┌──────────────────────────────────────────────┐
│ PUT /tickets/10/revoke                       │
│ Headers: Authorization: Bearer <user-5>      │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Operations:                         │
│                                              │
│ 1. UPDATE Tickets                            │
│    SET status = 'revoked'                    │
│    WHERE id = 10                             │
│      AND assigneeId = 5;  -- Access check    │
│                                              │
│ 2. INSERT INTO Assignments                   │
│    (ticketId, assignedByUserId,              │
│     assignedToUserId, action, notes)         │
│    VALUES (10, 5, 5, 'revoked',              │
│            'Ticket revoked by user');        │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Final State:                                 │
│ - Ticket status: revoked                     │
│ - 2 assignment records (assigned + revoked)  │
│ - Activity logs show complete history        │
│ - Comments preserved                         │
└──────────────────────────────────────────────┘
```

### Example 2: Ticket Reassignment Flow

```
Initial State:
- Ticket 15 assigned to User A (id=3)
- Created by Assignee X (id=2)

┌──────────────────────────────────────────────┐
│ PUT /tickets/15/assign                       │
│ Headers: Authorization: Bearer <assignee-2>  │
│ Body: { assignedToUserId: 8 }  // User B     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Database Operations:                         │
│                                              │
│ 1. Verify assignee owns ticket               │
│    SELECT * FROM Tickets                     │
│    WHERE id = 15 AND reporterId = 2;         │
│                                              │
│ 2. Verify new user exists                   │
│    SELECT * FROM Users WHERE id = 8;         │
│                                              │
│ 3. UPDATE Tickets                            │
│    SET assigneeId = 8                        │
│    WHERE id = 15;                            │
│                                              │
│ 4. INSERT INTO Assignments                   │
│    (ticketId, assignedByUserId,              │
│     assignedToUserId, action,                │
│     previousAssignedToUserId, notes)         │
│    VALUES (15, 2, 8, 'reassigned',           │
│            3, 'Reassigned from user 3');     │
└──────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────┐
│ Result:                                      │
│ - Ticket now assigned to User B (id=8)       │
│ - User A (id=3) no longer has access         │
│ - Assignment record tracks:                  │
│   • Who: Assignee X (id=2)                   │
│   • From: User A (id=3)                      │
│   • To: User B (id=8)                        │
│   • When: timestamp                          │
└──────────────────────────────────────────────┘
```

---

## Migration System

### Migration Files (in order)

```
src/migrations/
├── 01-create-users.js          ← Creates Users table
├── 02-create-tickets.js        ← Creates Tickets table
├── 03-create-comments.js       ← Creates Comments table
├── 04-create-tags.js           ← Creates Tags table
├── 05-create-ticket-tags.js    ← Creates TicketTags junction
├── 06-create-activity-logs.js  ← Creates ActivityLogs table
├── 07-update-ticket-status.js  ← Updates status ENUM
├── 08-create-assignments.js    ← Creates Assignments table
└── 09-add-assignee-role.js     ← Adds 'assignee' to role ENUM
```

### How Migrations Work

```bash
# Run all pending migrations
npx sequelize-cli db:migrate

# Undo last migration
npx sequelize-cli db:migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all

# Check migration status
npx sequelize-cli db:migrate:status
```

### Migration Tracking

Sequelize creates a `SequelizeMeta` table:

```sql
CREATE TABLE "SequelizeMeta" (
  name VARCHAR(255) PRIMARY KEY
);
```

This table stores executed migration names to prevent duplicate runs.

### Example Migration Structure

```javascript
// Migration file structure
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create/modify tables
    await queryInterface.createTable("TableName", {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... other columns
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback changes
    await queryInterface.dropTable("TableName");
  },
};
```

---

## Models & Associations

### Sequelize Model Structure

All models are in `src/models/` and auto-loaded by `src/models/index.js`.

### User Model Associations

```javascript
// src/models/user.js
User.hasMany(Ticket, { foreignKey: "reporterId", as: "reportedTickets" });
User.hasMany(Ticket, { foreignKey: "assigneeId", as: "assignedTickets" });
User.hasMany(Comment, { foreignKey: "userId", as: "comments" });
User.hasMany(ActivityLog, { foreignKey: "userId", as: "activityLogs" });
User.hasMany(Assignment, { foreignKey: "assignedByUserId", as: "assignedBy" });
User.hasMany(Assignment, { foreignKey: "assignedToUserId", as: "assignedTo" });
```

### Ticket Model Associations

```javascript
// src/models/ticket.js
Ticket.belongsTo(User, { foreignKey: "reporterId", as: "creator" });
Ticket.belongsTo(User, { foreignKey: "assigneeId", as: "assignedUser" });
Ticket.hasMany(Comment, { foreignKey: "ticketId", as: "comments" });
Ticket.hasMany(ActivityLog, { foreignKey: "ticketId", as: "activityLogs" });
Ticket.hasMany(Assignment, { foreignKey: "ticketId", as: "assignments" });
Ticket.belongsToMany(Tag, { through: "TicketTags", foreignKey: "ticketId" });
```

### Comment Model Associations

```javascript
// src/models/comment.js
Comment.belongsTo(Ticket, { foreignKey: "ticketId", as: "ticket" });
Comment.belongsTo(User, { foreignKey: "userId", as: "user" });
```

### Tag Model Associations

```javascript
// src/models/tag.js
Tag.belongsToMany(Ticket, { through: "TicketTags", foreignKey: "tagId" });
```

### Assignment Model Associations

```javascript
// src/models/assignment.js
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

---

## CRUD Operations

### Create Operations

#### 1. Create User (Register)

```javascript
// POST /auth/register
const user = await User.create({
  name: "John Doe",
  email: "john@example.com",
  password_hash: await bcrypt.hash(password, 10),
  role: "user",
});

// Database: INSERT INTO Users (...) VALUES (...);
```

#### 2. Create Ticket (Assignee)

```javascript
// POST /tickets
const ticket = await Ticket.create({
  title: "Movie Ticket",
  description: "Avengers at 7pm",
  priority: "high",
  status: "pending",
  reporterId: req.user.id, // Current assignee
  assigneeId: 5, // User to assign
});

// Also creates Assignment record automatically
```

#### 3. Create Comment

```javascript
// POST /comments
const comment = await Comment.create({
  body: "This is a comment",
  ticketId: 10,
  userId: req.user.id,
});
```

### Read Operations

#### 1. Get All Tickets (Role-based)

```javascript
// GET /tickets
let whereClause = {};

if (req.user.role === "user") {
  // Users see only assigned tickets
  whereClause.assigneeId = req.user.id;
} else if (req.user.role === "assignee") {
  // Assignees see only created tickets
  whereClause.reporterId = req.user.id;
}
// Admins see all (no where clause)

const tickets = await Ticket.findAll({
  where: whereClause,
  include: [
    { model: User, as: "creator" },
    { model: User, as: "assignedUser" },
  ],
});
```

#### 2. Get Ticket by ID with Related Data

```javascript
// GET /tickets/:id
const ticket = await Ticket.findByPk(id, {
  include: [
    { model: User, as: "creator", attributes: ["id", "name", "email"] },
    { model: User, as: "assignedUser", attributes: ["id", "name", "email"] },
    {
      model: Comment,
      as: "comments",
      include: [{ model: User, as: "user", attributes: ["name"] }],
    },
    { model: Tag },
  ],
});
```

#### 3. Get Assignment History

```javascript
// GET /assignments/ticket/:ticketId
const assignments = await Assignment.findAll({
  where: { ticketId: id },
  include: [
    { model: User, as: "assignedBy" },
    { model: User, as: "assignedTo" },
  ],
  order: [["createdAt", "DESC"]],
});
```

### Update Operations

#### 1. Update Ticket Status

```javascript
// PUT /tickets/:id/status
await ticket.update({
  status: "approved",
});

// Also creates ActivityLog automatically
```

#### 2. Reassign Ticket

```javascript
// PUT /tickets/:id/assign
const previousUserId = ticket.assigneeId;

await ticket.update({
  assigneeId: newUserId,
});

// Create assignment record
await Assignment.create({
  ticketId: ticket.id,
  assignedByUserId: req.user.id,
  assignedToUserId: newUserId,
  action: "reassigned",
  previousAssignedToUserId: previousUserId,
});
```

#### 3. Update Comment

```javascript
// PUT /comments/:id
await comment.update({
  body: "Updated comment text",
});
```

### Delete Operations

#### 1. Delete Ticket (Cascade)

```javascript
// DELETE /tickets/:id
await ticket.destroy();

// Automatically deletes (CASCADE):
// - All Comments on this ticket
// - All ActivityLogs for this ticket
// - All Assignments for this ticket
// - All TicketTags for this ticket
```

#### 2. Delete Comment

```javascript
// DELETE /comments/:id
await comment.destroy();
```

#### 3. Delete Tag

```javascript
// DELETE /tags/:id
await tag.destroy();

// Automatically deletes TicketTags (CASCADE)
```

---

## Query Examples

### Complex Queries

#### 1. Get Tickets with Filters

```javascript
const tickets = await Ticket.findAll({
  where: {
    status: "pending",
    priority: { [Op.in]: ["medium", "high"] },
    createdAt: {
      [Op.gte]: new Date("2025-01-01"),
    },
  },
  include: [
    { model: User, as: "creator" },
    { model: User, as: "assignedUser" },
  ],
  order: [["createdAt", "DESC"]],
  limit: 10,
  offset: 0,
});
```

#### 2. Count Tickets by Status

```javascript
const statusCounts = await Ticket.findAll({
  attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
  group: ["status"],
});

// Result: [
//   { status: 'pending', count: 25 },
//   { status: 'approved', count: 50 },
//   { status: 'completed', count: 100 }
// ]
```

#### 3. Get Top Assignees

```javascript
const topAssignees = await Assignment.findAll({
  attributes: [
    "assignedByUserId",
    [sequelize.fn("COUNT", sequelize.col("Assignment.id")), "count"],
  ],
  include: [
    {
      model: User,
      as: "assignedBy",
      attributes: ["id", "name", "email"],
    },
  ],
  group: ["assignedByUserId", "assignedBy.id"],
  order: [[sequelize.fn("COUNT", sequelize.col("Assignment.id")), "DESC"]],
  limit: 10,
});
```

#### 4. Search Tickets by Title/Description

```javascript
const searchResults = await Ticket.findAll({
  where: {
    [Op.or]: [
      { title: { [Op.iLike]: `%${searchTerm}%` } },
      { description: { [Op.iLike]: `%${searchTerm}%` } },
    ],
  },
});
```

#### 5. Get User with All Related Data

```javascript
const user = await User.findByPk(userId, {
  include: [
    {
      model: Ticket,
      as: "reportedTickets",
      include: [{ model: User, as: "assignedUser" }],
    },
    {
      model: Ticket,
      as: "assignedTickets",
      include: [{ model: User, as: "creator" }],
    },
    { model: Comment, as: "comments" },
  ],
});
```

---

## Database Initialization

### Fresh Setup (Development)

```bash
# 1. Drop all tables (clean slate)
node cleanDB.js

# 2. Run all migrations
npx sequelize-cli db:migrate

# 3. (Optional) Seed data
npx sequelize-cli db:seed:all

# 4. Start server
npm start
```

### Production Setup

```bash
# 1. Create database
createdb ticketdb

# 2. Run migrations only (no seeds)
NODE_ENV=production npx sequelize-cli db:migrate

# 3. Start server
NODE_ENV=production npm start
```

---

## Performance Considerations

### Indexes

The following columns should have indexes (some auto-created by Sequelize):

**Automatic Indexes**:

- Primary Keys (all `id` columns)
- Foreign Keys (reporterId, assigneeId, ticketId, userId, tagId)
- Unique constraints (Users.email, Tags.name)

**Recommended Additional Indexes**:

```sql
CREATE INDEX idx_tickets_status ON Tickets(status);
CREATE INDEX idx_tickets_priority ON Tickets(priority);
CREATE INDEX idx_tickets_created_at ON Tickets(createdAt);
CREATE INDEX idx_assignments_action ON Assignments(action);
CREATE INDEX idx_activity_logs_created_at ON ActivityLogs(createdAt);
```

### Query Optimization Tips

1. **Always use WHERE clauses** for role-based filtering
2. **Include only needed fields** with `attributes: []`
3. **Paginate large result sets** with `limit` and `offset`
4. **Use eager loading** for related data (avoid N+1 queries)
5. **Index frequently queried columns**

---

## Backup & Recovery

### Backup Database

```bash
pg_dump -U postgres ticketdb > backup_$(date +%Y%m%d).sql
```

### Restore Database

```bash
psql -U postgres ticketdb < backup_20251230.sql
```

### Backup Specific Table

```bash
pg_dump -U postgres -t Tickets ticketdb > tickets_backup.sql
```

---

## Common Database Operations Summary

| Operation        | Command/Code                                                 | Description                  |
| ---------------- | ------------------------------------------------------------ | ---------------------------- |
| **Migrations**   |                                                              |                              |
| Run migrations   | `npx sequelize-cli db:migrate`                               | Apply all pending migrations |
| Undo migration   | `npx sequelize-cli db:migrate:undo`                          | Rollback last migration      |
| Create migration | `npx sequelize-cli migration:generate --name migration-name` | Generate new migration file  |
| **Seeds**        |                                                              |                              |
| Run seeds        | `npx sequelize-cli db:seed:all`                              | Insert demo data             |
| Undo seeds       | `npx sequelize-cli db:seed:undo:all`                         | Remove seeded data           |
| **Development**  |                                                              |                              |
| Clean DB         | `node cleanDB.js`                                            | Drop all tables              |
| Reset DB         | `node cleanDB.js && npx sequelize-cli db:migrate`            | Fresh start                  |
| Test API         | `node testAPI.js`                                            | Test endpoints               |
| Test Assignments | `node testAssignments.js`                                    | Test assignment system       |

---

## Database Connection Pooling

Sequelize automatically manages connection pooling:

```javascript
// config.js
{
  pool: {
    max: 5,        // Maximum connections
    min: 0,        // Minimum connections
    acquire: 30000, // Max time to get connection (ms)
    idle: 10000    // Max time connection can be idle (ms)
  }
}
```

---

## Troubleshooting

### Common Issues

**1. Migration already exists**

```bash
# Solution: Check SequelizeMeta table
SELECT * FROM "SequelizeMeta";

# Remove specific migration
DELETE FROM "SequelizeMeta" WHERE name = '01-create-users.js';
```

**2. Foreign key constraint violation**

```
Error: update or delete on table violates foreign key constraint
```

Solution: Delete related records first or use CASCADE DELETE

**3. ENUM value not found**

```
Error: invalid input value for enum
```

Solution: Run migration to update ENUM or check valid values

**4. Connection refused**

```
Error: connect ECONNREFUSED ::1:5432
```

Solution: Check PostgreSQL is running: `pg_ctl status`

---

## Summary

This ticket management system uses:

- **7 core tables** for data storage
- **3 user roles** for access control
- **Role-based filtering** in all queries
- **Cascade deletes** for data integrity
- **Audit trail** via ActivityLogs and Assignments
- **Sequelize ORM** for type-safe database operations
- **Migration system** for version control
- **Many-to-many relationships** for ticket tags
- **Complete assignment tracking** for accountability

The database is designed for a movie-ticket-counter style workflow where assignees create and manage tickets, users can view and revoke their assigned tickets, and admins have full oversight through comprehensive assignment tracking and statistics.
