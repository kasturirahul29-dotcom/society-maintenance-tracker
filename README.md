# Atrium — Society Maintenance Tracker



A full-stack society maintenance and complaint management portal built with Next.js, TypeScript, Prisma, PostgreSQL, and email notifications.



## Features



### Resident



- Register and log in

- Submit maintenance complaints

- Select complaint category and priority

- Upload complaint photos

- View own complaints

- Track complaint status and history

- Search and filter complaints

- Filter complaints by date

- View society notices

- Receive email notifications when complaints are updated



### Admin



- Admin dashboard

- View complaint statistics

- View complaints by status, priority, category, and SLA

- Search and filter complaints

- Filter complaints by date range

- Assign complaints to admin staff

- Update complaint status

- Add status/history notes

- Manage complaint categories

- Create, edit, pin, mark important, and delete notices

- Configure overdue/SLA threshold

- Email notifications to residents and admins



## Tech Stack



- Next.js

- React

- TypeScript

- Prisma ORM

- PostgreSQL

- Tailwind CSS

- Zod

- JWT authentication with jose

- bcryptjs

- Nodemailer

- Brevo SMTP



## Requirements



- Node.js 20+

- PostgreSQL database

- SMTP credentials for email notifications

- Docker (optional, for local PostgreSQL)



## Installation



Install dependencies:



```bash

npm install



## System Design



### Complaint History Model



Each complaint is stored as a main `Complaint` record containing its ticket number, category, description, priority, status, creator, optional assigned administrator, creation time, update time, and resolution time.



Every status change is stored separately in `ComplaintStatusHistory`. Each history record contains the complaint ID, previous status, new status, optional note, actor, and timestamp. This keeps the current complaint state separate from its audit trail and makes the complete lifecycle visible to residents and administrators.



### Overdue Detection



The application uses a configurable overdue threshold stored in the `AppSetting` table. The default threshold is 48 hours.



When complaints are displayed, the application compares the complaint creation time and current status against the configured threshold. An unresolved complaint that has exceeded the threshold is marked as overdue. Resolved complaints are not treated as overdue.



### Photo Handling



Residents can optionally attach a photo when creating a complaint. The complaint record stores the resulting photo path in `photoUrl`.



Uploaded files are stored under the application's public upload area and referenced from the complaint rather than storing image data directly inside PostgreSQL.



### Notification Flow



The application uses SMTP email integration through Nodemailer and Brevo.



When a complaint status is changed by an administrator, the application identifies the complaint owner and sends an email containing the ticket number, new status, administrator information, and optional status note.



Important society notices can also trigger resident notifications. SMTP credentials are stored in environment variables and are never committed to the repository.



### Authentication and Authorization



The application uses role-based authentication with `RESIDENT` and `ADMIN` roles. Residents can register themselves, while administrative accounts are provisioned separately.



Passwords are hashed using bcryptjs. Authentication uses JWT tokens stored in HTTP-only cookies. Server-side authorization checks ensure that residents can access only their own complaint data while administrators can manage complaints and administrative resources.



## Demo / Evaluation Flow

### Administrator
Email: `admin@atrium.local`
Password: `Admin@123`

### Resident
Email: `resident@atrium.local`
Password: `Resident@123`

### Resident Flow
1. Sign in as a resident.
2. Create a complaint with category, priority, description, and optional photo.
3. View the complaint and its status history.
4. When the admin changes the status, the resident receives an email.

### Administrator Flow
1. Sign in as administrator.
2. Open the Admin Dashboard.
3. View and filter complaints.
4. Assign complaints and change priority/status.
5. Add status/history notes.
6. Create and manage notices.
7. Mark a notice as Important to notify residents by email.

### Email Notifications
- New complaint → all administrators receive an email.
- Complaint status change → affected resident receives an email.
- Important notice → residents receive an email.

Administrator notification emails are sent to users whose role is `ADMIN`. To change the notification address, update the email address of the administrator user in the database.

### Live Application
https://society-maintenance-tracker-rho-seven.vercel.app

### GitHub Repository
https://github.com/kasturirahul29-dotcom/society-maintenance-tracker
