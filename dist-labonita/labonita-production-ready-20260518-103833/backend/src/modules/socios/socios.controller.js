const db = require('../../config/db');

// LISTAR SOCIOS
exports.listSocios = (req, res) => {
  db.all(
    `SELECT * FROM socios WHERE active = 1`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
};

// LISTAR NO SOCIOS
exports.listNoSocios = (req, res) => {
  db.all(
    `
    SELECT u.id, u.email
    FROM users u
    LEFT JOIN socios s ON s.user_id = u.id
    WHERE s.id IS NULL AND u.role = 'ARTIST'
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
};

// DESACTIVAR SOCIO
exports.deactivate = (req, res) => {
  const { id } = req.params;

  db.run(
    `UPDATE socios SET active = 0 WHERE id = ?`,
    [id],
    function (err) {
      if (err || this.changes === 0) {
        return res.status(400).json({ error: 'Invalid' });
      }
      res.json({ ok: true });
    }
  );
};
