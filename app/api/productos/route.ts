import { NextRequest, NextResponse } from "next/server";
import { getDb, sql } from "@/lib/db";
import { ProductoInput } from "@/types/producto";

// GET /api/productos — Listar todos
export async function GET() {
  try {
    const db = await getDb();
    const result = await db
      .request()
      .query("SELECT * FROM Productos ORDER BY Id DESC");

    return NextResponse.json(result.recordset);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}

// POST /api/productos — Crear nuevo
export async function POST(request: NextRequest) {
  try {
    const body: ProductoInput = await request.json();
    const { Nombre, Descripcion, Precio, Stock } = body;

    // Validaciones básicas
    if (!Nombre || Precio === undefined || Stock === undefined) {
      return NextResponse.json(
        { error: "Nombre, Precio y Stock son requeridos" },
        { status: 400 }
      );
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

    return NextResponse.json(result.recordset[0], { status: 201 });
  } catch (error) {
    console.error("Error al crear producto:", error);
    return NextResponse.json(
      { error: "Error al crear producto" },
      { status: 500 }
    );
  }
}
