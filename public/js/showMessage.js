/**
 * Affiche un message global (succès ou erreur)
 * @param {string} targetId - ID de l'élément (ex: 'globalMessage')
 * @param {string} message - Texte à afficher
 * @param {boolean} isSuccess - true = vert / false = rouge
 */
function showMessage(targetId, message, isSuccess = true) {
  const el = document.getElementById(targetId);
  if (!el) return;

  el.innerHTML = `
    <i data-lucide="${isSuccess ? 'check-circle' : 'ban'}"></i>
    <span>${message}</span>
  `;

  lucide.createIcons();

  el.classList.remove('success', 'error', 'show'); // reset
  el.style.display = "flex";

  void el.offsetWidth; // force reflow for animation

  el.classList.add(isSuccess ? 'success' : 'error', 'show');

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => {
      el.style.display = "none";
      el.classList.remove('success', 'error');
    }, 400);
  }, 4000);
}