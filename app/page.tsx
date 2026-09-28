"use client";

import { useEffect, useState } from "react";
import { Producto, ProductoInput } from "@/types/producto";

const EMPTY_FORM: ProductoInput = {
  Nombre: "",
  Descripcion: "",
  Precio: 0,
  Stock: 0,
};

export default function Home() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [form, setForm] = useState<ProductoInput>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Cargar productos al iniciar
  useEffect(() => {
    fetchProductos();
  }, []);

  // Auto-ocultar alertas
  useEffect(() => {
    if (alert) {
      const t = setTimeout(() => setAlert(null), 3500);
      return () => clearTimeout(t);
    }
  }, [alert]);

  async function fetchProductos() {
    setLoading(true);
    try {
      const res = await fetch("/api/productos");
      if (!res.ok) throw new Error("Error al cargar");
      const data = await res.json();
      setProductos(data);
    } catch {
      setAlert({ type: "error", msg: "No se pudieron cargar los productos." });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
      setAlert({ type: "error", msg: "El nombre es requerido." });
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/productos/${editingId}` : "/api/productos";
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

      setAlert({
        type: "success",
        msg: editingId ? "Producto actualizado." : "Producto creado exitosamente.",
      });
      handleCancel();
      fetchProductos();
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Error al guardar";
      setAlert({ type: "error", msg });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number, nombre: string) {
    if (!confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;

    try {
      const res = await fetch(`/api/productos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Error al eliminar");
      setAlert({ type: "success", msg: `"${nombre}" eliminado correctamente.` });
      fetchProductos();
    } catch {
      setAlert({ type: "error", msg: "No se pudo eliminar el producto." });
    }
  }

  return (
    <div className="container">
      <h1>📦 Gestión de Productos</h1>
      <p className="subtitle">CRUD conectado a SQL Server en Windows Server 2022</p>

      {alert && (
        <div className={`alert alert-${alert.type}`}>{alert.msg}</div>
      )}

      {/* Formulario */}
      <div className="card">
        <h2>{editingId ? `✏️ Editando producto #${editingId}` : "➕ Nuevo producto"}</h2>
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
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : editingId ? "Actualizar" : "Agregar"}
            </button>
            {editingId && (
              <button type="button" className="btn-secondary" onClick={handleCancel}>
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Tabla */}
      <div className="card">
        <h2>📋 Lista de productos</h2>

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
                    <td>{new Date(p.FechaCreacion).toLocaleDateString("es-MX")}</td>
                    <td>
                      <div className="actions">
                        <button className="btn-edit" onClick={() => handleEdit(p)}>
                          Editar
                        </button>
                        <button className="btn-delete" onClick={() => handleDelete(p.Id, p.Nombre)}>
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
  );
}
