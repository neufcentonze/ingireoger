const db = require('../db/index');
const { getRate } = require('../services/cryptoRates');

const ALLOWED_CURRENCIES = ['btc', 'eth', 'ltc', 'sol'];
const ALLOWED_TYPES = ['depot', 'withdrawal', 'games'];

function computeBalance(value) {
  const number = typeof value === 'number' ? value : parseFloat(value);
  if (isNaN(number)) return 0.00000000;
  return parseFloat(number.toFixed(8));
}

function computeRealAndBonusParts(email, currency, totalBalance, callback) {
  const bonusQuery = `
    SELECT amount FROM bonuses
    WHERE email = ? AND currency = ? AND status = 'active' AND wager_status != 'completed'
    ORDER BY createdAt DESC LIMIT 1
  `;

  db.get(bonusQuery, [email, currency], (err, bonus) => {
    if (err) return callback(err);

    const bonusAmount = bonus ? parseFloat(bonus.amount) : 0;
    const total = parseFloat(totalBalance);

    const bonusUsed = Math.min(bonusAmount, total);
    const realPart = Math.max(0, total - bonusUsed);

    callback(null, {
      real: realPart,
      bonus: bonusUsed
    });
  });
}

function updateBalance({ email, currency, computeOrValue, type, game = null, bet = null, callback }) {
  if (!ALLOWED_CURRENCIES.includes(currency)) {
    return callback(new Error("Crypto non supportée."));
  }

  if (!ALLOWED_TYPES.includes(type)) {
    return callback(new Error("Type de transaction invalide."));
  }



  const selectQuery = `SELECT ${currency} FROM solde WHERE email = ?`;

  db.get(selectQuery, [email], (err, row) => {
    if (err || !row) return callback(err || new Error("Utilisateur non trouvé"));

    const currentRaw = row[currency];
    const current = typeof currentRaw === 'number' ? currentRaw : parseFloat(currentRaw) || 0;

    let newBalance;
    if (typeof computeOrValue === 'function') {
      newBalance = computeBalance(computeOrValue(current));
    } else {
      newBalance = computeBalance(computeOrValue);
    }

    if (newBalance < 0) {
      return callback(new Error("Solde insuffisant."));
    }

    const updateQuery = `UPDATE solde SET ${currency} = ? WHERE email = ?`;

    db.run(updateQuery, [newBalance, email], (updateErr) => {
      if (updateErr) return callback(updateErr);

      const amount = parseFloat((newBalance - current).toFixed(8));
      const amountEur = parseFloat((amount * getRate(currency)).toFixed(2));

      let betEur = null;

      // Vérification spécifique pour type "games"
      if (type === 'games') {
        if (!game || bet == null) {
          return callback(new Error("Champs 'game' et 'bet' requis pour type 'games'."));
        }

        const betEur = parseFloat((bet * getRate(currency)).toFixed(2));

        // Étape 1 : vérifier s’il y a un bonus actif
        const bonusQuery = `
    SELECT id, amount_eur, wager_progress, wager_target
    FROM bonuses
    WHERE email = ? AND status = 'active' AND wager_status = 'in_progress'
    ORDER BY createdAt DESC LIMIT 1
  `;

        db.get(bonusQuery, [email], (bonusErr, bonus) => {
          if (bonusErr) {
            console.error("Erreur lecture bonus:", bonusErr);
            return callback(bonusErr);
          }

          const useBonus = bonus && bonus.amount_eur > 0 && current < bet;
          let remainingBet = bet; // Montant à déduire

          const newRealBalance = current - bet;
          let bonusUsed = 0;

          if (newRealBalance >= 0) {
            // Cas : solde réel suffisant → on déduit uniquement du solde
            newBalance = computeBalance(current - bet);
          } else if (useBonus) {
            // Cas : partiellement ou totalement sur le bonus
            bonusUsed = Math.abs(newRealBalance);
            newBalance = 0;

            // On met à jour le bonus.amount_eur (déduit bonusUsed)
            const newBonusAmount = Math.max(0, bonus.amount_eur - (bonusUsed * getRate(currency)));

            db.run(`
        UPDATE bonuses SET amount_eur = ? WHERE id = ?
      `, [newBonusAmount, bonus.id], (errBonusUpdate) => {
              if (errBonusUpdate) console.error("Erreur MAJ bonus après usage:", errBonusUpdate);
            });
          } else {
            return callback(new Error("Solde insuffisant."));
          }

          // Mise à jour du solde réel
          db.run(`UPDATE solde SET ${currency} = ? WHERE email = ?`, [newBalance, email], (updateErr) => {
            if (updateErr) return callback(updateErr);

            // Journalisation de la transaction
            const amount = parseFloat((newBalance - current).toFixed(8));
            const amountEur = parseFloat((amount * getRate(currency)).toFixed(2));

            if (useBonus && amount > 0) {
              const gainCrypto = amount;
              const gainEur = parseFloat((gainCrypto * getRate(currency)).toFixed(2));

              db.run(`
                  UPDATE bonuses
                  SET amount = amount + ?, amount_eur = amount_eur + ?
                  WHERE id = ?
                `, [gainCrypto, gainEur, bonus.id], (bonusUpErr) => {
                if (bonusUpErr) {
                  console.error("Erreur update bonus après gain:", bonusUpErr);
                }
              });
            }

            const insertTx = `
        INSERT INTO transactions (email, currency, amount, amount_eur, type, date, game, bet, bet_eur)
        VALUES (?, ?, ?, ?, ?, DATETIME('now'), ?, ?, ?)
      `;

            db.run(insertTx, [email, currency, amount, amountEur, type, game, bet, betEur], (txErr) => {
              if (txErr) {
                console.error("Erreur journalisation transaction:", txErr);
              }

              // Étape 2 : si bonus actif, mettre à jour wager_progress
              if (!useBonus) return callback(null); // Aucun bonus actif, fin

              const newWagerProgress = bonus.wager_progress + betEur;
              const newWagerStatus = newWagerProgress >= bonus.wager_target ? 'completed' : 'in_progress';

              db.run(`
          UPDATE bonuses
          SET wager_progress = ?, wager_status = ?
          WHERE id = ?
        `, [newWagerProgress, newWagerStatus, bonus.id], (wagerUpdateErr) => {
                if (wagerUpdateErr) {
                  console.error("Erreur mise à jour wager:", wagerUpdateErr);
                }
                return callback(null);
              });
            });
          });
        });
      }

      const insertTx = `
        INSERT INTO transactions (email, currency, amount, amount_eur, type, date, game, bet, bet_eur)
        VALUES (?, ?, ?, ?, ?, DATETIME('now'), ?, ?, ?)
      `;

      db.run(insertTx, [email, currency, amount, amountEur, type, game, bet, betEur], (txErr) => {
        if (txErr) {
          console.error("Erreur journalisation transaction:", txErr);
        }
        return callback(null);
      });
    });
  });
}

module.exports = {
  computeBalance,
  updateBalance,
  computeRealAndBonusParts,
};
