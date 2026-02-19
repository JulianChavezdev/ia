"use client";
import React, { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileDown, Loader2, Receipt, FileText, Trash2 } from "lucide-react";

export default function ExcelApp() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const uploadFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setLoading(true);
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/process", { method: "POST", body: fd });
        const json = await res.json();
        setData(prev => [...prev, json]);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  };

  const downloadExcel = (tipo: string) => {
    const filtered = data.filter(d => d.tipo === tipo);
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, tipo);
    XLSX.writeFile(wb, `${tipo}s.xlsx`);
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Facturación IA</h1>
          <div className="flex gap-3">
            <button onClick={() => downloadExcel("Factura")} className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded text-sm"><Receipt size={16}/> Descargar Facturas</button>
            <button onClick={() => downloadExcel("Albarán")} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded text-sm"><FileText size={16}/> Descargar Albaranes</button>
            <button onClick={() => setData([])} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 size={20}/></button>
          </div>
        </div>

        <label className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center bg-white cursor-pointer hover:border-yellow-500 mb-8">
          {loading ? <Loader2 className="animate-spin text-yellow-600" /> : <Upload className="text-gray-400 mb-2" />}
          <span className="text-gray-500">Subir documentos (JPG/PNG)</span>
          <input type="file" multiple className="hidden" onChange={uploadFiles} disabled={loading} />
        </label>

        <div className="overflow-x-auto shadow-xl border border-gray-300 rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-[#FFD700] text-black font-bold border-b-2 border-gray-400">
              <tr>
                {["Tipo", "Empresa", "Fecha", "Nº Factura", "Importe", "IVA 21%", "IRPF 19%", "Ciudad", "Tienda", "Descripción"].map(h => (
                  <th key={h} className="px-4 py-3 border-r border-gray-400 last:border-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {data.length === 0 ? (
                <tr><td colSpan={10} className="p-10 text-center text-gray-400">Ningún dato procesado</td></tr>
              ) : (
                data.map((item, i) => (
                  <tr key={i} className="border-b border-gray-200 hover:bg-yellow-50">
                    <td className="px-4 py-2 border-r border-gray-200 font-bold">{item.tipo}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.empresa}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.fecha}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.numFactura}</td>
                    <td className="px-4 py-2 border-r border-gray-200 text-right font-mono">{item.importe}€</td>
                    <td className="px-4 py-2 border-r border-gray-200 text-right font-mono">{item.iva21}€</td>
                    <td className="px-4 py-2 border-r border-gray-200 text-right font-mono">{item.irpf19}€</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.ciudad}</td>
                    <td className="px-4 py-2 border-r border-gray-200">{item.tienda}</td>
                    <td className="px-4 py-2 truncate max-w-[150px]">{item.descripcion}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
