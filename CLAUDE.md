Build a minimal web-based Appeal Management System (MVP) for a Chartered Accountant (CA) firm.

#Project Overview — Appeal Management System (MVP)
1. Problem

A CA firm (MSSV & Co) is managing 1000+ income tax appeals using Excel.

This leads to:

No real-time updates
Data inconsistency
Poor visibility across team
Manual coordination chaos

Excel has become the bottleneck.

2. Solution

In the Phase 1 MVP, Build a web-based Appeal Management System that:

Centralizes all appeal data
Enables multi-user access
Tracks status and ownership
Allows basic document attachment (PDF)

Accessible via:

Browser (desktop + mobile responsive)
3. Scope (Phase 1 MVP)
Core Capabilities
Appeal database (Excel → system)
User system with basic RBAC
Create / edit / view appeals
Filter/search appeals
Upload one PDF per appeal (tax notice, etc.)


## Tech Stack

* Frontend: React / Next.js
* Backend: Supabase (Postgres + Auth + API)
* Hosting: Frontend on Vercel, backend on Supabase

## Core Requirement

Replace Excel-based tracking of 1000+ income tax appeals with a simple, usable system.

---

## System Constraints

* Single Service Provider (MSSV & Co)
* Multiple client organizations
* Preloaded data (no complex onboarding UI)
* Focus on speed and usability, not completeness

---

## Data Model

### organizations

* id (uuid, primary key)
* name (text)
* type (enum: "service_provider", "client")
* pan (text, optional)
* tan (text, optional)
* gst (text, optional)
* created_at (timestamp)

### users

* id (uuid, primary key)
* name (text)
* email (text, unique)
* role (enum: "admin", "staff", "client")
* designation (text, optional)
* org_id (foreign key → organizations.id)
* created_at (timestamp)

### appeals

* id (uuid, primary key)
* appeal_number (text)
* client_org_id (foreign key → organizations.id)
* assigned_to (foreign key → users.id)
* status (text)
* case_type (text)
* filing_date (date)
* next_hearing_date (date)
* notes (text)
* created_at (timestamp)
* updated_at (timestamp)
* file_url (text, optional)  // stores uploaded PDF link

---

## RBAC (Role-Based Access Control)

### admin (Service Provider Owner)

* Full access
* Manage user (create, edit, delete)
* Manage client (create, edit, delete)
* View and edit all appeals

### staff (CA employees/Service Provider)

* Create and edit appeals
* View assigned / all appeals

### client (customer users)

* View-only access
* Only for their organization’s appeals

---

## Features (STRICT MVP SCOPE)

### Authentication

* Email/password login using Supabase Auth

### Appeals Management

* List all appeals in table view
* Add new appeal
* Upload and attach one PDF file per appeal (stored in Supabase Storag)
* Edit existing appeal
* Filter by:

  * Client
  * Status
  * Assigned user

### Users

* Minimal user creation (simple form or preloaded)
* No complex onboarding

### Data Handling

* Preload:

  * Service Provider (MSSV & Co)
  * Employees
  * Clients
  * Client users
* Import initial data from Excel

---

## UI Requirements

* Clean, simple dashboard
* Table view for appeals
* Basic form for add/edit
* File upload field in Add/Edit Appeal form (PDF only)
* “View File” link/button in appeals table
* Mobile responsive (no native app)

---


## Goal

Deliver a working system a days that replaces Excel and is usable by a 7-member CA team managing 1000+ appeals.

Focus on:

* Simplicity
* Speed
* Usability
