const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

/* ===============================
DATABASE CONNECTION
=============================== */

const db = mysql.createConnection({

    host: process.env.DB_HOST,

    user: process.env.DB_USER,

    password: process.env.DB_PASSWORD,

    database: process.env.DB_NAME,

    port: process.env.DB_PORT
});

db.connect((err)=>{

    if(err){

        console.log(
            "❌ Database connection failed:",
            err
        );

    }else{

        console.log(
            "✅ MySQL Connected"
        );
    }
});

/* ===============================
GET INVENTORY
=============================== */

app.get("/inventory",(req,res)=>{

    const sql = `
    
    SELECT

        components.id,

        components.name,

        components.quantity,

        boxes.name AS box

    FROM components

    JOIN boxes

    ON components.box_id = boxes.id

    ORDER BY boxes.name

    `;

    db.query(sql,(err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        res.json(result);
    });
});

/* ===============================
ADD COMPONENT
=============================== */

app.post("/add-component",(req,res)=>{

    const {
        box,
        name,
        quantity
    } = req.body;

    const getBox = `
    
    SELECT id
    
    FROM boxes
    
    WHERE name = ?
    
    `;

    db.query(
        getBox,
        [box],
        (err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        if(result.length === 0){

            return res
            .status(404)
            .json({
                error:"Box not found"
            });
        }

        const boxId = result[0].id;

        const sql = `
        
        INSERT INTO components
        (
            name,
            quantity,
            box_id
        )
        
        VALUES(?,?,?)
        
        `;

        db.query(
            sql,
            [
                name,
                quantity,
                boxId
            ],
            (err,result)=>{

            if(err){

                return res.status(500).json(err);
            }

            res.json({
                success:true
            });
        });

    });
});

/* ===============================
ADD BOX
=============================== */

app.post("/add-box",(req,res)=>{

    const { box } = req.body;

    const sql = `
    
    INSERT INTO boxes(name)

    VALUES(?)
    
    `;

    db.query(
        sql,
        [box],
        (err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        res.json({
            success:true
        });
    });
});

/* ===============================
UPDATE QUANTITY
=============================== */

app.put(
    "/update-quantity/:id",
    (req,res)=>{

    const { id } = req.params;

    const { quantity } = req.body;

    const sql = `
    
    UPDATE components

    SET quantity = ?

    WHERE id = ?
    
    `;

    db.query(
        sql,
        [
            quantity,
            id
        ],
        (err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        res.json({
            success:true
        });
    });
});

/* ===============================
EDIT COMPONENT NAME
=============================== */

app.put(
    "/edit-component/:id",
    (req,res)=>{

    const { id } = req.params;

    const { name } = req.body;

    const sql = `
    
    UPDATE components

    SET name = ?

    WHERE id = ?
    
    `;

    db.query(
        sql,
        [
            name,
            id
        ],
        (err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        res.json({
            success:true
        });
    });
});

/* ===============================
DELETE COMPONENT
=============================== */

app.delete(
    "/delete-component/:id",
    (req,res)=>{

    const { id } = req.params;

    const sql = `
    
    DELETE FROM components

    WHERE id = ?
    
    `;

    db.query(
        sql,
        [id],
        (err,result)=>{

        if(err){

            return res.status(500).json(err);
        }

        res.json({
            success:true
        });
    });
});

/* ===============================
ADMIN LOGIN
=============================== */

app.post(
    "/admin-login",
    (req,res)=>{

    const {
        username,
        password
    } = req.body;

    const adminUser = "admin";

    const adminPass = "innomayi123";

    if(
        username === adminUser &&
        password === adminPass
    ){

        res.json({
            success:true
        });

    }else{

        res.status(401).json({
            success:false
        });
    }
});

/* ===============================
LOGS
=============================== */

app.get("/logs",(req,res)=>{

    res.json([]);
});

/* ===============================
START SERVER
=============================== */

const PORT =
    process.env.PORT || 5000;

app.listen(PORT,()=>{

    console.log(
        `🚀 Server running on ${PORT}`
    );
});