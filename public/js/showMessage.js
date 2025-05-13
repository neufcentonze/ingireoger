/**
 * Affiche un message dans une balise donnée (succès ou erreur)
 * @param {string} targetId - L'ID de l'élément DOM où afficher le message
 * @param {string} message - Le contenu du message
 * @param {boolean} isSuccess - true = succès (vert), false = erreur (rouge)
 */
function showMessage(targetId, message, isSuccess = true) {
  const el = document.getElementById(targetId);
  if (!el) return;
  el.innerText = message;
  el.style.color = isSuccess ? "limegreen" : "crimson";
  el.style.fontWeight = "500";
  el.style.marginTop = "10px";
  el.style.textAlign = "center";
}
