"use client";
import React, { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { 
  Upload, Loader2, Receipt, FileText, Trash2, 
  Database, FileUp, AlertCircle, TrendingUp
} from "lucide-react";

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onUpload = async (e: any) => {
    e.preventDefault();
    const files = e.target.files || e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    setLoading(true);
    for (const file of Array.from(files) as File[]) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/process", { method: "POST", body: fd });
        const data = await res.json();
        if (!data.error) {
          setItems(prev => [data, ...prev]);
        }
      } catch (err) {
        console.error("Error subiendo archivo:", err);
      }
    }
    setLoading(false);
  };

  const exportPrettyExcel = async (tipo: string) => {
    const filtered = items.filter(i => i.tipo === tipo);
    if (filtered.length === 0) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(tipo);

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

    const headerRow = worksheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD700' } };
      cell.font = { bold: true, size: 12 };
      cell.alignment = { horizontal: 'center' };
      cell.border = { top: {style:'thin'}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
    });

    filtered.forEach(item => {
      const row = worksheet.addRow(item);
      row.getCell('importe').numFmt = '#,##0.00€';
      row.getCell('iva21').numFmt = '#,##0.00€';
      row.getCell('irpf19').numFmt = '#,##0.00€';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `${tipo}s_${new Date().toLocaleDateString()}.xlsx`);
  };

  const totalImporte = items.reduce((acc, curr) => acc + (Number(curr.importe) || 0), 0);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-10">
      {/* NAVEGACIÓN */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-2 rounded-xl shadow-inner">
              <Database size={20} className="text-slate-900" />
            </div>
            <h1 className="font-black text-xl tracking-tighter hidden sm:block">SCANNER<span className="text-yellow-500">PRO</span></h1>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => exportPrettyExcel("Factura")}
              disabled={!items.some(i => i.tipo === "Factura")}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 disabled:opacity-30 transition-all shadow-lg"
            >
              <Receipt size={14}/> <span className="hidden md:inline">FACTURAS</span>
            </button>
            <button 
              onClick={() => exportPrettyExcel("Albarán")}
              disabled={!items.some(i => i.tipo === "Albarán")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-lg"
            >
              <FileText size={14}/> <span className="hidden md:inline">ALBARANES</span>
            </button>
            {items.length > 0 && (
              <button onClick={() => setItems([])} className="ml-2 p-2 text-red-500 hover:bg-red-50 rounded-full transition">
                <Trash2 size={20}/>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* RESUMEN DASHBOARD */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Procesados", val: items.length, color: "text-slate-900" },
            { label: "Facturas", val: items.filter(i => i.tipo === "Factura").length, color: "text-yellow-600" },
            { label: "Albaranes", val: items.filter(i => i.tipo === "Albarán").length, color: "text-indigo-600" },
            { label: "Total €", val: `€${totalImporte.toLocaleString()}`, color: "text-green-600" }
          ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">{stat.label}</p>
              <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
            </div>
          ))}
        </div>

        {/* CARGADOR DE ARCHIVOS */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); onUpload(e); }}
          className={`
            relative mb-8 flex flex-col items-center justify-center w-full h-52 
            border-2 border-dashed rounded-[2.5rem] transition-all duration-500
            ${dragActive ? 'border-yellow-400 bg-yellow-50 scale-[1.02]' : 'border-slate-300 bg-white hover:border-indigo-400 shadow-sm'}
          `}
        >
          <input 
            type="file" multiple accept="image/*,application/pdf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onUpload}
            disabled={loading}
          />
          
          <div className="flex flex-col items-center pointer-events-none px-6 text-center">
            <div className={`p-5 rounded-full mb-4 transition-transform duration-500 ${loading ? 'bg-yellow-100 animate-pulse scale-110' : 'bg-slate-50'}`}>
              {loading ? (
                <Loader2 className="h-10 w-10 text-yellow-600 animate-spin" />
              ) : (
                <FileUp className="h-10 w-10 text-slate-400" />
              )}
            </div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-tight">
              {loading ? "Analizando documentos con IA..." : "Toca o arrastra tus Facturas/PDF"}
            </p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Soporta múltiples archivos JPG, PNG y PDF</p>
          </div>
        </div>

        {/* TABLA DE RESULTADOS */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 border border-slate-200 overflow-hidden mb-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FFD700] text-slate-900 uppercase font-black text-[10px] tracking-[0.2em] border-b-2 border-slate-300">
                  <th className="px-6 py-5 border-r border-slate-300/30">Empresa</th>
                  <th className="px-6 py-5 border-r border-slate-300/30">Fecha</th>
                  <th className="px-6 py-5 border-r border-slate-300/30">Nº Documento</th>
                  <th className="px-6 py-5 border-r border-slate-300/30 text-right">Importe</th>
                  <th className="px-6 py-5 border-r border-slate-300/30">Tipo</th>
                  <th className="px-6 py-5">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center">
                      <div className="flex flex-col items-center text-slate-300">
                        <AlertCircle size={40} className="mb-3 opacity-20" />
                        <p className="font-black uppercase tracking-widest text-xs opacity-40">Bandeja de entrada vacía</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 border-r border-slate-100 font-black text-slate-800">{item.empresa || '---'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 whitespace-nowrap font-medium text-slate-500">{item.fecha || '---'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 font-mono text-xs font-bold text-indigo-600">{item.numFactura || '---'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 text-right font-black text-slate-900">
                        {item.importe ? `€${Number(item.importe).toFixed(2)}` : '€0.00'}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black tracking-tighter ${
                          item.tipo === 'Factura' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 truncate max-w-[250px]">
                        {item.descripcion || 'Sin detalles extraídos'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
