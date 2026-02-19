"use client";
import React, { useState } from "react";
import ExcelJS from "exceljs";
import { 
  Upload, Loader2, Receipt, FileText, Trash2, 
  Download, FileUp, Database, CheckCircle2, AlertCircle, Menu
} from "lucide-react";

export default function App() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const onUpload = async (e: any) => {
    const files = e.target.files || e.dataTransfer.files;
    if (!files) return;
    setLoading(true);
    
    for (const file of Array.from(files) as File[]) {
      const fd = new FormData();
      fd.append("file", file);
      try {
        const res = await fetch("/api/process", { method: "POST", body: fd });
        const data = await res.json();
        if (!data.error) setItems(prev => [data, ...prev]);
      } catch (err) { console.error(err); }
    }
    setLoading(false);
  };

  const exportExcel = async (tipo: string) => {
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
      cell.font = { bold: true };
      cell.alignment = { horizontal: 'center' };
    });

    filtered.forEach(item => {
      const row = worksheet.addRow(item);
      row.getCell('importe').numFmt = '#,##0.00€';
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${tipo}s_${new Date().toLocaleDateString()}.xlsx`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans pb-20">
      {/* HEADER DINÁMICO */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-400 p-2 rounded-lg">
              <Database size={20} className="text-slate-900" />
            </div>
            <h1 className="font-bold text-lg tracking-tight hidden sm:block">SCANNER <span className="text-yellow-500 text-xs">AI</span></h1>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={() => exportExcel("Factura")}
              disabled={!items.some(i => i.tipo === "Factura")}
              className="flex items-center gap-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-slate-800 disabled:opacity-30 transition-all shadow-sm"
            >
              <Receipt size={14}/> <span className="hidden md:inline">FACTURAS</span>
            </button>
            <button 
              onClick={() => exportExcel("Albarán")}
              disabled={!items.some(i => i.tipo === "Albarán")}
              className="flex items-center gap-2 bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-sm"
            >
              <FileText size={14}/> <span className="hidden md:inline">ALBARANES</span>
            </button>
            {items.length > 0 && (
              <button onClick={() => setItems([])} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={20}/>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 mt-8">
        {/* DASHBOARD SIMPLE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Procesado</p>
            <p className="text-2xl font-black">{items.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Facturas</p>
            <p className="text-2xl font-black text-yellow-600">{items.filter(i => i.tipo === "Factura").length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Albaranes</p>
            <p className="text-2xl font-black text-indigo-600">{items.filter(i => i.tipo === "Albarán").length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Importe</p>
            <p className="text-2xl font-black">€{items.reduce((acc, curr) => acc + (curr.importe || 0), 0).toFixed(0)}</p>
          </div>
        </div>

        {/* DROPZONE MEJORADA */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => { e.preventDefault(); setDragActive(false); onUpload(e); }}
          className={`
            relative group mb-8 flex flex-col items-center justify-center w-full h-48 
            border-2 border-dashed rounded-3xl transition-all duration-300
            ${dragActive ? 'border-yellow-400 bg-yellow-50 scale-[1.01]' : 'border-slate-300 bg-white hover:border-indigo-400'}
          `}
        >
          <input 
            type="file" multiple accept="image/*,application/pdf" 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            onChange={onUpload}
            disabled={loading}
          />
          
          <div className="flex flex-col items-center pointer-events-none">
            <div className={`p-4 rounded-full mb-3 transition-colors ${loading ? 'bg-yellow-100' : 'bg-slate-100 group-hover:bg-indigo-100'}`}>
              {loading ? (
                <Loader2 className="h-8 w-8 text-yellow-600 animate-spin" />
              ) : (
                <FileUp className="h-8 w-8 text-slate-500 group-hover:text-indigo-600" />
              )}
            </div>
            <p className="text-sm font-bold text-slate-700">
              {loading ? "INTELIGENCIA ARTIFICIAL PROCESANDO..." : "TOCA PARA SUBIR O ARRASTRA ARCHIVOS"}
            </p>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-tighter">Soporta Imágenes y PDF</p>
          </div>
        </div>

        {/* TABLA RESPONSIVA TIPO EXCEL PRO */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-[#FFD700] text-slate-900 uppercase font-black text-[10px] tracking-widest border-b border-slate-300">
                  <th className="px-6 py-4 border-r border-slate-300/30">Empresa</th>
                  <th className="px-6 py-4 border-r border-slate-300/30">Fecha</th>
                  <th className="px-6 py-4 border-r border-slate-300/30">Nº Doc</th>
                  <th className="px-6 py-4 border-r border-slate-300/30 text-right">Importe</th>
                  <th className="px-6 py-4 border-r border-slate-300/30 text-right">IVA 21%</th>
                  <th className="px-6 py-4 border-r border-slate-300/30">Tipo</th>
                  <th className="px-6 py-4">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center opacity-20">
                        <AlertCircle size={48} />
                        <p className="mt-2 font-bold uppercase tracking-widest">Sin documentos procesados</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 border-r border-slate-100 font-bold text-slate-800">{item.empresa || '-'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 whitespace-nowrap">{item.fecha || '-'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 font-mono text-xs">{item.numFactura || '-'}</td>
                      <td className="px-6 py-4 border-r border-slate-100 text-right font-black">
                        {item.importe ? `€${item.importe.toLocaleString()}` : '-'}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-100 text-right text-slate-500">
                        {item.iva21 ? `€${item.iva21.toFixed(2)}` : '€0.00'}
                      </td>
                      <td className="px-6 py-4 border-r border-slate-100">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase ${
                          item.tipo === 'Factura' ? 'bg-yellow-100 text-yellow-700' : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {item.tipo}
                        </span>
                      </td>
                      <td className="px-6 py-4 truncate max-w-[200px] text-slate-500 italic text-xs">
                        {item.descripcion || 'Sin descripción'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </tbody>
    </div>
  );
}
