/* ============================================================
   guide.js — User Guide (user-guide.html)
   ============================================================ */

'use strict';

/**
 * Toggle a FAQ item open or closed.
 * Closes any other open item first.
 * @param {HTMLElement} el - The .faq-q element that was clicked.
 */
function toggleFaq(el) {
  var item   = el.closest('.faq-item');
  var isOpen = item.classList.contains('open');

  /* Close all items */
  document.querySelectorAll('.faq-item').forEach(function (i) {
    i.classList.remove('open');
  });

  /* Open the clicked item if it wasn't already open */
  if (!isOpen) {
    item.classList.add('open');
  }
}
