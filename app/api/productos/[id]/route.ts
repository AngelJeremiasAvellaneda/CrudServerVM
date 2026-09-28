import { NextRequest, NextResponse } from "next/server";
import { getDb, sql } from "@/lib/db";
import { ProductoInput } from "@/types/producto";

// GET /api/productos/:id — Obtener uno
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .request()
      .input("Id", sql.Int, id)
      .query("SELECT * FROM Productos WHERE Id = @Id");

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al obtener producto:", error);
    return NextResponse.json(
      { error: "Error al obtener producto" },
      { status: 500 }
    );
  }
}

// PUT /api/productos/:id — Actualizar
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const body: ProductoInput = await request.json();
    const { Nombre, Descripcion, Precio, Stock } = body;

    if (!Nombre || Precio === undefined || Stock === undefined) {
      return NextResponse.json(
        { error: "Nombre, Precio y Stock son requeridos" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db
      .request()
      .input("Id", sql.Int, id)
      .input("Nombre", sql.NVarChar(100), Nombre)
      .input("Descripcion", sql.NVarChar(255), Descripcion || "")
      .input("Precio", sql.Decimal(10, 2), Precio)
      .input("Stock", sql.Int, Stock)
      .query(
        `UPDATE Productos
         SET Nombre = @Nombre, Descripcion = @Descripcion,
             Precio = @Precio, Stock = @Stock
         OUTPUT INSERTED.*
         WHERE Id = @Id`
      );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(result.recordset[0]);
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    return NextResponse.json(
      { error: "Error al actualizar producto" },
      { status: 500 }
    );
  }
}

// DELETE /api/productos/:id — Eliminar
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const db = await getDb();
    const result = await db
      .request()
      .input("Id", sql.Int, id)
      .query(
        "DELETE FROM Productos OUTPUT DELETED.Id WHERE Id = @Id"
      );

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { error: "Producto no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Producto eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    return NextResponse.json(
      { error: "Error al eliminar producto" },
      { status: 500 }
    );
  }
}
