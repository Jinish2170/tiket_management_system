# Ticket Management System - API Documentation

## Overview

This document describes all API endpoints available in the Ticket Management System, including request/response formats and use cases for testing.

---

## Base URL

```
http://localhost:3000/api
```

---

## Authentication

All endpoints (except login/register) require authentication via JWT token in the `Authorization` header:

```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. User Management

#### 1.1 Register User

**POST** `/auth/register`

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "user"
}
```

**Response (201):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2024-12-30T06:45:00Z"
}
```

**Use Case:** Create a new user account for ticket system access.

---

#### 1.2 Login User

**POST** `/auth/login`

**Request Body:**

```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Use Case:** Authenticate user and obtain JWT token for subsequent requests.

---

#### 1.3 Get User Profile

**GET** `/users/:id`

**Headers:**

```
Authorization: Bearer <token>
```

**Response (200):**

```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "user",
  "createdAt": "2024-12-30T06:45:00Z",
  "updatedAt": "2024-12-30T06:45:00Z"
}
```

**Use Case:** Retrieve current user's profile information.

---

### 2. Ticket Management

#### 2.1 Create Ticket

**POST** `/tickets`

**Request Body:**

```json
{
  "title": "Login button not working",
  "description": "The login button on the homepage is not responding to clicks",
  "priority": "high",
  "status": "open",
  "assigned_to": 2
}
```

**Response (201):**

```json
{
  "id": 1,
  "title": "Login button not working",
  "description": "The login button on the homepage is not responding to clicks",
  "priority": "high",
  "status": "open",
  "created_by": 1,
  "assigned_to": 2,
  "createdAt": "2024-12-30T08:00:00Z"
}
```

**Use Case:** User reports a new issue/bug that needs to be tracked.

---

#### 2.2 Get All Tickets

**GET** `/tickets?status=open&priority=high`

**Query Parameters:**

- `status` (optional): open, in_progress, closed
- `priority` (optional): low, medium, high
- `assigned_to` (optional): User ID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "Login button not working",
      "priority": "high",
      "status": "open",
      "created_by": 1,
      "assigned_to": 2,
      "createdAt": "2024-12-30T08:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15
  }
}
```

**Use Case:** View all tickets with filtering by status and priority.

---

#### 2.3 Get Single Ticket

**GET** `/tickets/:id`

**Response (200):**

```json
{
  "id": 1,
  "title": "Login button not working",
  "description": "The login button on the homepage is not responding to clicks",
  "priority": "high",
  "status": "open",
  "created_by": {
    "id": 1,
    "name": "John Doe"
  },
  "assigned_to": {
    "id": 2,
    "name": "Jane Smith"
  },
  "comments": [
    {
      "id": 1,
      "text": "Working on this issue",
      "user": "Jane Smith",
      "createdAt": "2024-12-30T09:00:00Z"
    }
  ],
  "createdAt": "2024-12-30T08:00:00Z",
  "updatedAt": "2024-12-30T09:30:00Z"
}
```

**Use Case:** View detailed information about a specific ticket including comments.

---

#### 2.4 Update Ticket

**PUT** `/tickets/:id`

**Request Body:**

```json
{
  "status": "in_progress",
  "priority": "medium",
  "assigned_to": 3,
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "id": 1,
  "title": "Login button not working",
  "status": "in_progress",
  "priority": "medium",
  "assigned_to": 3,
  "updatedAt": "2024-12-30T10:00:00Z"
}
```

**Use Case:** Update ticket status, priority, or reassign to another user.

---

#### 2.5 Close Ticket

**PATCH** `/tickets/:id/close`

**Request Body:**

```json
{
  "resolution": "Issue fixed in v2.1.0 release"
}
```

**Response (200):**

```json
{
  "id": 1,
  "status": "closed",
  "resolution": "Issue fixed in v2.1.0 release",
  "closedAt": "2024-12-30T11:00:00Z"
}
```

**Use Case:** Mark a ticket as resolved/closed.

---

#### 2.6 Delete Ticket

**DELETE** `/tickets/:id`

**Response (204):** No Content

**Use Case:** Remove a ticket from the system (admin only).

---

### 3. Comments Management

#### 3.1 Add Comment to Ticket

**POST** `/tickets/:id/comments`

**Request Body:**

```json
{
  "text": "I've identified the root cause. It's a CSS issue with the button styling."
}
```

**Response (201):**

```json
{
  "id": 5,
  "ticket_id": 1,
  "user_id": 2,
  "text": "I've identified the root cause. It's a CSS issue with the button styling.",
  "createdAt": "2024-12-30T09:15:00Z"
}
```

**Use Case:** Add a comment/update to a ticket for team communication.

---

#### 3.2 Get Ticket Comments

**GET** `/tickets/:id/comments`

**Response (200):**

```json
{
  "data": [
    {
      "id": 1,
      "text": "Assigned to me",
      "user": "Jane Smith",
      "createdAt": "2024-12-30T08:30:00Z"
    },
    {
      "id": 2,
      "text": "Working on this issue",
      "user": "Jane Smith",
      "createdAt": "2024-12-30T09:00:00Z"
    }
  ]
}
```

**Use Case:** View all comments and updates on a ticket.

---

#### 3.3 Delete Comment

**DELETE** `/tickets/:id/comments/:commentId`

**Response (204):** No Content

**Use Case:** Remove an incorrect or offensive comment.

---

---

## Testing Guide

### Tools Required

- **Postman** or **Thunder Client** (VS Code extension)
- **cURL** (command line)

### Step-by-Step Testing

#### 1. Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123",
    "role": "user"
  }'
```

#### 2. Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

**Save the token from response**

#### 3. Create a Ticket

```bash
curl -X POST http://localhost:3000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "title": "Login button not working",
    "description": "The login button on the homepage is not responding",
    "priority": "high",
    "status": "open"
  }'
```

#### 4. Get All Tickets

```bash
curl -X GET "http://localhost:3000/api/tickets?status=open&priority=high" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 5. Add Comment

```bash
curl -X POST http://localhost:3000/api/tickets/1/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "text": "Working on this issue"
  }'
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": {
    "email": "Email is required"
  }
}
```

### 401 Unauthorized

```json
{
  "error": "Invalid or missing token"
}
```

### 403 Forbidden

```json
{
  "error": "You do not have permission to perform this action"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal server error"
}
```

---

## Best Practices

1. **Always include token** in Authorization header for protected routes
2. **Validate input** before sending requests
3. **Use appropriate HTTP methods** (GET for retrieval, POST for creation, PUT/PATCH for updates)
4. **Handle pagination** for large datasets using page and limit parameters
5. **Test error scenarios** to ensure proper error handling

---

## Environment Setup for Testing

Create a `.env.test` file:

```
DATABASE_URL=postgresql://user:password@localhost:5432/ticket_system_test
JWT_SECRET=test_secret_key_12345
NODE_ENV=test
PORT=3001
```

---

**Last Updated:** 2024-12-30
