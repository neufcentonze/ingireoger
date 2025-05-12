const fs = require('fs');
const path = require('path');

const CATEGORIES = ['Portefeuille', 'Progression', 'Jeux'];

function buildSidebarPages(req, res, next) {
  const sidebarPages = {};

  CATEGORIES.forEach(category => {
    const folderPath = path.join(__dirname, '..', 'views', category.toLowerCase());
    try {
      const files = fs.readdirSync(folderPath).filter(file => file.endsWith('.ejs'));
      sidebarPages[category] = files.map(file => {
        const name = path.basename(file, '.ejs');
        return {
          route: name,
          label: name.charAt(0).toUpperCase() + name.slice(1) // capitalize
        };
      });
    } catch (err) {
      sidebarPages[category] = [];
    }
  });

  res.locals.sidebarPages = sidebarPages;
  next();
}

module.exports = buildSidebarPages;
