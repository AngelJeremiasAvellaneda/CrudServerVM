export interface Producto {
  Id: number;
  Nombre: string;
  Descripcion: string;
  Precio: number;
  Stock: number;
  FechaCreacion: string;
}

export type ProductoInput = Omit<Producto, "Id" | "FechaCreacion">;
