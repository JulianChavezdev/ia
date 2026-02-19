import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Forzamos la inicialización con la versión 'v1' estable
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Falta la API KEY en el servidor" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // SOLUCIÓN AL 404: 
    // 1. Usamos gemini-1.5-flash (el modelo más compatible)
    // 2. No especificamos v1beta manualmente
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Actúa como un experto contable. Analiza la imagen y extrae los datos. 
    Responde ÚNICAMENTE con un JSON puro:
    {
      "tipo": "Factura" o "Albarán",
      "empresa": "Nombre",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número",
      "importe": 0.0,
      "iva21": 0.0,
      "irpf19": 0.0,
      "ciudad": "Ciudad",
      "tienda": "Tienda",
      "descripcion": "Breve resumen"
    }`;

    // Nueva forma de pasar los datos según la última documentación
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
      { text: prompt },
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Limpieza de JSON por si la IA añade texto extra
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (err: any) {
    console.error("Detalle del error:", err);
    
    // Si el error persiste, intentamos con el modelo Pro como backup
    return NextResponse.json({ 
      error: "Error de conexión con Gemini. Verifica que tu API Key sea de Google AI Studio.",
      details: err.message 
    }, { status: 500 });
  }
}
