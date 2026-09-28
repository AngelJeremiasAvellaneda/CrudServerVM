"use client";

import { useEffect, useState, useCallback } from "react";
import { Producto, ProductoInput } from "@/types/producto";
import { ToastContainer, ToastData, ToastType } from "@/components/Toast";
import { StatusBadge } from "@/components/StatusBadge";

const EMPTY_FORM: ProductoInput = {
  Nombre: "",
  Descripcion: "",
  Precio: 0,
  Stock: 0,
};

let toastIdCounter = 0;

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<ProductoInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    setToasts((prev) => [...prev, { id: ++toastIdCounter, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchProductos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/productos");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setProductos(data);
    } catch {
      addToast("error", "No se pudieron cargar los productos del servidor.");
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchProductos();
  }, [fetchProductos]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "Precio" || name === "Stock" ? Number(value) : value,
    }));
  }

  function handleEdit(producto: Producto) {
    setEditingId(producto.Id);
    setForm({
      Nombre: producto.Nombre,
      Descripcion: producto.Descripcion,
      Precio: producto.Precio,
      Stock: producto.Stock,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancel() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.Nombre.trim()) {
      addToast("warning", "El nombre del producto es requerido.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/productos/${editingId}`
        : "/api/productos";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error desconocido");
      }

      addToast(
        "success",
        editingId
          ? `Producto "${form.Nombre}" actualizado correctamente.`
          : `Producto "${form.Nombre}" agregado correctamente.`
      );
      handleCancel();
      fetchProductos();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Error al guardar";
      addToast("error", msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, nombre: string) {
    if (
      !confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)
    )
      return;

    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      addToast("success", `"${nombre}" eliminado correctamente.`);
      fetchProductos();
    } catch {
      addToast("error", "No se pudo eliminar el producto.");
    }
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="container">
        <div style={{ marginBottom: "0.5rem" }}>
          <h1>Gestión de Productos</h1>
          <p className="subtitle">
            CRUD conectado a SQL Server en Windows Server 2022
          </p>
        </div>

        {/* Badge de estado de conexión */}
        <div style={{ marginBottom: "1.5rem" }}>
          <StatusBadge />
        </div>

        {/* Formulario */}
        <div className="card">
          <h2>
            {editingId
              ? `Editando producto #${editingId}`
              : "Nuevo producto"}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="Nombre">Nombre *</label>
                <input
                  id="Nombre"
                  name="Nombre"
                  type="text"
                  value={form.Nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Precio">Precio *</label>
                <input
                  id="Precio"
                  name="Precio"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.Precio}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="Stock">Stock *</label>
                <input
                  id="Stock"
                  name="Stock"
                  type="number"
                  min="0"
                  value={form.Stock}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group full-width">
                <label htmlFor="Descripcion">Descripción</label>
                <textarea
                  id="Descripcion"
                  name="Descripcion"
                  value={form.Descripcion}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                />
              </div>
            </div>

            <div className="btn-row">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Guardando..."
                  : editingId
                  ? "Actualizar"
                  : "Agregar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabla */}
        <div className="card">
          <h2>Lista de productos</h2>

          {loading ? (
            <p className="loading">Cargando...</p>
          ) : productos.length === 0 ? (
            <p className="empty">No hay productos registrados.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map((p) => (
                    <tr key={p.Id}>
                      <td>{p.Id}</td>
                      <td>{p.Nombre}</td>
                      <td>{p.Descripcion || "—"}</td>
                      <td>${Number(p.Precio).toFixed(2)}</td>
                      <td>{p.Stock}</td>
                      <td>
                        {new Date(p.FechaCreacion).toLocaleDateString(
                          "es-MX"
                        )}
                      </td>
                      <td>
                        <div className="actions">
                          <button
                            className="btn-edit"
                            onClick={() => handleEdit(p)}
                          >
                            Editar
                          </button>
                          <button
                            className="btn-delete"
                            onClick={() =>
                              handleDelete(p.Id, p.Nombre)
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
