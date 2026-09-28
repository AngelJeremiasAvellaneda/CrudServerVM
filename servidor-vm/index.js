const express = require("express");
const sql = require("mssql");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const config = {
  server: "localhost",
  port: 1433,
  database: "MiAppDB",
  user: "appuser",
  password: "AppPass123!",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;

async function getDb() {
  if (!pool || !pool.connected) {
    pool = await sql.connect(config);
  }
  return pool;
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get("/api/status", async (req, res) => {
  try {
    const db = await getDb();
    await db.request().query("SELECT 1 AS ok");
    res.json({
      connected: true,
      message: "Conectado a SQL Server",
      database: "MiAppDB",
      server: "Windows Server 2022 VM",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(503).json({
      connected: false,
      message: "No se puede conectar a SQL Server",
      error: err.message,
    });
  }
});

// ─── GET todos ───────────────────────────────────────────────────────────────
app.get("/api/productos", async (req, res) => {
  try {
    const db = await getDb();
    const result = await db
      .request()
      .query("SELECT * FROM Productos ORDER BY Id DESC");
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST crear ──────────────────────────────────────────────────────────────
app.post("/api/productos", async (req, res) => {
  try {
    const { Nombre, Descripcion, Precio, Stock } = req.body;
    if (!Nombre || Precio === undefined || Stock === undefined) {
      return res
        .status(400)
        .json({ error: "Nombre, Precio y Stock son requeridos" });
    }
    const db = await getDb();
    const result = await db
      .request()
      .input("Nombre", sql.NVarChar(100), Nombre)
      .input("Descripcion", sql.NVarChar(255), Descripcion || "")
      .input("Precio", sql.Decimal(10, 2), Precio)
      .input("Stock", sql.Int, Stock)
      .query(
        `INSERT INTO Productos (Nombre, Descripcion, Precio, Stock)
         OUTPUT INSERTED.*
         VALUES (@Nombre, @Descripcion, @Precio, @Stock)`
      );
    res.status(201).json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT actualizar ──────────────────────────────────────────────────────────
app.put("/api/productos/:id", async (req, res) => {
  try {
    const { Nombre, Descripcion, Precio, Stock } = req.body;
    const db = await getDb();
    const result = await db
      .request()
      .input("Id", sql.Int, parseInt(req.params.id))
      .input("Nombre", sql.NVarChar(100), Nombre)
      .input("Descripcion", sql.NVarChar(255), Descripcion || "")
      .input("Precio", sql.Decimal(10, 2), Precio)
      .input("Stock", sql.Int, Stock)
      .query(
        `UPDATE Productos
         SET Nombre=@Nombre, Descripcion=@Descripcion,
             Precio=@Precio, Stock=@Stock
         OUTPUT INSERTED.*
         WHERE Id=@Id`
      );
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE eliminar ─────────────────────────────────────────────────────────
app.delete("/api/productos/:id", async (req, res) => {
  try {
    const db = await getDb();
    await db
      .request()
      .input("Id", sql.Int, parseInt(req.params.id))
      .query("DELETE FROM Productos WHERE Id=@Id");
    res.json({ message: "Eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () =>
  console.log("Servidor Express corriendo en http://localhost:3000")
);
