# QIU Digital Communications — Job Request System
### Proof of Concept · Developer Handover Document

---

## Overview

This POC demonstrates the full workflow for the QIU Digital Communications Job Request system. It is built as a static HTML/CSS/JS prototype using `localStorage` to simulate a database. All logic, layout, and UX decisions are final — the development team's task is to rebuild this with a proper backend.

**Open `index.html` in any browser. No build tools, no installs required.**

---

## The Four Pages

| File | Role | Who sees it |
|------|------|------------|
| `index.html` | Submit a job request | All QIU staff |
| `my-requests.html` | Track your own requests | Staff (requestor) |
| `approval.html` | Endorse or reject requests | HOD / Dean |
| `dashboard.html` | Full work tracker & management | Digital Comms team |

---

## Workflow

```
Staff submits form (index.html)
        │
        ├─► Request immediately visible on dashboard.html [status: Awaiting Approval]
        │
        └─► HOD receives email notification → opens approval.html
                    │
              Approve / Reject
                    │
        ┌───────────┴────────────────┐
     Approved                    Rejected
        │                            │
        │                    Staff sees "Rejected" in my-requests.html
        │
  Digital Comms team sees status update on dashboard.html
        │
  Team assigns to a member → moves through stages:
  Approved → In Progress → On Hold (optional) → Completed
        │
  Staff tracks progress in real-time via my-requests.html
```

---

## Authentication — Google SSO

**This POC has no login.** All pages are open for demo purposes.

In production, implement Google SSO with the following role-based access:

| Role | Determined by | Pages accessible |
|------|--------------|-----------------|
| **Staff (Requestor)** | Any `@qiu.edu.my` Google account | `index.html`, `my-requests.html` |
| **HOD / Dean** | Google group membership (e.g. `hods@qiu.edu.my`) | All staff pages + `approval.html` |
| **Digital Comms Team** | Google group membership (e.g. `digitalcomms@qiu.edu.my`) | All pages + `dashboard.html` |

**Key SSO behaviours:**
- `my-requests.html` — filter requests by `email === currentUser.email`
- `approval.html` — filter requests where `hodEmail === currentUser.email`
- `dashboard.html` — show all requests; team member list in "Assign" dropdown should be populated from Google Workspace directory API
- HOD approval emails should contain a one-click approve/reject link (tokenised, no login required)

---

## Data Model

Each request object should map to a database record:

```js
{
  ref: "QIU-2025-0001",          // auto-generated, sequential per year
  requestedBy: "Ahmad Fauzi",    // from Google SSO display name
  email: "ahmad@qiu.edu.my",     // from Google SSO email
  department: "Marketing",
  hodEmail: "hod@qiu.edu.my",    // determines who sees approval.html
  requestedDate: "2025-01-08",
  dueDate: "2025-01-28",
  jobPurpose: "...",
  category: "digital",           // printed | digital | website | event | video | other
  subtypes: ["Social Media Promo", "Digital Ad Campaign"],

  // Printed media only
  size: "A1",
  colour: "Full Colour",
  bleed: "Required (3mm)",

  description: "...",
  references: "...",

  status: "in_progress",         // pending_approval | approved | rejected | in_progress | on_hold | completed
  assignedTo: "Amirah Zainudin", // Digital Comms team member
  internalNotes: "...",          // Only visible to Digital Comms team

  submittedAt: "2025-01-08T14:10:00Z",
  approvedAt: "2025-01-09T10:30:00Z",

  timeline: [                    // append-only event log
    { action: "Request submitted", by: "Ahmad Fauzi", date: "..." },
    { action: "Endorsed by HOD",   by: "HOD",         date: "..." },
    { action: "Assigned to Amirah Zainudin", by: "Team", date: "..." },
    { action: "Status changed to: In Progress", by: "Team", date: "..." }
  ]
}
```

---

## Email Architecture — Threaded Acknowledgement System

### Design principle
The JRF system has two jobs and two jobs only:

| System | Purpose |
|--------|---------|
| **JRF portal** | Submit requests · Track status |
| **Email thread** | All communication — clarifications, queries, updates |

There are no contact buttons in the portal. Requestors are directed to reply to their acknowledgement email for everything else. This eliminates duplicate channels and inbox clutter.

---

### How the thread works

**Step 1 — Submission triggers the acknowledgement email (automated)**

Sent immediately from `digitalcomms@qiu.edu.my` to the requestor. This email is the anchor of the entire thread.

```
To:      staff@qiu.edu.my
Subject: [QIU-2025-0001] Job Request — Poster · Faculty of Health Sciences

Hi [Name],

Thank you for your submission. Your reference number is QIU-2025-0001.

You can track your request status at: [link to my-requests.html]

IMPORTANT: This email is your communication channel for this request.
If you have any additional information, files, or queries — please reply
directly to this email. Do not submit a new request or send a separate email.

Our team will be in touch via this thread if we need clarification.
We will also update you here when your request is Approved, In Progress,
and Completed.

Digital Communications
Quest International University
```

**Step 2 — Status update emails (3 public stages, automated)**

The backend sends these as replies to the original thread using `In-Reply-To` and `References` headers. The requestor sees them appear inside the same Gmail conversation — no new thread starts.

| Status change | Email sent to requestor? | Message |
|---|---|---|
| Approved | ✅ Yes — reply to thread | "Your request has been endorsed by your HOD and is queued for our team." |
| In Progress | ✅ Yes — reply to thread | "Our team has started work on your request." |
| Completed | ✅ Yes — reply to thread | "Your project is ready. Please collect from Digital Comms." |
| Rejected | ❌ No | HOD handles communication directly with their staff |
| On Hold | ❌ No | Team member reaches out via the thread manually |
| Assigned / Reassigned | ❌ No | Internal only |

**Step 3 — Communication flows through the thread**

- **Requestor needs to add info or ask something** → they reply to the acknowledgement email
- **Digital Comms needs clarification** → team member replies to the same thread from the shared inbox
- **Everything stays in one place** — one thread per request, for both parties

---

### Critical implementation requirement — email threading headers

All system-generated follow-up emails (status updates) must include these headers to guarantee they appear in the same thread:

```
Message-ID:  <unique-id@digitalcomms.qiu.edu.my>   ← on the acknowledgement
References:  <ack-message-id@digitalcomms.qiu.edu.my>
In-Reply-To: <ack-message-id@digitalcomms.qiu.edu.my>
Subject:     [QIU-2025-0001] Job Request — Poster · Faculty of Health Sciences
```

**Store the `Message-ID` of the acknowledgement email in the database at send time.** All subsequent automated emails for that request reference it. Use SendGrid, Nodemailer, or Google Workspace SMTP — all support custom headers.

**The subject line must never be modified programmatically.** One character difference breaks threading.

---

### What this looks like in the requestor's inbox

```
📧 [QIU-2025-0001] Job Request — Poster · Faculty of Health Sciences   (4)
   ├── Digital Comms   "Thank you for your submission…"        Jan 8
   ├── Digital Comms   "Your request has been approved…"       Jan 9
   ├── Digital Comms   "We've started work on your request…"   Jan 13
   └── Digital Comms   "Your project is complete…"             Jan 22
```

If the requestor replied to clarify something, their reply and the team's response appear in the same thread — clean, contextual, no separate emails.

---

## Dashboard Features (dashboard.html)

### Work Tracker
- **List view** — sortable table with all requests, status, assignee, due date
- **Board view** — Kanban with columns: Awaiting Approval / Approved+Queue / In Progress / Completed
- Click any row/card → slide-out detail drawer

### Detail Drawer
- Full request details
- **Assign to team member** — dropdown of Digital Comms staff (production: Google Workspace API)
- **Reassign** — change assignment at any time
- **Stage buttons** — one-click status update
- **Internal notes** — free text, not visible to requestor
- **Activity timeline** — append-only log of all actions

### Filtering
- By status (tab buttons + sidebar links)
- Full-text search across ref, name, department, category, assignee

---

## Requestor Dashboard (my-requests.html)

### Stage Progress Tracker
5-step visual stepper shown on each request card:
```
Submitted → HOD Approval → In Progress → Under Review → Completed
```
States are colour-coded:
- ✓ Done (green dot)
- Active stage (red dot with glow)
- On Hold (amber dot with ⏸)
- Rejected (red dot with ✕, shown at HOD Approval step)

### Assigned Team Member (optional visibility)
When a request has been assigned, requestors can see who is handling it — first name + initials avatar. This gives confidence that someone owns their request.

---

## Tech Recommendations for Production

| Layer | Recommendation |
|-------|---------------|
| Auth | Google OAuth 2.0 / Firebase Auth |
| Backend | Node.js + Express or Firebase Functions |
| Database | Firestore or PostgreSQL |
| Email | SendGrid or Google Workspace SMTP |
| Frontend | Vue 3 or React (keep the same design system) |
| Hosting | Firebase Hosting or Vercel |

---

*Prepared for handover to QIU in-house development team.*
*Digital Communications, Quest International University (DU021A)*