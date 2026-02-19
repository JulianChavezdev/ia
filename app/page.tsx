"use client";
import React, { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver"; // Si no lo tienes: npm install file-saver
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

  const exportPrettyExcel = async (tipo: string) => {
    const filtered = items.filter(i => i.tipo === tipo);
    if (filtered.length === 0) return alert(`No hay ${tipo}s`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipo);

    // Definir Columnas
    worksheet.columns = [
      { header: "EMPRESA", key: "empresa", width: 25 },
      { header: "FECHA", key: "fecha", width: 15 },
      { header: "Nº DOCUMENTO", key: "numFactura", width: 20 },
      { header: "IMPORTE TOTAL", key: "importe", width: 15 },
      { header: "IVA 21%", key: "iva21", width: 12 },
      { header: "IRPF 19%", key: "irpf19", width: 12 },
      { header: "CIUDAD", key: "ciudad", width: 15 },
      { header: "TIENDA", key: "tienda", width: 20 },
      { header: "DESCRIPCIÓN", key: "descripcion", width: 40 },
    ];

    // Estilo de la Cabecera (AMARILLO ESTILO EXCEL)
    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD700' } // Color Amarillo solicitado
      };
      cell.font = { bold: true, color: { argb: '000000' }, size: 12 };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    // Añadir Datos
    filtered.forEach(item => {
      const row = worksheet.addRow(item);
      // Formato numérico para importes
      row.getCell('importe').numFmt = '#,##0.00€';
      row.getCell('iva21').numFmt = '#,##0.00€';
      row.getCell('irpf19').numFmt = '#,##0.00€';
    });

    // Generar y Descargar
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    // Función simple de descarga
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tipo}s_${new Date().getTime()}.xlsx`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Scanner Contable <span className="text-yellow-500 text-sm">PRO</span></h1>
          <div className="flex gap-2">
            <button onClick={() => exportPrettyExcel("Factura")} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-green-700 transition">
              <Download size={14}/> EXCEL FACTURAS
            </button>
            <button onClick={() => exportPrettyExcel("Albarán")} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs hover:bg-blue-700 transition">
              <Download size={14}/> EXCEL ALBARANES
            </button>
            <button onClick={() => setItems([])} className="p-2 text-red-500 hover:bg-red-50 rounded transition"><Trash2 size={20}/></button>
          </div>
        </div>

        {/* Zona de Carga mejorada (Acepta PDF) */}
        <label className="mb-10 flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer bg-white hover:border-yellow-400 hover:bg-yellow-50 transition-all">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {loading ? <Loader2 className="h-10 w-10 text-yellow-500 animate-spin" /> : <Upload className="h-10 w-10 text-slate-400" />}
            <p className="mt-2 text-sm text-slate-500 uppercase font-bold tracking-widest">
              {loading ? "Leyendo Documento..." : "Subir Factura o Albarán (PDF / Imagen)"}
            </p>
          </div>
          <input type="file" className="hidden" multiple accept="image/*,application/pdf" onChange={onUpload} disabled={loading} />
        </label>

        {/* Tabla con el mismo estilo del Excel */}
        <div className="bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FFD700] text-slate-900 uppercase font-bold border-b-2 border-slate-300">
                <tr>
                  <th className="px-4 py-4 border-r border-slate-300">Tipo</th>
                  <th className="px-4 py-4 border-r border-slate-300">Empresa</th>
                  <th className="px-4 py-4 border-r border-slate-300">Fecha</th>
                  <th className="px-4 py-4 border-r border-slate-300">Nº Doc</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">Importe</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">IVA 21%</th>
                  <th className="px-4 py-4 border-r border-slate-300 text-right">IRPF 19%</th>
                  <th className="px-4 py-4">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-20 text-center text-slate-400 font-medium">No se han procesado documentos...</td></tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-yellow-50/30 transition-colors">
                      <td className="px-4 py-3 border-r font-black text-[10px] text-slate-400">{item.tipo}</td>
                      <td className="px-4 py-3 border-r font-bold text-slate-700">{item.empresa}</td>
                      <td className="px-4 py-3 border-r">{item.fecha}</td>
                      <td className="px-4 py-3 border-r font-mono text-xs">{item.numFactura}</td>
                      <td className="px-4 py-3 border-r text-right font-bold">{item.importe?.toFixed(2)}€</td>
                      <td className="px-4 py-3 border-r text-right text-blue-600">{item.iva21?.toFixed(2)}€</td>
                      <td className="px-4 py-3 border-r text-right text-red-600">{item.irpf19?.toFixed(2)}€</td>
                      <td className="px-4 py-3 truncate max-w-[200px]">{item.descripcion}</td>
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
