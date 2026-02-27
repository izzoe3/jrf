/* ============================================================
   form.js — Job Request Form (index.html)
   Depends on: shared.js, Quill.js (CDN)
   ============================================================ */

'use strict';

/* ── SET TODAY'S DATE ── */
document.getElementById('requestedDate').value = new Date().toISOString().split('T')[0];

/* ── INITIALISE QUILL EDITOR ── */
var quill = new Quill('#quillEditor', {
  theme: 'snow',
  placeholder: 'Tell us everything we need to know:\n\n• What is this for? (event name, date, venue)\n• Who is the target audience?\n• What sizes or quantities do you need?\n• What colours, fonts, or style do you prefer?\n• What text or content should be included?\n• Any references or examples?\n\nThe more you write here, the less back-and-forth we need.',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ header: [2, 3, false] }],
      ['clean']
    ]
  }
});

/* ── CATEGORY SELECTION ── */

/**
 * Select a category card and show its subtype chips.
 * @param {HTMLElement} el - The clicked card element.
 * @param {string} cat     - Category key e.g. 'printed'.
 */
function selectCat(el, cat) {
  document.querySelectorAll('.cat-card').forEach(function (c) {
    c.classList.remove('selected');
  });
  el.classList.add('selected');
  document.getElementById('category').value = cat;

  document.querySelectorAll('.subtypes').forEach(function (s) {
    s.classList.remove('show');
  });
  var sub = document.getElementById('sub-' + cat);
  if (sub) sub.classList.add('show');
}

/* ── SUBTYPE CHIP TOGGLE ── */

/**
 * Toggle selection of a subtype chip.
 * @param {HTMLElement} el
 */
function toggleSub(el) {
  el.classList.toggle('selected');
}

/* ── FORM SUBMISSION ── */

/**
 * Handle form submission: validate, build request object, save, show modal.
 * @param {Event} e
 */
function submitForm(e) {
  e.preventDefault();

  /* Validate category */
  if (!document.getElementById('category').value) {
    alert('Please select a request category.');
    return;
  }

  /* Validate Quill description */
  var descHTML = quill.root.innerHTML;
  var descText = quill.getText().trim();
  if (!descText) {
    quill.focus();
    document.getElementById('quillWrap').classList.add('error');
    alert('Please add a project description.');
    return;
  }
  document.getElementById('quillWrap').classList.remove('error');

  /* Generate reference number */
  var count = parseInt(localStorage.getItem('qiu_count') || '0', 10) + 1;
  localStorage.setItem('qiu_count', count);
  var refNum = 'QIU-' + new Date().getFullYear() + '-' + String(count).padStart(4, '0');

  /* Collect selected subtypes */
  var subtypes = [];
  document.querySelectorAll('.subtype-chip.selected').forEach(function (c) {
    subtypes.push(c.textContent.trim());
  });

  /* Build request object */
  var req = {
    ref:            refNum,
    requestedBy:    document.getElementById('requestedBy').value,
    email:          document.getElementById('email').value,
    department:     document.getElementById('department').value,
    hodEmail:       document.getElementById('hodEmail').value,
    requestedDate:  document.getElementById('requestedDate').value,
    dueDate:        document.getElementById('dueDate').value,
    jobPurpose:     document.getElementById('jobPurpose').value,
    category:       document.getElementById('category').value,
    subtypes:       subtypes,
    description:    descHTML,
    descriptionPlain: descText,
    references:     document.getElementById('references').value,
    status:         'pending_approval',
    assignedTo:     null,
    internalNotes:  '',
    submittedAt:    new Date().toISOString(),
    timeline: [{
      action: 'Request submitted',
      by:     document.getElementById('requestedBy').value,
      date:   new Date().toISOString()
    }]
  };

  /* Persist and show success modal */
  var all = getRequests();
  all.unshift(req);
  saveRequests(all);

  document.getElementById('refDisplay').textContent = refNum;
  document.getElementById('successModal').classList.add('show');
}
