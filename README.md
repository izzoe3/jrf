# QIU Digital Communications — Job Request System
### Proof of Concept · Handover Brief for Development Team

---

## What This Is

This is a proof of concept for the Digital Communications Job Request Form (JRF) at Quest International University. It replaces the current paper-based process where staff fill in a physical form to request design, media, video, or web work from the Digital Comms team.

The POC is built as static HTML/CSS/JS files with no backend. All data is simulated using the browser's `localStorage`. The purpose of this document is to describe what the system needs to do — the development team is best placed to advise on how to build it.

**To run the POC:** Open any of the four HTML files directly in a browser. No installs required.

---

## The Four Pages

| File | What it does | Who uses it |
|------|-------------|-------------|
| `index.html` | Staff submit a job request | All QIU staff |
| `my-requests.html` | Staff track their own requests | The person who submitted |
| `approval.html` | HOD reviews and endorses requests | Head of Department / Dean |
| `dashboard.html` | Team views all requests, assigns work, updates stages | Digital Comms team |

---

## How the Workflow Should Work

```
1. Staff submits a job request via index.html
        │
        ├──► Request is immediately visible on the team dashboard
        │    with status: Awaiting Approval
        │
        └──► HOD receives a notification to review and endorse the request
                    │
             HOD approves or rejects
                    │
        ┌───────────┴──────────────────┐
     Approved                       Rejected
        │                               │
        │                    Staff sees Rejected status
        │                    on my-requests.html.
        │                    No email notification sent —
        │                    HOD communicates directly with their staff.
        │
     Digital Comms team sees the updated status on dashboard.html
        │
     Team assigns the request to a team member
        │
     Team moves it through stages as work progresses:
     Approved → In Progress → On Hold (if needed) → Completed
        │
     Staff can see their current stage at any time on my-requests.html
```

---

## Authentication

This POC has no login — all pages are open for demo purposes.

In the live system, authentication should be handled via **Google SSO** since QIU runs on Google Workspace and all users have institutional Google accounts. We would like the dev team's input on the best approach, but our expectations are:

- Staff should only see their own requests on `my-requests.html`
- HODs should only see requests where they are listed as the endorsing HOD on `approval.html`
- The Digital Comms dashboard should be restricted to the Digital Comms team only
- The team member dropdown on the dashboard (for assigning requests) should pull from the Digital Comms team's Google Workspace accounts rather than a hardcoded list

**Useful starting point:**
- [Google Workspace — Sign In with Google](https://developers.google.com/identity/gsi/web/guides/overview)
- [Google Workspace Admin — Groups and access control](https://support.google.com/a/answer/9400082)

---

## Request Statuses

There are six statuses in the system. Three are visible to the requestor, three are internal only.

| Status | Visible to requestor? | Meaning |
|--------|----------------------|---------|
| Awaiting Approval | ✅ Yes | Submitted, waiting for HOD endorsement |
| Approved | ✅ Yes | HOD has endorsed, queued for the team |
| In Progress | ✅ Yes | Team is actively working on it |
| On Hold | ❌ Internal only | Team has paused work — team communicates via email thread |
| Rejected | ❌ Internal only | HOD did not endorse — HOD communicates with their staff directly |
| Completed | ✅ Yes | Work is done |

---

## Email — Threaded Acknowledgement System

### The principle

The JRF portal has two jobs only:

| | |
|--|--|
| **JRF portal** | Submit a request · Track its status |
| **Email thread** | All communication — additional info, clarifications, updates |

There are no contact or email buttons in the portal. All communication happens via a single email thread that is automatically created when a request is submitted.

### What we need the email thread to do

**On submission**, an acknowledgement email is sent automatically from `digitalcomms@qiu.edu.my` to the requestor. This email starts the thread and should include:

- Their reference number (e.g. `QIU-2025-0001`)
- A summary of what they submitted
- A link to `my-requests.html` to track their status
- A clear instruction that **this email thread is their communication channel** — if they need to add information or ask anything, they reply here

Example subject format: `[QIU-2025-0001] Job Request — Poster · Faculty of Health Sciences`

**When a request reaches one of the three public stages**, an automated reply is sent into the same thread:

| Stage | Message to requestor |
|-------|---------------------|
| Approved | Their request has been endorsed by their HOD and is queued for the team |
| In Progress | The team has started work |
| Completed | The project is done — collect from Digital Comms office |

**When the team needs clarification**, they reply to the thread from the shared `digitalcomms@qiu.edu.my` inbox. The requestor replies back in the same thread. Everything stays in one conversation.

### What this should look like in Gmail

```
📧 [QIU-2025-0001] Job Request — Poster · Faculty of Health Sciences  (5)
   │
   ├── Digital Comms   "Thank you for your submission…"          Mon 9:02am
   ├── Staff           "Just to add — the event is outdoor…"     Mon 11:30am
   ├── Digital Comms   "Noted, thank you for the update."        Mon 2:15pm
   ├── Digital Comms   "Your request has been approved…"         Tue 9:00am
   └── Digital Comms   "We have started work on your request…"   Thu 10:30am
```

### Question for the development team

Since QIU is entirely on Google Workspace, we understand that using the **Gmail API Thread ID** may be more reliable than relying on email headers (`In-Reply-To`, `References`) alone to maintain threading. We'd like the dev team's recommendation on the best approach for our setup.

**Useful references:**
- [Gmail API — Sending messages in a thread](https://developers.google.com/gmail/api/guides/sending#sending_a_reply)
- [Gmail API — Thread resource](https://developers.google.com/gmail/api/reference/rest/v1/users.threads)
- [Google Workspace — Gmail API overview](https://developers.google.com/gmail/api/guides)

---

## What the Requestor Sees (my-requests.html)

- A list of all their submitted requests
- For each request: reference number, category, due date, current status
- A 5-step progress tracker showing where their request is in the process
- A contextual message depending on their current stage (e.g. if on hold, they are told to check their email thread)
- They do **not** see who internally is handling their request
- They do **not** see On Hold or Rejected as labelled statuses — these are described in plain language in the status message

---

## What the Team Sees (dashboard.html)

- All submitted requests, visible immediately even before HOD approval
- List view and board (Kanban) view
- Filter by status, search by name, department, category, or assignee
- Click any request to open a detail panel showing:
  - Full request details
  - Assign or reassign to a team member
  - Update the stage with one click
  - Add internal notes (not visible to the requestor)
  - A chronological activity timeline of all actions taken

---

## Data Captured per Request

For reference, here is everything the form currently captures:

**Requestor details**
- Full name, email, department, HOD email

**Request details**
- Requested date, due date, job purpose
- Category: Printed Media / Digital Media / Website / Event Coverage / Video Production / Other
- Sub-type (e.g. Poster, Social Media Promo, Website Update)
- For print requests: size, colour, printing bleed
- Detailed description, reference links

**System fields**
- Auto-generated reference number (format: `QIU-YYYY-NNNN`)
- Status, assigned team member, internal notes
- Activity timeline (append-only log of every action)

---

## Open Questions for the Development Team

We would appreciate the team's input on the following before build begins:

1. **Authentication** — What is the recommended approach for Google SSO role separation (staff vs HOD vs Digital Comms team) given our Google Workspace setup?

2. **HOD approval flow** — In the POC, the HOD logs into the approval page. Should this instead be a tokenised one-click link in their notification email so they can approve without logging into a separate system?

3. **Email threading** — Given that we are fully on Google Workspace and Gmail, is Gmail API Thread ID the right approach? Are there any limitations we should be aware of?

4. **Reference number generation** — The POC uses a sequential `QIU-YYYY-NNNN` format. Is this straightforward to implement safely (without duplicates) in a concurrent system?

5. **Team member list** — In the POC this is hardcoded. Can this be pulled live from Google Workspace Directory so it stays up to date automatically?

---

*Prepared by Digital Communications, Quest International University (DU021A)*
*This document describes intended system behaviour. Implementation decisions are deferred to the development team.*