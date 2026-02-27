/* ============================================================
   dashboard.js — Team Dashboard (dashboard.html)
   Depends on: shared.js
   ============================================================ */

'use strict';

/* ── CONSTANTS ── */

/* In production: fetched from Google Workspace Directory API */
var TEAM = [
  'Amirah Zainudin',
  'Hafiz Nordin',
  'Syazwan Kamarudin',
  'Nurul Ain',
  'Fadzrin Mahmud'
];

var KANBAN_COLS = [
  { key: 'pending_approval', label: 'Awaiting Approval', color: '#b45309' },
  { key: 'approved',         label: 'Approved / Queue',  color: '#1a6b45' },
  { key: 'in_progress',      label: 'In Progress',       color: '#3730a3' },
  { key: 'completed',        label: 'Completed',         color: '#166534' }
];

/* ── STATE ── */
var curFilter     = 'all';
var curSearch     = '';
var curView       = 'table';
var curDrawerIdx  = null;
var showAssignSel = false;

/* ── FILTERED DATA ── */

/**
 * Returns requests filtered by current status filter and search query.
 * Each result has an _i property set to its original array index.
 * @returns {Array}
 */
function filtered() {
  return getRequests().map(function (r, i) {
    r._i = i;
    return r;
  }).filter(function (r) {
    if (curFilter !== 'all' && r.status !== curFilter) return false;
    if (curSearch) {
      var q = curSearch.toLowerCase();
      var haystack = [r.ref, r.requestedBy, r.department, r.category,
                      r.assignedTo || '', r.descriptionPlain || ''].join(' ').toLowerCase();
      return haystack.indexOf(q) !== -1;
    }
    return true;
  });
}

/* ── STATS ── */

/**
 * Update stat card numbers and sidebar badge.
 */
function updateStats() {
  var all = getRequests();
  document.getElementById('sn-total').textContent   = all.length;
  document.getElementById('sn-pending').textContent = all.filter(function (r) { return r.status === 'pending_approval'; }).length;
  document.getElementById('sn-approved').textContent= all.filter(function (r) { return r.status === 'approved'; }).length;
  document.getElementById('sn-inprog').textContent  = all.filter(function (r) { return r.status === 'in_progress'; }).length;
  document.getElementById('sn-done').textContent    = all.filter(function (r) { return r.status === 'completed'; }).length;

  var pCount = all.filter(function (r) { return r.status === 'pending_approval'; }).length;
  var sbBadge = document.getElementById('sb-pending');
  sbBadge.textContent    = pCount;
  sbBadge.style.display  = pCount ? 'inline' : 'none';
}

/* ── TABLE VIEW ── */

/**
 * Render the list/table view.
 */
function renderTable() {
  var rows  = filtered();
  var tbody = document.getElementById('tBody');

  if (!rows.length) {
    tbody.innerHTML =
      '<tr><td colspan="6"><div class="empty-row">' +
        '<div class="icon">🔍</div>' +
        '<h3>No requests found</h3>' +
        '<p>Try changing your filters or search term.</p>' +
      '</div></td></tr>';
    return;
  }

  tbody.innerHTML = rows.map(function (r) {
    var assignedHtml = r.assignedTo
      ? '<span class="assigned-chip"><div class="av">' + initials(r.assignedTo) + '</div>' + r.assignedTo + '</span>'
      : '<span class="unassigned">Unassigned</span>';

    return '<tr onclick="openDrawer(' + r._i + ')">' +
      '<td class="td-ref">'  + r.ref + '</td>' +
      '<td class="td-name"><div class="name">' + r.requestedBy + '</div><div class="dept">' + r.department + '</div></td>' +
      '<td><span class="cat-pill">' + (CAT_LABELS_ICON[r.category] || r.category) + '</span></td>' +
      '<td>' + assignedHtml + '</td>' +
      '<td class="td-due ' + (isOverdue(r.dueDate) ? 'overdue' : '') + '">' + fmtDate(r.dueDate) + '</td>' +
      '<td><span class="status-badge s-' + r.status + '">' + (STAGE_LABELS[r.status] || r.status) + '</span></td>' +
    '</tr>';
  }).join('');
}

/* ── KANBAN VIEW ── */

/**
 * Render the kanban board view.
 */
function renderKanban() {
  var all   = getRequests().map(function (r, i) { r._i = i; return r; });
  var board = document.getElementById('kanbanBoard');

  board.innerHTML = KANBAN_COLS.map(function (col) {
    var cards = all.filter(function (r) {
      if (r.status !== col.key) return false;
      if (curSearch) {
        var q = curSearch.toLowerCase();
        return (r.ref + r.requestedBy + r.category).toLowerCase().indexOf(q) !== -1;
      }
      return true;
    });

    var cardHtml = cards.length
      ? cards.map(function (r) {
          var purposeShort = r.jobPurpose
            ? (r.jobPurpose.length > 55 ? r.jobPurpose.substring(0, 55) + '…' : r.jobPurpose)
            : '—';
          var assignedHtml = r.assignedTo
            ? '<div style="margin-top:6px"><span class="assigned-chip" style="font-size:10px"><div class="av">' + initials(r.assignedTo) + '</div>' + r.assignedTo + '</span></div>'
            : '';
          return '<div class="k-card" onclick="openDrawer(' + r._i + ')">' +
            '<div class="k-ref">' + r.ref + '</div>' +
            '<div class="k-title">' + purposeShort + '</div>' +
            '<div class="k-meta">' +
              '<span>' + (CAT_LABELS_ICON[r.category] || r.category) + '</span>' +
              '<span class="k-due ' + (isOverdue(r.dueDate) ? 'overdue' : '') + '">Due ' + fmtDate(r.dueDate) + '</span>' +
            '</div>' +
            assignedHtml +
          '</div>';
        }).join('')
      : '<div style="font-size:12px;color:var(--muted);padding:8px;text-align:center;font-style:italic">No requests</div>';

    return '<div class="kanban-col">' +
      '<div class="kanban-col-header">' +
        '<span class="kanban-col-title" style="color:' + col.color + '">' + col.label + '</span>' +
        '<span class="kanban-count">' + cards.length + '</span>' +
      '</div>' +
      '<div class="kanban-cards">' + cardHtml + '</div>' +
    '</div>';
  }).join('');
}

/* ── MASTER RENDER ── */

/**
 * Update stats and render whichever view is active.
 */
function render() {
  updateStats();
  if (curView === 'table') renderTable();
  else renderKanban();
}

/* ── FILTER & SEARCH ── */

/**
 * Set the active status filter and re-render.
 * @param {string} f    - Status key or 'all'.
 * @param {Element} [btn] - The clicked pill button to mark active.
 */
function setFilter(f, btn) {
  curFilter = f;
  document.querySelectorAll('.filter-pill').forEach(function (b) { b.classList.remove('on'); });
  if (btn) btn.classList.add('on');
  render();
}

/**
 * Update search query and re-render.
 * @param {string} q
 */
function doSearch(q) {
  curSearch = q;
  render();
}

/**
 * Switch between 'table' and 'kanban' views.
 * @param {string} v
 */
function setView(v) {
  curView = v;
  document.getElementById('view-table').style.display  = v === 'table'  ? '' : 'none';
  document.getElementById('view-kanban').style.display = v === 'kanban' ? '' : 'none';
  document.getElementById('vt-table').classList.toggle('on',  v === 'table');
  document.getElementById('vt-kanban').classList.toggle('on', v === 'kanban');
  render();
}

/* ── DRAWER ── */

/**
 * Open the detail drawer for a given request index.
 * @param {number} idx
 */
function openDrawer(idx) {
  curDrawerIdx  = idx;
  showAssignSel = false;
  buildDrawer(idx);
  document.getElementById('overlay').classList.add('open');
  document.getElementById('drawer').classList.add('open');
}

/**
 * Close the detail drawer.
 */
function closeDrawer() {
  document.getElementById('overlay').classList.remove('open');
  document.getElementById('drawer').classList.remove('open');
  curDrawerIdx = null;
}

/**
 * Build and inject all drawer content for the given request.
 * @param {number} idx
 */
function buildDrawer(idx) {
  var r = getRequests()[idx];
  if (!r) return;

  document.getElementById('d-ref').textContent = r.ref;
  document.getElementById('d-sub').textContent = r.requestedBy + ' · ' + r.department + ' · Due ' + fmtDate(r.dueDate);

  var tl = r.timeline && r.timeline.length
    ? r.timeline
    : [{ action: 'Request submitted', by: r.requestedBy, date: r.submittedAt }];

  /* Assign section HTML */
  var assignHtml = (r.assignedTo && !showAssignSel)
    ? '<div class="assigned-display">' +
        '<span class="assigned-chip" style="font-size:13px">' +
          '<div class="av" style="width:28px;height:28px;font-size:11px">' + initials(r.assignedTo) + '</div>' +
          r.assignedTo +
        '</span>' +
        '<span class="reassign-link" onclick="showAssign()">Reassign</span>' +
      '</div>'
    : '<div class="assign-row">' +
        '<select class="assign-select" id="assignSelect">' +
          '<option value="">— Select team member —</option>' +
          TEAM.map(function (m) {
            return '<option value="' + m + '"' + (r.assignedTo === m ? ' selected' : '') + '>' + m + '</option>';
          }).join('') +
        '</select>' +
        '<button class="assign-btn" onclick="saveAssign(' + idx + ')">Assign</button>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--muted)">In production: populated from Google Workspace directory.</div>';

  /* Stage buttons */
  var stageHtml = Object.entries(STAGE_LABELS).map(function (entry) {
    var k = entry[0], v = entry[1];
    return '<button class="stage-btn' + (r.status === k ? ' cur' : '') +
      '" data-s="' + k + '" onclick="changeStatus(' + idx + ',\'' + k + '\')">' + v + '</button>';
  }).join('');

  /* Timeline */
  var tlHtml = tl.slice().reverse().map(function (t, i) {
    return '<li class="' + (i === 0 ? 'latest' : '') + '">' +
      '<div class="tl-action">' + t.action + '</div>' +
      '<div class="tl-by">' + (t.by ? 'by ' + t.by + ' · ' : '') + fmtDate(t.date) + '</div>' +
    '</li>';
  }).join('');

  document.getElementById('drawerBody').innerHTML =
    /* Requestor */
    '<div class="d-section">' +
      '<div class="d-section-title">Requestor</div>' +
      '<div class="info-grid">' +
        '<div class="info-item"><dt>Name</dt><dd>' + r.requestedBy + '</dd></div>' +
        '<div class="info-item"><dt>Department</dt><dd>' + r.department + '</dd></div>' +
        '<div class="info-item"><dt>Email</dt><dd>' + r.email + '</dd></div>' +
        '<div class="info-item"><dt>HOD Email</dt><dd>' + r.hodEmail + '</dd></div>' +
        '<div class="info-item"><dt>Submitted</dt><dd>' + fmtDate(r.submittedAt) + '</dd></div>' +
        '<div class="info-item"><dt>Due Date</dt><dd class="' + (isOverdue(r.dueDate) ? 'overdue' : '') + '">' + fmtDate(r.dueDate) + '</dd></div>' +
        '<div class="info-item"><dt>Category</dt><dd>' + (CAT_LABELS_ICON[r.category] || r.category) + (r.subtypes && r.subtypes.length ? ' — ' + r.subtypes.join(', ') : '') + '</dd></div>' +
      '</div>' +
    '</div>' +
    /* Project details */
    '<div class="d-section">' +
      '<div class="d-section-title">Project Details</div>' +
      '<div class="field-mini-label">Job Purpose</div>' +
      '<div class="desc-box">' + (r.jobPurpose || '—') + '</div>' +
      '<div class="field-mini-label">Description</div>' +
      '<div class="desc-box">' + (r.description || r.descriptionPlain || '—') + '</div>' +
      (r.references ? '<div class="field-mini-label">Supporting Materials</div><div class="desc-box">' + r.references + '</div>' : '') +
    '</div>' +
    /* Assign */
    '<div class="d-section">' +
      '<div class="d-section-title">Assigned To</div>' +
      '<div id="assignSection">' + assignHtml + '</div>' +
    '</div>' +
    /* Stage */
    '<div class="d-section">' +
      '<div class="d-section-title">Update Stage</div>' +
      '<div class="stage-grid">' + stageHtml + '</div>' +
    '</div>' +
    /* Notes */
    '<div class="d-section">' +
      '<div class="d-section-title">Internal Notes</div>' +
      '<textarea class="notes-input" id="notesInput" placeholder="Add internal notes, updates, file links…">' + (r.internalNotes || '') + '</textarea>' +
      '<button class="save-btn" onclick="saveNotes(' + idx + ')">Save Notes</button>' +
    '</div>' +
    /* Timeline */
    '<div class="d-section">' +
      '<div class="d-section-title">Activity Timeline</div>' +
      '<ul class="tl">' + tlHtml + '</ul>' +
    '</div>';
}

/**
 * Show the reassign select dropdown in the drawer.
 */
function showAssign() {
  showAssignSel = true;
  buildDrawer(curDrawerIdx);
}

/**
 * Save a team member assignment for the current drawer request.
 * @param {number} idx
 */
function saveAssign(idx) {
  var sel = document.getElementById('assignSelect').value;
  if (!sel) { alert('Please select a team member.'); return; }
  var all = getRequests();
  all[idx].assignedTo  = sel;
  all[idx].timeline    = all[idx].timeline || [];
  all[idx].timeline.push({ action: 'Assigned to ' + sel, by: 'Digital Comms Team', date: new Date().toISOString() });
  saveRequests(all);
  showAssignSel = false;
  render();
  buildDrawer(idx);
}

/**
 * Change the status of a request and update the timeline.
 * @param {number} idx
 * @param {string} status
 */
function changeStatus(idx, status) {
  var all = getRequests();
  all[idx].status   = status;
  all[idx].timeline = all[idx].timeline || [];
  all[idx].timeline.push({
    action: 'Status changed to: ' + STAGE_LABELS[status],
    by:     'Digital Comms Team',
    date:   new Date().toISOString()
  });
  saveRequests(all);
  render();
  buildDrawer(idx);
}

/**
 * Save internal notes for a request.
 * @param {number} idx
 */
function saveNotes(idx) {
  var val = document.getElementById('notesInput').value;
  var all = getRequests();
  all[idx].internalNotes = val;
  saveRequests(all);
  var btn = event.target;
  btn.textContent     = '✓ Saved';
  btn.style.background = '#1a6b45';
  setTimeout(function () {
    btn.textContent     = 'Save Notes';
    btn.style.background = '';
  }, 1800);
}

/* ── DEMO DATA ── */

/**
 * Seed realistic demo requests into localStorage for presentation purposes.
 */
function seedDemo() {
  if (localStorage.getItem('qiu_demo_v2')) {
    alert('Demo data already loaded.');
    return;
  }
  var demo = [
    {
      ref: 'QIU-2025-0004', requestedBy: 'Dr. Priya Nair', email: 'priya@qiu.edu.my',
      department: 'Faculty of Health Sciences', hodEmail: 'dean.health@qiu.edu.my',
      requestedDate: '2025-01-10', dueDate: '2025-02-01',
      jobPurpose: 'Promotional poster for annual Health Sciences symposium.',
      category: 'printed', subtypes: ['Poster'],
      description: '<p>Professional poster for annual symposium. Theme: "Advancing Healthcare in the Digital Age". Speakers: Dato Dr. Hamdan and Dr. Lim Wei Lin.</p>',
      descriptionPlain: 'Professional poster for annual symposium.',
      references: 'drive.google.com/...',
      status: 'in_progress', assignedTo: 'Amirah Zainudin',
      internalNotes: 'First draft 80% done. Awaiting speaker photos.',
      submittedAt: '2025-01-10T08:22:00Z',
      timeline: [
        { action: 'Request submitted',         by: 'Dr. Priya Nair',        date: '2025-01-10T08:22:00Z' },
        { action: 'Endorsed by HOD',           by: 'HOD',                   date: '2025-01-11T09:00:00Z' },
        { action: 'Assigned to Amirah Zainudin', by: 'Digital Comms Team',  date: '2025-01-12T10:00:00Z' },
        { action: 'Status changed to: In Progress', by: 'Digital Comms Team', date: '2025-01-13T10:00:00Z' }
      ]
    },
    {
      ref: 'QIU-2025-0003', requestedBy: 'Ahmad Fauzi', email: 'ahmad@qiu.edu.my',
      department: 'Marketing & Communications', hodEmail: 'head.mkt@qiu.edu.my',
      requestedDate: '2025-01-08', dueDate: '2025-01-28',
      jobPurpose: 'Social media campaign for Open Day recruitment.',
      category: 'digital', subtypes: ['Social Media Promo', 'Digital Ad Campaign'],
      description: '<p>Series of 5 posts for Instagram and Facebook for January Open Day. Target: SPM leavers and parents. Tone: aspirational, modern.</p>',
      descriptionPlain: 'Series of 5 posts for Instagram and Facebook for January Open Day.',
      status: 'approved', assignedTo: 'Hafiz Nordin', internalNotes: '',
      submittedAt: '2025-01-08T14:10:00Z',
      timeline: [
        { action: 'Request submitted', by: 'Ahmad Fauzi', date: '2025-01-08T14:10:00Z' },
        { action: 'Endorsed by HOD',   by: 'HOD',         date: '2025-01-09T10:30:00Z' },
        { action: 'Assigned to Hafiz Nordin', by: 'Digital Comms Team', date: '2025-01-10T09:00:00Z' }
      ]
    },
    {
      ref: 'QIU-2025-0002', requestedBy: 'Tan Mei Ling', email: 'meiling@qiu.edu.my',
      department: 'Student Affairs', hodEmail: 'head.sa@qiu.edu.my',
      requestedDate: '2025-01-05', dueDate: '2025-01-23',
      jobPurpose: 'Photo & video coverage for Convocation Ceremony 2025.',
      category: 'event', subtypes: ['Photo & Video'],
      description: '<p>Full coverage for 15th Convocation. QIU Main Hall. ~400 graduates. Individual shots, group stage, highlight reel.</p>',
      descriptionPlain: 'Full coverage for 15th Convocation. QIU Main Hall.',
      status: 'pending_approval', assignedTo: null, internalNotes: '',
      submittedAt: '2025-01-05T10:00:00Z',
      timeline: [{ action: 'Request submitted', by: 'Tan Mei Ling', date: '2025-01-05T10:00:00Z' }]
    },
    {
      ref: 'QIU-2025-0001', requestedBy: 'Prof. Razali Hassan', email: 'razali@qiu.edu.my',
      department: 'Faculty of Engineering', hodEmail: 'dean.eng@qiu.edu.my',
      requestedDate: '2024-12-20', dueDate: '2025-01-15',
      jobPurpose: 'Department website revamp for Faculty of Engineering.',
      category: 'website', subtypes: ['New Page / Section', 'Website Update / Amendment'],
      description: '<p>Complete redesign of the engineering faculty webpage. Updated staff directory, new research page, and updated programme pages.</p>',
      descriptionPlain: 'Complete redesign of the engineering faculty webpage.',
      status: 'completed', assignedTo: 'Syazwan Kamarudin',
      internalNotes: 'Delivered and signed off by faculty.',
      submittedAt: '2024-12-20T09:00:00Z',
      timeline: [
        { action: 'Request submitted',           by: 'Prof. Razali Hassan', date: '2024-12-20T09:00:00Z' },
        { action: 'Endorsed by HOD',             by: 'HOD',                 date: '2024-12-21T09:00:00Z' },
        { action: 'Status changed to: In Progress', by: 'Digital Comms Team', date: '2024-12-23T09:00:00Z' },
        { action: 'Status changed to: Completed',   by: 'Digital Comms Team', date: '2025-01-14T09:00:00Z' }
      ]
    }
  ];

  var cur = getRequests();
  saveRequests([].concat(cur, demo));
  localStorage.setItem('qiu_count', String(cur.length + 4));
  localStorage.setItem('qiu_demo_v2', '1');
  render();
}

/* ── INIT ── */
render();
setInterval(render, 6000);
