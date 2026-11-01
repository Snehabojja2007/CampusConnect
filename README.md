# CampusConnect

A Campus Lost & Found Management System built using Java and Spring Boot.

## Overview

CampusConnect is a backend application designed to simplify the process of reporting and recovering lost belongings within a college campus.

It provides REST APIs through which students can report lost items, submit found-item reports, and claim their belongings. The system also includes role-based access control, item moderation, claim management, notifications, and potential lost-and-found item matching.

## Project Status

- Backend: Core functionality implemented.
- Frontend: Planned (React.js).
- Database: MySQL.

## Technology Stack

- **Language:** Java 21
- **Backend Framework:** Spring Boot
- **Security:** Spring Security, JWT
- **Database:** MySQL
- **ORM:** Spring Data JPA / Hibernate
- **Build Tool:** Maven
- **Testing:** JUnit and Mockito


## Backend Architecture

CampusConnect follows a layered architecture to keep the application modular and maintainable.

| Layer | Responsibility |
|---|---|
| Controller | Handles incoming REST API requests |
| Service | Contains business logic and validations |
| Repository | Handles database operations using Spring Data JPA |
| Entity | Represents database entities |
| DTO | Transfers request and response data |
| Security | Handles JWT authentication and role-based authorization |

### Main Modules

- Authentication and User Management
- Lost Item Management
- Found Item Management
- Item Moderation
- Claim Management
- Notifications
- Lost and Found Item Matching

## Key Features

### 1. Authentication and Authorization
- User registration and login.
- JWT-based authentication.
- Role-based access for STUDENT, SECURITY, and ADMIN.

### 2. Lost Item Management
- Students can report lost items.
- Update and delete their own reports.
- Search and retrieve lost-item reports.

### 3. Found Item Management
- Users can submit found-item reports.
- Update and delete their own reports.
- Public listings display approved found items.

### 4. Item Moderation
- Admins can review submitted found items.
- Approve or reject found-item reports.
- Edited found items return to pending moderation.

### 5. Claim Management
- Students can submit claims for approved found items.
- View their own claims.
- Security/Admin users can approve or reject pending claims.
- Prevent multiple successful claims for the same item.

### 6. Notifications
- Generate notifications for relevant claim-related activities.

### 7. Lost and Found Item Matching
- Identify potential matches using item-title and location similarity.


## REST API Endpoints

Base URL: `http://localhost:8081`

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Authenticate and receive a JWT |

### Lost Items

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/lost-items` | Report a lost item |
| GET | `/api/lost-items` | Retrieve and search lost items |
| PUT | `/api/lost-items/{id}` | Update a lost-item report |
| DELETE | `/api/lost-items/{id}` | Delete a lost-item report |

### Found Items

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/found-items` | Submit a found-item report |
| GET | `/api/found-items` | Retrieve and search found items |
| PUT | `/api/found-items/{id}` | Update a found-item report |
| DELETE | `/api/found-items/{id}` | Delete a found-item report |

### Claims

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/claims` | Submit a claim |
| GET | `/api/claims/my` | Retrieve the authenticated user's claims |
| PUT | `/api/claims/{claimId}/status` | Update a claim's status |

The claim status endpoint accepts a `status` request parameter.

### Admin

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/users` | Retrieve all users |
| PUT | `/api/admin/users/{userId}/status` | Update a user's status |
| GET | `/api/admin/claims` | Retrieve all claims |
| GET | `/api/admin/handovers` | Retrieve all handovers |
| GET | `/api/admin/lost-items` | Retrieve all lost items |
| GET | `/api/admin/found-items` | Retrieve all found items |
| GET | `/api/admin/lost-items/pending` | Retrieve pending lost items |
| GET | `/api/admin/found-items/pending` | Retrieve pending found items |
| PUT | `/api/admin/lost-items/{itemId}/moderation` | Moderate a lost-item report |
| PUT | `/api/admin/found-items/{itemId}/moderation` | Moderate a found-item report |

### Authentication Header

Protected endpoints require a JWT access token:

`Authorization: Bearer <your-jwt-token>`

### Search and Pagination

Lost-item and found-item listing endpoints support optional `title` and `location` query parameters, along with Spring Data pagination parameters.

Example:

`GET /api/found-items?location=CSE%20Block&title=Wallet&page=0&size=10`

### Item Matching

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/matches/lost/{lostItemId}` | Find potential matches for a lost item |

## Security and Data Integrity

- JWT-based authentication for protected APIs.
- Role-based authorization for Student, Security, and Admin users.
- Users can update or delete only their own lost and found item reports.
- Found items require moderation before they can be claimed.
- Editing a found-item report sends it back for moderation.
- Claimed found items cannot be modified or deleted.
- Claim approval uses transactional processing and database locking to prevent conflicting approvals.


## Getting Started

### Prerequisites

Make sure you have the following installed:

- Java 21
- MySQL Server
- Git

### 1. Clone the repository

```bash
git clone https://github.com/Snehabojja2007/CampusConnect.git
cd CampusConnect
```

### 2. Create the MySQL database

Open MySQL Workbench and execute:

```sql
CREATE DATABASE campusconnect;
```

### 3. Configure environment variables

Set the following environment variables:

| Variable | Description |
|---|---|
| `DB_USERNAME` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `JWT_SECRET` | Base64-encoded JWT signing secret |

Do not commit passwords or secret keys to GitHub.

### 4. Configure application properties

Copy `application.example.properties` to `application.properties` inside:

`src/main/resources/`

Update the values if your local MySQL configuration differs.

### 5. Run the application

**Windows (PowerShell):**

```powershell
.\mvnw.cmd spring-boot:run
```

**Linux/macOS:**

```bash
./mvnw spring-boot:run
```

The backend server runs at:

`http://localhost:8081`

### 6. Run tests

**Windows:**

```powershell
.\mvnw.cmd clean test
```

**Linux/macOS:**

```bash
./mvnw clean test
```

## Project Status

- Backend: Core functionality implemented.
- Frontend: Not started yet.
- Database: MySQL.

## Future Improvements

- Develop a responsive frontend using React.js.
- Integrate the frontend with the Spring Boot REST APIs.
- Build role-specific dashboards for Students, Security, and Admin.
- Add automated integration testing.
- Deploy the complete application.

## Author

**Sneha Bojja**

B.Tech – Computer Science and Engineering

GitHub: [Snehabojja2007](https://github.com/Snehabojja2007)