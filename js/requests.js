/* ============================================================
   requests.js — My Requests page (my-requests.html)
   Depends on: shared.js
   ============================================================ */

'use strict';

/* ── STEPPER CONFIGURATION ── */
var STEPS = [
  { key: 'submitted',   label: 'Submitted' },
  { key: 'hod',         label: 'HOD Approval' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'review',      label: 'Under Review' },
  { key: 'completed',   label: 'Completed' }
];

/**
 * Maps a request status to the active step index (0-based).
 * @param {string} status
 * @returns {number}
 */
function statusToStepIdx(status) {
  var map = {
    pending_approval: 1,
    approved:         2,
    in_progress:      3,
    on_hold:          3,
    completed:        5,
    rejected:         1
  };
  return (map[status] !== undefined ? map[status] : 1) - 1;
}

/**
 * Returns status message copy and CSS class for a given status.
 * @param {string} status
 * @returns {{ cls: string, text: string }}
 */
function statusMessage(status) {
  var msgs = {
    pending_approval: {
      cls: 'msg-amber',
      text: "Your request is waiting for your HOD's endorsement. You will receive an email update once it is approved."
    },
    approved: {
      cls: 'msg-green',
      text: 'Your HOD has endorsed this request. Our team has been notified and will begin work soon. You will receive an email when work starts.'
    },
    in_progress: {
      cls: 'msg-indigo',
      text: 'Our team is actively working on your request. If we need clarification, we will reach out via your request email thread.'
    },
    on_hold: {
      cls: 'msg-gray',
      text: 'Your request has been placed on hold. Our team will contact you via your request email thread with further details.'
    },
    completed: {
      cls: 'msg-green',
      text: 'Your project is complete! Please collect it from the Digital Communications office, or check your email for the file link.'
    },
    rejected: {
      cls: 'msg-rust',
      text: 'This request was not approved by your HOD. Please speak with your HOD directly for more information.'
    }
  };
  return msgs[status] || msgs.pending_approval;
}

/* ── BUILD PROGRESS STEPPER HTML ── */

/**
 * Builds the stepper HTML for a given status.
 * @param {string} status
 * @returns {string}
 */
function buildStepper(status) {
  var activeIdx  = statusToStepIdx(status);
  var isRejected = status === 'rejected';
  var isOnHold   = status === 'on_hold';

  var stepsHtml = STEPS.map(function (s, i) {
    var dotClass   = '';
    var labelClass = '';
    var content    = String(i + 1);

    if (isRejected && i === 0) {
      dotClass = 'rejected'; content = '✕'; labelClass = 'active-label';
    } else if (isOnHold && i === activeIdx) {
      dotClass = 'hold'; content = '⏸'; labelClass = 'active-label';
    } else if (i < activeIdx) {
      dotClass = 'done'; content = '✓';
    } else if (i === activeIdx) {
      dotClass = 'active'; labelClass = 'active-label';
    }

    return '<div class="step">' +
      '<div class="step-dot ' + dotClass + '">' + content + '</div>' +
      '<div class="step-label ' + labelClass + '">' + s.label + '</div>' +
      '</div>';
  }).join('');

  return '<div class="stepper">' + stepsHtml + '</div>';
}

/* ── BUILD CARD HTML ── */

/**
 * Builds the full HTML string for a request card.
 * @param {Object} r - Request object.
 * @returns {string}
 */
function buildCard(r) {
  var catLabel   = CAT_LABELS[r.category] || r.category;
  var subtypeStr = (r.subtypes && r.subtypes.length) ? ' — ' + r.subtypes.join(', ') : '';
  var msg        = statusMessage(r.status);

  var descContent = r.description
    ? '<div class="desc-block">' + r.description + '</div>'
    : r.descriptionPlain
      ? '<div class="desc-block">' + r.descriptionPlain + '</div>'
      : '<div class="desc-block" style="color:var(--muted);font-style:italic">No description provided.</div>';

  var refContent = r.references
    ? '<div class="ref-link">📁 <a href="' + r.references + '" target="_blank" rel="noopener">' + r.references + '</a></div>'
    : '<span style="color:var(--muted);font-size:13px">None provided</span>';

  return '<div class="req-card" id="card-' + r.ref + '">' +
    '<div class="req-header" onclick="toggleCard(\'' + r.ref + '\')">' +
      '<div class="req-header-left">' +
        '<div class="req-ref">' + r.ref + '</div>' +
        '<div class="req-title">' + catLabel + subtypeStr + '</div>' +
        '<div class="req-meta">' +
          '<span>👤 ' + r.requestedBy + '</span>' +
          '<span>🏢 ' + r.department + '</span>' +
          '<span>📅 Due ' + fmtDate(r.dueDate) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="req-header-right">' +
        '<span class="status-badge ' + badgeClass(r.status) + '">' + badgeLabel(r.status) + '</span>' +
        '<span class="expand-icon">▼</span>' +
      '</div>' +
    '</div>' +
    '<div class="progress-wrap">' + buildStepper(r.status) + '</div>' +
    '<div class="status-msg ' + msg.cls + '">' + msg.text + '</div>' +
    '<div class="req-detail">' +
      '<div class="detail-grid">' +
        '<div class="dl"><dt>Reference</dt><dd>' + r.ref + '</dd></div>' +
        '<div class="dl"><dt>Submitted</dt><dd>' + fmtDate(r.submittedAt) + '</dd></div>' +
        '<div class="dl"><dt>Requested By</dt><dd>' + r.requestedBy + '</dd></div>' +
        '<div class="dl"><dt>Email</dt><dd>' + r.email + '</dd></div>' +
        '<div class="dl"><dt>Department</dt><dd>' + r.department + '</dd></div>' +
        '<div class="dl"><dt>Requested Date</dt><dd>' + fmtDate(r.requestedDate) + '</dd></div>' +
        '<div class="dl"><dt>Due Date</dt><dd>' + fmtDate(r.dueDate) + '</dd></div>' +
        '<div class="dl"><dt>Category</dt><dd>' + catLabel + subtypeStr + '</dd></div>' +
      '</div>' +
      '<div class="sub-heading">Job Purpose</div>' +
      '<div class="desc-block">' + (r.jobPurpose || '—') + '</div>' +
      '<div class="sub-heading">Project Description</div>' +
      descContent +
      '<div class="sub-heading">Supporting Materials</div>' +
      refContent +
      '<div class="poc-notice">ℹ️ In production, this page will only show requests submitted by your account (filtered by Google SSO email). Demo mode shows all requests in this browser session.</div>' +
    '</div>' +
  '</div>';
}

/* ── TOGGLE CARD EXPAND ── */

/**
 * Toggle the open/closed state of a request card.
 * @param {string} ref
 */
function toggleCard(ref) {
  var card = document.getElementById('card-' + ref);
  if (card) card.classList.toggle('open');
}

/* ── MAIN RENDER ── */

/**
 * Render all request cards, or show the empty state.
 */
function render() {
  var all    = getRequests();
  var listEl = document.getElementById('requestsList');
  var emptyEl = document.getElementById('emptyState');

  if (!all.length) {
    emptyEl.style.display = 'block';
    listEl.innerHTML = '';
    return;
  }

  emptyEl.style.display = 'none';
  listEl.innerHTML = all.map(buildCard).join('');
}

/* ── INIT ── */
render();
