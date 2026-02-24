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

## Email Notifications (to implement)

| Trigger | Recipient | Content |
|---------|-----------|---------|
| Request submitted | HOD (`hodEmail`) | Approval link + request summary |
| Request submitted | Digital Comms team | New request notification |
| HOD approves | Requestor | Confirmation + reference number |
| HOD rejects | Requestor | Rejection notice + reason |
| Status changes to In Progress | Requestor | "We've started on your request" |
| Status changes to Completed | Requestor | "Your project is ready" |

**Email subject format:** `[QIU-2025-0001] Job Request — {Category} · {Department}`

---

## Enquiry Email Button (my-requests.html)

Each request card has an **✉ Enquire** button. When clicked it opens the user's mail client pre-filled:

- **To:** `digitalcomms@qiu.edu.my`
- **Subject:** `[QIU-2025-0001] Enquiry — {Department}`
- **Body:** Pre-filled template with ref number and department

In production this is a `mailto:` link with `encodeURIComponent` on subject and body. No backend needed for this feature.

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
