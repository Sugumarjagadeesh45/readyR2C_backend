# Reals2Chat API Documentation

This document provides a comprehensive guide for frontend developers to integrate with the Reals2Chat backend API.

**Base URL:** The base URL for all API endpoints is your server's address. For local development, this is typically `http://localhost:5000`.

**Authentication:** Most endpoints require a JSON Web Token (JWT) for authentication. After a user logs in, the server provides a token. This token must be included in the `Authorization` header of subsequent requests as a Bearer token.

`Authorization: Bearer <your_jwt_token>`

---

## 1. Authentication (`/api/auth`)

### 1.1. User Registration

- **Endpoint:** `POST /api/auth/register`
- **Description:** Registers a new user.
- **Request Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "dateOfBirth": "1990-01-01",
    "gender": "male",
    "userId": "JOHNDOE90"
  }
  ```
- **Success Response (201):** Returns a JWT and user object.

### 1.2. User Login

- **Endpoint:** `POST /api/auth/login`
- **Description:** Logs in a user.
- **Request Body:**
  ```json
  {
    "email": "john.doe@example.com",
    "password": "password123"
  }
  ```
- **Success Response (200):** Returns a JWT and user object.

### 1.3. Google Sign-In

- **Endpoint:** `POST /api/auth/google-signin`
- **Description:** Authenticates a user with a Google ID token.
- **Request Body:**
  ```json
  {
    "idToken": "your_google_id_token"
  }
  ```
- **Success Response (200):** Returns a JWT and user object.

---

## 2. User Profile (`/api/user`)

### 2.1. Get User Profile

- **Endpoint:** `GET /api/user/profile`
- **Description:** Retrieves the profile of the authenticated user.
- **Authentication:** Required.
- **Success Response (200):** Returns the user and user data objects.

### 2.2. Update User Profile

- **Endpoint:** `PUT /api/user/profile`
- **Description:** Updates the profile of the authenticated user.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "name": "Johnathan Doe",
    "bio": "Software developer and coffee enthusiast."
  }
  ```
- **Success Response (200):** Returns the updated user and user data.

### 2.3. Upload Profile Picture

- **Endpoint:** `POST /api/user/profile-picture`
- **Description:** Uploads a base64-encoded profile picture.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "profilePicture": "data:image/jpeg;base64,..."
  }
  ```
- **Success Response (200):** Returns the updated user and user data.

### 2.4. Search for Users

- **Endpoint:** `GET /api/user/search`
- **Description:** Searches for users by name, email, or userId.
- **Authentication:** Required.
- **Query Parameters:**
  - `q`: The search query.
- **Success Response (200):** Returns an array of matching users.

### 2.5. Search for Nearby Users

- **Endpoint:** `GET /api/user/nearby`
- **Description:** Finds users within a specified distance.
- **Authentication:** Required.
- **Query Parameters:**
  - `longitude` (required): The user's current longitude.
  - `latitude` (required): The user's current latitude.
  - `maxDistance` (optional): The maximum search radius in meters (default: 10000).
- **Success Response (200):** Returns an array of nearby users.

---

## 3. Friends (`/api/friends`)

### 3.1. Get Friends List

- **Endpoint:** `GET /api/friends`
- **Description:** Retrieves the friends of the authenticated user.
- **Authentication:** Required.
- **Success Response (200):** Returns an array of friend objects.

### 3.2. Send Friend Request

- **Endpoint:** `POST /api/friends/send-request`
- **Description:** Sends a friend request to another user.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "recipientId": "USERID123" 
  }
  ```
  *You can also use `toUserId` with the internal ObjectId.*

### 3.3. Get Pending Friend Requests

- **Endpoint:** `GET /api/friends/requests/pending`
- **Description:** Retrieves pending friend requests for the authenticated user.
- **Authentication:** Required.
- **Success Response (200):** Returns an array of friend request objects.

### 3.4. Accept Friend Request

- **Endpoint:** `POST /api/friends/requests/:requestId/accept`
- **Description:** Accepts a friend request.
- **Authentication:** Required.
- **URL Parameters:**
  - `requestId`: The ID of the friend request to accept.

### 3.5. Reject Friend Request

- **Endpoint:** `POST /api/friends/requests/:requestId/reject`
- **Description:** Rejects a friend request.
- **Authentication:** Required.
- **URL Parameters:**
  - `requestId`: The ID of the friend request to reject.

---

## 4. Messaging (`/api`)

### 4.1. Send a Message

- **Endpoint:** `POST /api/messages/send`
- **Description:** Sends a message to another user.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "recipientId": "60d...d7",
    "text": "Hello there!"
  }
  ```

### 4.2. Send a Chat Message (Alias)

- **Endpoint:** `POST /api/chat/send`
- **Description:** An alias for sending a message.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "to": "USERID123",
    "message": "Hello there!"
  }
  ```

### 4.3. Get Message History

- **Endpoint:** `GET /api/messages/:otherUserId`
- **Description:** Retrieves the message history with another user.
- **Authentication:** Required.
- **URL Parameters:**
  - `otherUserId`: The ID of the other user.

---

## 5. Notifications

### 5.1. Register FCM Token

- **Endpoint:** `POST /api/notifications/register-token`
- **Description:** Registers or updates the FCM token for the authenticated user to enable push notifications.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "token": "your_fcm_device_token"
  }
  ```

### 5.2. Notification Payloads

When the backend sends a push notification, the client will receive a payload containing a `notification` object (for display) and a `data` object (for handling in-app). The `data.type` field indicates the type of notification.

- **New Message:**
  - `type`: `NEW_MESSAGE`
  - `senderId`: The ID of the user who sent the message.
- **Friend Request:**
  - `type`: `FRIEND_REQUEST`
  - `senderId`: The ID of the user who sent the request.
- **Friend Request Accepted:**
  - `type`: `FRIEND_REQUEST_ACCEPTED`
  - `acceptorId`: The ID of the user who accepted the request.
- **Admin Message:**
  - `type`: `ADMIN_MESSAGE` or `ADMIN_BROADCAST`

---

## 6. Admin (`/api/admin`)

These endpoints are for administrative use and require admin privileges.

### 6.1. Send Direct Notification

- **Endpoint:** `POST /api/admin/notify`
- **Description:** Sends a notification to a specific user.
- **Authentication:** Required (Admin).
- **Request Body:**
  ```json
  {
    "userId": "60d...d7",
    "title": "Admin Notification",
    "body": "This is a test message."
  }
  ```

### 6.2. Send Broadcast Notification

- **Endpoint:** `POST /api/admin/broadcast`
- **Description:** Sends a notification to all users.
- **Authentication:** Required (Admin).
- **Request Body:**
  ```json
  {
    "title": "Server Maintenance",
    "body": "The server will be down for maintenance at 2 AM."
  }
  ```
