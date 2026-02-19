"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Loader2, Receipt, FileText, Trash2, Download } from "lucide-react";

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/process", { method: "POST", body: fd });
        const data = await res.json();
        if (!data.error) setItems(prev => [...prev, data]);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  };

  const exportExcel = (tipo: string) => {
    const filtered = items.filter(i => i.tipo === tipo);
    if (filtered.length === 0) return alert(`No hay ${tipo}s para descargar`);
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `${tipo}s.xlsx`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Scanner Pro IA</h1>
            <p className="text-slate-500">Extracción con Gemini 2.0 Flash</p>
          </div>
          
          <div className="flex gap-2">
            <button onClick={() => exportExcel("Factura")} className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition shadow-sm">
              <Receipt size={18}/> Excel Facturas
            </button>
            <button onClick={() => exportExcel("Albarán")} className="flex items-center gap-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg text-sm transition shadow-sm">
              <FileText size={18}/> Excel Albaranes
            </button>
            <button onClick={() => setItems([])} className="p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-100 transition"><Trash2 size={20}/></button>
          </div>
        </div>

        {/* Zona Dropzone */}
        <label className="group relative mb-8 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-2xl cursor-pointer bg-white hover:bg-yellow-50 hover:border-yellow-400 transition-all">
          <div className="flex flex-col items-center justify-center">
            {loading ? (
              <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-slate-400 group-hover:text-yellow-500 transition-colors" />
            )}
            <p className="mt-2 text-sm text-slate-600 font-medium">
              {loading ? "La IA está trabajando..." : "Arrastra tus facturas aquí o haz clic"}
            </p>
          </div>
          <input type="file" className="hidden" multiple accept="image/*" onChange={onUpload} disabled={loading} />
        </label>

        {/* Tabla Excel Style */}
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-[#FFD700] text-slate-900 uppercase font-black text-[11px] tracking-wider border-b-2 border-slate-300">
                  <th className="px-4 py-4 border-r border-slate-300">Tipo</th>
                  <th className="px-4 py-4 border-r border-slate-300">Empresa</th>
                  <th className="px-4 py-4 border-r border-slate-300">Fecha</th>
                  <th className="px-4 py-4 border-r border-slate-300">Nº Doc</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">Importe</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">IVA 21%</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">IRPF 19%</th>
                  <th className="px-4 py-4 border-r border-slate-300">Ciudad</th>
                  <th className="px-4 py-4 border-r border-slate-300">Tienda</th>
                  <th className="px-4 py-4">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-20 text-center text-slate-400 italic bg-slate-50/50">
                      Esperando documentos para procesar...
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50/50 transition-colors font-medium">
                      <td className="px-4 py-3 border-r border-slate-100 italic text-slate-500 text-xs uppercase">{item.tipo}</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-slate-900">{item.empresa}</td>
                      <td className="px-4 py-3 border-r border-slate-100">{item.fecha}</td>
                      <td className="px-4 py-3 border-r border-slate-100 font-mono text-xs">{item.numFactura}</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right font-bold text-slate-900">{item.importe?.toFixed(2)}€</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right text-blue-600">{(item.iva21 || 0).toFixed(2)}€</td>
                      <td className="px-4 py-3 border-r border-slate-100 text-right text-red-600">{(item.irpf19 || 0).toFixed(2)}€</td>
                      <td className="px-4 py-3 border-r border-slate-100">{item.ciudad}</td>
                      <td className="px-4 py-3 border-r border-slate-100">{item.tienda}</td>
                      <td className="px-4 py-3 truncate max-w-[200px] text-slate-500">{item.descripcion}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
