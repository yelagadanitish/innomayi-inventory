// ===============================
// server.js
// ===============================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const db = require("./db");
const app = express();
app.use(cors());
app.use(express.json());

/* =========================================
   GET INVENTORY
========================================= */
app.get("/inventory", (req, res) => {

  const query = `
    SELECT 
      boxes.name AS box,
      components.name AS component,
      components.quantity AS quantity
    FROM components
    JOIN boxes ON components.box_id = boxes.id
    ORDER BY boxes.name;
  `;

  db.query(query, (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    res.json(result);
  });
});

/* =========================================
   SEARCH
========================================= */
app.get("/search", (req, res) => {

  const q = req.query.q || "";

  const query = `
    SELECT 
      boxes.name AS box,
      components.name AS component,
      components.quantity AS quantity
    FROM components
    JOIN boxes ON components.box_id = boxes.id
    WHERE components.name LIKE ?
  `;

  db.query(query, [`%${q}%`], (err, result) => {

    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    res.json(result);
  });
});

/* =========================================
   GET LOGS
========================================= */
app.get("/logs", (req, res) => {

  db.query(
    `
    SELECT * FROM activity_logs
    ORDER BY created_at DESC
    LIMIT 20
    `,
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      res.json(result);
    }
  );
});

/* =========================================
   ADD LOG FUNCTION
========================================= */
function addLog(text){

  db.query(
    `
    INSERT INTO activity_logs(action_text)
    VALUES(?)
    `,
    [text]
  );
}

/* =========================================
   ADD COMPONENT
========================================= */
app.post("/add-component", (req, res) => {

  const { box, component, quantity } = req.body;

  if (!box || !component) {
    return res.status(400).send("Missing data");
  }

  db.query(
    "SELECT id FROM boxes WHERE name=?",
    [box],
    (err, result) => {

      if (err) {
        console.error(err);
        return res.status(500).send(err);
      }

      if (result.length === 0) {

        db.query(
          "INSERT INTO boxes(name) VALUES(?)",
          [box],
          (err, boxRes) => {

            if (err) {
              console.error(err);
              return res.status(500).send(err);
            }

            insertComponent(boxRes.insertId);
          }
        );

      } else {

        insertComponent(result[0].id);

      }
    }
  );

  function insertComponent(boxId){

    db.query(
      `
      INSERT INTO components(name, box_id, quantity)
      VALUES(?,?,?)
      `,
      [component, boxId, quantity || 0],
      (err) => {

        if (err) {
          console.error(err);
          return res.status(500).send(err);
        }

        addLog(`Added ${component} (${quantity}) in Box ${box}`);

        res.json({message:"Added successfully"});
      }
    );
  }
});

/* =========================================
   ADD BOX
========================================= */
app.post("/add-box", (req, res) => {

  const { box } = req.body;

  db.query(
    `
    INSERT INTO boxes(name)
    VALUES(?)
    `,
    [box],
    (err) => {

      if (err) {
        console.error(err);
        return res.status(500).send("Box exists");
      }

      addLog(`Created Box ${box}`);

      res.json({message:"Box created"});
    }
  );
});

/* =========================================
   DELETE COMPONENT
========================================= */
app.delete("/delete-component", (req, res) => {

  const { name, box } = req.body;

  const query = `
    DELETE components
    FROM components
    JOIN boxes ON components.box_id = boxes.id
    WHERE components.name=? AND boxes.name=?
  `;

  db.query(query, [name, box], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    addLog(`Deleted ${name} from Box ${box}`);

    res.json({message:"Deleted"});
  });
});

/* =========================================
   UPDATE QUANTITY
========================================= */
app.put("/update-quantity", (req, res) => {

  const { name, box, action } = req.body;

  const operation =
    action === "increase"
      ? "quantity + 1"
      : "GREATEST(quantity - 1,0)";

  const query = `
    UPDATE components
    JOIN boxes ON components.box_id = boxes.id
    SET components.quantity = ${operation}
    WHERE components.name=? AND boxes.name=?
  `;

  db.query(query, [name, box], (err) => {

    if (err) {
      console.error(err);
      return res.status(500).send(err);
    }

    addLog(`${action} quantity for ${name} in Box ${box}`);

    res.json({message:"Updated"});
  });
});

/* =========================================
   SERVER
========================================= */
app.listen(5000, () => {

  console.log("🚀 Server running on port 5000");

});