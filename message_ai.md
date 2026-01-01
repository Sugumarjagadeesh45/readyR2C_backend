# Backend Documentation for Professional Chat - Messaging Notes

This document provides focused notes on the backend API endpoints and data structures relevant to the professional chat feature in the Reals2Chat application, designed for easy integration by frontend AI.

---

## 1. Authentication

All endpoints listed below require a valid JSON Web Token (JWT) to be included in the `Authorization` header of the request.

`Authorization: Bearer <your_jwt_token>`

---

## 2. Data Schemas

### 2.1. Message Schema

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the message. |
| `conversationId` | ObjectId | The ID of the conversation this message belongs to. |
| `sender` | ObjectId | The ID of the user who sent the message. |
| `recipient` | ObjectId | The ID of the user who received the message. |
| `text` | String | The content of the message. Can be empty if there is an attachment. |
| `attachment` | Object | Optional attachment data. |
| `attachment.type` | String | Type of attachment (`'image'`, `'video'`, `'file'`). |
| `attachment.url` | String | URL of the uploaded attachment. |
| `createdAt` | Date | The timestamp when the message was created. |
| `status` | String | The status of the message (`'sent'`, `'delivered'`, `'read'`). |

### 2.2. Conversation Metadata Schema

This schema is used for storing per-user conversation settings like pinning, blocking, etc.

| Field | Type | Description |
| :--- | :--- | :--- |
| `_id` | ObjectId | Unique identifier for the metadata entry. |
| `userId` | ObjectId | The ID of the user who owns this metadata. |
| `otherUserId` | ObjectId | The ID of the other user in the conversation. |
| `isPinned` | Boolean | `true` if the user has pinned this conversation. |
| `isBlocked` | Boolean | `true` if the user has blocked the other user. |
| `customRingtone` | String | URL or identifier for a custom ringtone. |
| `isFavorite` | Boolean | `true` if the user has marked the other user as a favorite. |

---

## 3. API Endpoints for Messaging

### 3.1. Get Message History

- **Endpoint:** `GET /api/messages/:otherUserId`
- **Description:** Retrieves the message history with another user.
- **Authentication:** Required.
- **URL Parameters:**
  - `otherUserId`: The `_id` (ObjectId) of the other user. **(Important: This must be the actual ObjectId, not the literal string ':otherUserId')**
- **Success Response (200):**
  ```json
  {
    "success": true,
    "data": [
      {
        "_id": "60d...d1",
        "conversationId": "60d...d2",
        "sender": { "_id": "60d...d3", "name": "CurrentUser" },
        "recipient": { "_id": "60d...d4", "name": "OtherUser" },
        "text": "Hey, how are you?",
        "attachment": null,
        "status": "read",
        "createdAt": "2023-01-01T12:00:00.000Z",
        "updatedAt": "2023-01-01T12:05:00.000Z"
      }
    ]
  }
  ```

### 3.2. Send a Message (via `/api/messages`)

- **Endpoint:** `POST /api/messages/send`
- **Description:** Sends a new message to another user.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "recipientId": "60d...d7",  // ObjectId of the recipient
    "text": "Hello there!",
    "attachment": {             // Optional
        "type": "image",        // 'image', 'video', 'file'
        "url": "https://example.com/image.jpg"
    }
  }
  ```
- **Success Response (201):** Returns the newly created message object.

### 3.3. Send a Chat Message (Alias via `/api/chat`)

- **Endpoint:** `POST /api/chat/send`
- **Description:** An alias for sending a message, providing a more "chat-like" interface using public `userId` strings.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "to": "USERID123",        // Public userId string (e.g., "R2C20251109001")
    "message": "Hello there!" // Message text
  }
  ```
- **Success Response (201):** Returns the newly created message object.

### 3.4. Update Conversation Metadata

- **Endpoint:** `PUT /api/conversations/:otherUserId/metadata`
- **Description:** Updates metadata for a specific conversation with another user (e.g., pinning, blocking, custom ringtones).
- **Authentication:** Required.
- **URL Parameters:**
  - `otherUserId`: The `_id` (ObjectId) of the other user in the conversation.
- **Request Body:**
  ```json
  {
    "isPinned": true,
    "isBlocked": false,
    "customRingtone": "ringtone_url", // Optional
    "isFavorite": true
  }
  ```
- **Success Response (200):** Returns the updated metadata object.

---

## 4. Real-time Communication (WebSockets) for Chat

A WebSocket connection is crucial for real-time messaging features. Connect to the root of the API (`API_URL`) with your JWT.

### 4.1. Connection

- **Method:** Connect using `socket.io-client`
- **URL:** `ws://your_backend_address` (e.g., `ws://localhost:5000`)
- **Authentication:** Pass JWT in the query parameter during connection:
  `io(API_URL, { query: { token: 'YOUR_JWT_TOKEN' } })`

### 4.2. Events

| Event Name | Direction | Description | Payload |
| :--- | :--- | :--- | :--- |
| `sendMessage` | Client -> Server | User sends a new message. | `{ "recipientId": "...", "text": "...", "attachment": { ... } }` |
| `receiveMessage` | Server -> Client | Server delivers a new message to the recipient (and sender for confirmation). | Full message object (see Message Schema). |
| `userStatus` | Server -> Client | Broadcasts a user's online/offline status to their friends. | `{ "userId": "...", "isOnline": true/false, "lastSeen": "..." }` |
| `typing` | Client -> Server | User is typing a message. | `{ "recipientId": "..." }` |
| `stopTyping` | Client -> Server | User has stopped typing. | `{ "recipientId": "..." }` |
| `typingStatus` | Server -> Client | Informs a user that the other user is typing. | `{ "senderId": "...", "isTyping": true/false }` |

---

## 5. Error Handling

API responses for HTTP requests should use standard HTTP status codes. A generic error response body should be:
```json
{
  "success": false,
  "message": "A description of the error."
}
```
- `400 Bad Request`: Invalid request body or parameters.
- `401 Unauthorized`: Invalid or missing JWT.
- `404 Not Found`: Resource not found.
- `500 Internal Server Error`: Server-side error.
