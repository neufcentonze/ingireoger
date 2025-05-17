const balanceService = require('./balanceService');
const transactionService = require('./transactionService');

function deposit(email, currency, amount, callback) {
  balanceService.updateBalance(email, currency, curr => curr + amount, (err) => {
    if (err) return callback(err);
    transactionService.logTransaction(email, currency, amount, 'depot', callback);
  });
}

function withdraw(email, currency, amount, callback) {
  balanceService.updateBalance(email, currency, curr => curr - amount, (err) => {
    if (err) return callback(err);
    transactionService.logTransaction(email, currency, amount, 'retrait', callback);
  });
}

function getHistory(email, types = [], limit = 20, offset = 0, callback) {
  transactionService.getUserTransactions(email, types, limit, offset, callback);
}

module.exports = {
  deposit,
  withdraw,
  getHistory
};
