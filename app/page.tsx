"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, Loader2, Receipt, FileText, Trash2, AlertCircle } from "lucide-react";

export default function ExcelApp() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    setError(null);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/process", { method: "POST", body: fd });
        const json = await res.json();
        
        if (json.error) {
          setError(`Error en ${file.name}: ${json.error}`);
        } else {
          setData(prev => [...prev, json]);
        }
      } catch (err) { 
        setError("Error de conexión con la API");
      }
    }
    setLoading(false);
  };

  const downloadExcel = (tipo: string) => {
    const filtered = data.filter(d => d.tipo === tipo);
    if (filtered.length === 0) return alert("No hay datos para descargar");
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `${tipo}s.xlsx`);
  };

  return (
    <div className="p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Scanner Contable IA</h1>
          <div className="flex gap-3">
            <button onClick={() => downloadExcel("Factura")} className="bg-green-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-green-800 transition">
              <Receipt size={16}/> Descargar Facturas
            </button>
            <button onClick={() => downloadExcel("Albarán")} className="bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-blue-800 transition">
              <FileText size={16}/> Descargar Albaranes
            </button>
            <button onClick={() => setData([])} className="p-2 text-red-500 hover:bg-red-50 rounded border border-red-200"><Trash2 size={20}/></button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex items-center gap-2 text-sm">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white cursor-pointer hover:border-yellow-500 hover:bg-yellow-50 transition-all mb-8">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="animate-spin text-yellow-600 mb-2" />
              <p className="text-sm font-medium text-yellow-800">La IA está leyendo el documento...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="text-gray-400 mb-2" />
              <span className="text-gray-500 font-medium">Haz clic para subir Facturas o Albaranes</span>
              <span className="text-xs text-gray-400">Soporta JPG, PNG y WEBP</span>
            </div>
          )}
          <input type="file" multiple className="hidden" onChange={uploadFiles} disabled={loading} accept="image/*" />
        </label>

        <div className="bg-white overflow-hidden shadow-xl border border-gray-300 rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#FFD700] text-gray-900 font-bold border-b-2 border-gray-400">
                <tr>
                  <th className="px-4 py-3 border-r border-gray-400 min-w-[100px]">Tipo</th>
                  <th className="px-4 py-3 border-r border-gray-400 min-w-[150px]">Empresa</th>
                  <th className="px-4 py-3 border-r border-gray-400">Fecha</th>
                  <th className="px-4 py-3 border-r border-gray-400">Nº Doc</th>
                  <th className="px-4 py-3 border-r border-gray-400 text-right">Importe</th>
                  <th className="px-4 py-3 border-r border-gray-400 text-right">IVA 21%</th>
                  <th className="px-4 py-3 border-r border-gray-400 text-right">IRPF 19%</th>
                  <th className="px-4 py-3 border-r border-gray-400">Ciudad</th>
                  <th className="px-4 py-3 border-r border-gray-400">Tienda</th>
                  <th className="px-4 py-3">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-20 text-center text-gray-400 italic bg-gray-50">
                      Sube una imagen para ver los datos extraídos aquí...
                    </td>
                  </tr>
                ) : (
                  data.map((item, i) => (
                    <tr key={i} className="hover:bg-yellow-50 transition-colors">
                      <td className="px-4 py-2 border-r border-gray-200 font-bold text-xs uppercase">{item.tipo || "-"}</td>
                      <td className="px-4 py-2 border-r border-gray-200 font-medium">{item.empresa || "-"}</td>
                      <td className="px-4 py-2 border-r border-gray-200">{item.fecha || "-"}</td>
                      <td className="px-4 py-2 border-r border-gray-200 font-mono text-xs">{item.numFactura || "-"}</td>
                      <td className="px-4 py-2 border-r border-gray-200 text-right font-mono font-bold">{(item.importe || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}€</td>
                      <td className="px-4 py-2 border-r border-gray-200 text-right font-mono text-blue-600">{(item.iva21 || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}€</td>
                      <td className="px-4 py-2 border-r border-gray-200 text-right font-mono text-red-600">{(item.irpf19 || 0).toLocaleString('de-DE', {minimumFractionDigits: 2})}€</td>
                      <td className="px-4 py-2 border-r border-gray-200">{item.ciudad || "-"}</td>
                      <td className="px-4 py-2 border-r border-gray-200">{item.tienda || "-"}</td>
                      <td className="px-4 py-2 truncate max-w-[200px] text-gray-500">{item.descripcion || "-"}</td>
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
