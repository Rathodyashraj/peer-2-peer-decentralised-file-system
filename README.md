# PeerShare

PeerShare is a **secure peer-to-peer (P2P) file-sharing web application** that enables users to establish direct browser-to-browser connections and transfer files without routing the actual file data through the backend server.

The application combines real-time communication, WebRTC, and browser-based cryptography to provide authenticated peer connections and end-to-end encrypted file transfers. The backend is responsible for authentication, peer discovery, connection coordination, and WebRTC signaling, while file data is transferred directly between peers.

---

## Features

- **Peer-to-Peer File Sharing**  
  Direct browser-to-browser file transfer using WebRTC DataChannels.

- **Secure User Authentication**  
  JWT-based authentication with access and refresh tokens.

- **Multi-Device Support**  
  Users can be logged in from multiple browsers or devices.

- **Device Identity**  
  Each browser/device generates a unique device ID and ECDSA P-256 key pair.

- **Secure Private Key Storage**  
  Device private keys are stored locally in browser IndexedDB and are never sent to the backend.

- **Public Key Registration**  
  Device public keys are stored in MongoDB for peer authentication.

- **Connection Requests**  
  Users can discover online peers and send connection requests in real time.

- **Mutual Challenge-Response Authentication**  
  Both participating devices prove ownership of their private identity keys before establishing the P2P session.

- **WebRTC Communication**  
  SDP offers, answers, and ICE candidates are exchanged through Socket.IO to establish a direct WebRTC connection.

- **Ephemeral ECDH Key Exchange**  
  A fresh ECDH key pair is generated for every P2P session.

- **Secure Session Key Derivation**  
  HKDF derives a session root key from the ECDH shared secret.

- **AES-256-GCM File Encryption**  
  Files are encrypted before transmission using authenticated encryption.

- **Per-File Encryption Keys**  
  Unique AES encryption keys are derived for individual files using HKDF.

- **Chunked File Transfer**  
  Encrypted files are divided into chunks and transmitted through the WebRTC DataChannel.

- **Real-Time Connection Management**  
  Handles online presence, connection requests, authentication, connection establishment, and disconnection.

---

## Table of Contents

1. [Technologies Used](#technologies-used)
2. [Workflow](#workflow)
3. [Installation](#installation)
4. [Running the Project](#running-the-project)
5. [Project Structure](#project-structure)

---

## Technologies Used

### Frontend

- React
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- WebRTC
- Web Crypto API
- IndexedDB

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Socket.IO
- JWT
- bcrypt

### Cryptography

- ECDSA P-256
- ECDH P-256
- HKDF
- SHA-256
- AES-256-GCM

---

## Workflow

The overall PeerShare workflow is:

```text
User Signup / Login
        |
        v
JWT Authentication
        |
        v
Device Identity
        |
        +---- ECDSA Private Key -> IndexedDB
        |
        +---- ECDSA Public Key  -> MongoDB
        |
        v
Online Peer Discovery
        |
        v
Connection Request
        |
        v
Target Device Accepts
        |
        v
Mutual Challenge-Response
        |
        v
WebRTC Signaling
        |
        +---- SDP Offer
        +---- SDP Answer
        +---- ICE Candidates
        |
        v
RTCDataChannel Established
        |
        v
Ephemeral ECDH Key Exchange
        |
        v
HKDF -> Session Root Key
        |
        v
File Selected
        |
        v
HKDF -> File Encryption Key
        |
        v
AES-256-GCM Encryption
        |
        v
Encrypted File Chunks
        |
        v
WebRTC DataChannel
        |
        v
Receiver Reassembles & Decrypts
        |
        v
Original File
```

The backend acts as the **authentication, coordination, and signaling layer**. Once the WebRTC connection is established, the actual file data is transferred directly between the peers.

---

## Installation

### Prerequisites

Make sure the following are installed:

- Node.js
- npm
- MongoDB
- A modern browser with WebRTC and Web Crypto API support

### 1. Clone the Repository

```bash
git clone <repository-url>
cd PeerShare
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

Start the backend:

```bash
npm run dev
```

### 3. Install Frontend Dependencies

Open another terminal:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
npm run dev
```

Open the URL displayed by Vite, usually:

```text
http://localhost:5173
```

---

## Running the Project

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend in another terminal:

```bash
cd frontend
npm run dev
```

Then:

1. Create accounts for two users.
2. Log in from two browser sessions.
3. Make sure both users are online.
4. Send a connection request.
5. Accept the request from the other user.
6. Complete the automatic authentication and WebRTC connection.
7. Select files from the workspace.
8. Files are encrypted and transferred directly between the peers.

---

## Project Structure

```text
PeerShare/
│
├── frontend/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       ├── crypto/
│       ├── webRTC/
│       ├── transfer/
│       └── utils/
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middlewares/
│   └── socket/
│
└── README.md
```

---

## Security Architecture

PeerShare uses different cryptographic mechanisms for different purposes:

```text
ECDSA
  |
  +-- Device Identity
  +-- Challenge-Response Authentication

ECDH
  |
  +-- Ephemeral Session Key Exchange

HKDF
  |
  +-- Session Root Key
  +-- Per-File Encryption Keys

AES-256-GCM
  |
  +-- File Encryption
  +-- File Integrity
```

The design keeps long-term identity keys separate from short-lived session keys and file encryption keys.

The backend stores device public keys but does not receive or store device private keys.

