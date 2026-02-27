/* ============================================================
   approval.js — HOD Approvals page (approval.html)
   Depends on: shared.js
   ============================================================ */

'use strict';

/* Track which card body is open */
var openIdx = null;

/* ── TOGGLE CARD ── */

/**
 * Toggle the expanded body of a request card.
 * @param {number} i - Index in the requests array.
 */
function toggle(i) {
  var body = document.getElementById('b-' + i);
  var icon = document.getElementById('ic-' + i);

  /* Close previously open card */
  if (openIdx !== null && openIdx !== i) {
    var prevBody = document.getElementById('b-' + openIdx);
    var prevIcon = document.getElementById('ic-' + openIdx);
    if (prevBody) prevBody.classList.remove('open');
    if (prevIcon) prevIcon.classList.remove('open');
  }

  var wasOpen = body.classList.contains('open');
  body.classList.toggle('open', !wasOpen);
  icon.classList.toggle('open', !wasOpen);
  openIdx = wasOpen ? null : i;
}

/* ── APPROVE ── */

/**
 * Approve a request by index. Stops event propagation to avoid toggling card.
 * @param {number} i
 * @param {Event} e
 */
function approve(i, e) {
  e.stopPropagation();
  var reqs = getRequests();
  reqs[i].status     = 'approved';
  reqs[i].approvedAt = new Date().toISOString();
  reqs[i].timeline   = reqs[i].timeline || [];
  reqs[i].timeline.push({
    action: 'Endorsed by HOD',
    by:     'HOD',
    date:   new Date().toISOString()
  });
  saveRequests(reqs);
  render();

  /* Re-open the card so HOD sees the updated state */
  setTimeout(function () {
    var body = document.getElementById('b-' + i);
    var icon = document.getElementById('ic-' + i);
    if (body) body.classList.add('open');
    if (icon) icon.classList.add('open');
    openIdx = i;
  }, 30);
}

/* ── REJECT ── */

/**
 * Reject a request by index with an optional reason.
 * @param {number} i
 * @param {Event} e
 */
function reject(i, e) {
  e.stopPropagation();
  var reason = prompt('Reason for rejection (optional):');
  var reqs = getRequests();
  reqs[i].status          = 'rejected';
  reqs[i].rejectedAt      = new Date().toISOString();
  reqs[i].rejectionReason = reason || '';
  reqs[i].timeline        = reqs[i].timeline || [];
  reqs[i].timeline.push({
    action: 'Rejected by HOD' + (reason ? ': ' + reason : ''),
    by:     'HOD',
    date:   new Date().toISOString()
  });
  saveRequests(reqs);
  render();
}

/* ── RENDER ── */

/**
 * Render all requests in the HOD approval list.
 */
function render() {
  var reqs = getRequests();
  var list = document.getElementById('reqList');

  if (!reqs.length) {
    list.innerHTML =
      '<div class="empty-state">' +
        '<div class="icon">📭</div>' +
        '<h3>No requests</h3>' +
        '<p>When staff submit job requests, they will appear here for your endorsement.</p>' +
      '</div>';
    return;
  }

  list.innerHTML = reqs.map(function (r, i) {
    var isPending = r.status === 'pending_approval';
    var catLabel  = CAT_LABELS_ICON[r.category] || r.category;

    var actionHtml = isPending
      ? '<div class="action-row">' +
          '<button class="btn-approve" onclick="approve(' + i + ',event)">✓ Endorse &amp; Approve</button>' +
          '<button class="btn-reject"  onclick="reject(' + i + ',event)">✗ Reject</button>' +
        '</div>'
      : '<div class="done-note">' +
          (r.status === 'approved'
            ? '✓ You approved this on ' + fmtDate(r.approvedAt)
            : r.status === 'rejected'
              ? '✗ Rejected on ' + fmtDate(r.rejectedAt)
              : 'This request is being handled by Digital Comms.') +
        '</div>';

    return '<div class="req-card">' +
      '<div class="req-header" onclick="toggle(' + i + ')">' +
        '<div class="ref-tag">' + r.ref + '</div>' +
        '<div class="req-info">' +
          '<div class="req-name">' + r.requestedBy + '</div>' +
          '<div class="req-dept">' + r.department + ' · Submitted ' + fmtDate(r.submittedAt) + '</div>' +
        '</div>' +
        '<div class="req-badges">' +
          '<span class="cat-pill">' + catLabel + '</span>' +
          '<span class="status-badge s-' + r.status + '">' + (STAGE_LABELS[r.status] || r.status) + '</span>' +
          '<span class="toggle-icon" id="ic-' + i + '">▾</span>' +
        '</div>' +
      '</div>' +
      '<div class="req-body" id="b-' + i + '">' +
        '<div class="detail-grid">' +
          '<div class="dl"><dt>Requestor</dt><dd>' + r.requestedBy + ' · ' + r.email + '</dd></div>' +
          '<div class="dl"><dt>Department</dt><dd>' + r.department + '</dd></div>' +
          '<div class="dl"><dt>Request Date</dt><dd>' + fmtDate(r.requestedDate) + '</dd></div>' +
          '<div class="dl"><dt>Due Date</dt><dd>' + fmtDate(r.dueDate) + '</dd></div>' +
          '<div class="dl"><dt>Category</dt><dd>' + catLabel + '</dd></div>' +
          '<div class="dl"><dt>Sub-types</dt><dd>' + (r.subtypes && r.subtypes.length ? r.subtypes.join(', ') : '—') + '</dd></div>' +
        '</div>' +
        '<div class="sub-h">Job Purpose</div>' +
        '<div class="desc-block">' + (r.jobPurpose || '—') + '</div>' +
        '<div class="sub-h">Project Description</div>' +
        '<div class="desc-block">' + (r.description || r.descriptionPlain || '—') + '</div>' +
        (r.references ? '<div class="sub-h">Supporting Materials</div><div class="desc-block">' + r.references + '</div>' : '') +
        actionHtml +
      '</div>' +
    '</div>';
  }).join('');
}

/* ── INIT ── */
render();
