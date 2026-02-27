/* ============================================================
   shared.js — QIU Digital Communications Job Request System
   Shared utilities used by multiple pages.
   ============================================================ */

'use strict';

/* ── DATA CONSTANTS ── */

var CAT_LABELS = {
  printed: 'Printed Media',
  digital: 'Digital Media',
  website: 'Website',
  event:   'Event Coverage',
  video:   'Video Production',
  other:   'Other'
};

var CAT_LABELS_ICON = {
  printed: '🖨️ Printed Media',
  digital: '📱 Digital Media',
  website: '🌐 Website',
  event:   '📸 Event Coverage',
  video:   '🎬 Video Production',
  other:   '✦ Other'
};

var STAGE_LABELS = {
  pending_approval: 'Awaiting Approval',
  approved:         'Approved',
  rejected:         'Rejected',
  in_progress:      'In Progress',
  on_hold:          'On Hold',
  completed:        'Completed'
};

var BADGE_STATUS_LABELS = {
  pending_approval: 'Awaiting HOD Approval',
  approved:         'HOD Approved',
  in_progress:      'In Progress',
  on_hold:          'On Hold',
  completed:        'Completed',
  rejected:         'Not Approved'
};

/* ── DATE FORMATTING ── */

/**
 * Format an ISO date string or date-only string (YYYY-MM-DD) to
 * a human-readable date, e.g. "12 Jan 2025".
 * @param {string} d
 * @returns {string}
 */
function fmtDate(d) {
  if (!d) return '—';
  var dt = new Date(d.length === 10 ? d + 'T00:00:00' : d);
  return dt.toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * Returns true if the given ISO date is strictly in the past (not today).
 * @param {string} iso
 * @returns {boolean}
 */
function isOverdue(iso) {
  if (!iso) return false;
  var d = new Date(iso);
  var now = new Date();
  return d < now && d.toDateString() !== now.toDateString();
}

/* ── BADGE HELPERS ── */

/**
 * Returns the CSS class suffix for a given status.
 * @param {string} status
 * @returns {string}
 */
function badgeClass(status) {
  var map = {
    pending_approval: 'badge-pending',
    approved:         'badge-approved',
    in_progress:      'badge-in_progress',
    on_hold:          'badge-on_hold',
    completed:        'badge-completed',
    rejected:         'badge-rejected'
  };
  return map[status] || 'badge-pending';
}

/**
 * Returns the human-readable label for a status badge.
 * @param {string} status
 * @returns {string}
 */
function badgeLabel(status) {
  return BADGE_STATUS_LABELS[status] || status;
}

/* ── LOCAL STORAGE HELPERS ── */

/**
 * Retrieve all requests from localStorage.
 * @returns {Array}
 */
function getRequests() {
  try {
    return JSON.parse(localStorage.getItem('qiu_requests') || '[]');
  } catch (e) {
    return [];
  }
}

/**
 * Persist the full requests array to localStorage.
 * @param {Array} data
 */
function saveRequests(data) {
  localStorage.setItem('qiu_requests', JSON.stringify(data));
}

/* ── INITIALS ── */

/**
 * Returns initials (up to 2 chars) from a full name string.
 * @param {string} name
 * @returns {string}
 */
function initials(name) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map(function (w) { return w[0]; }).join('').toUpperCase();
}
