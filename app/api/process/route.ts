import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "API Key no encontrada" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // CAMBIO AQUÍ: Usamos gemini-1.5-flash (sin el v1beta manual)
    // El SDK actualizado ya sabe dónde buscarlo.
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
    });

    const prompt = `Analiza esta imagen contable. Clasifica como 'Factura' o 'Albarán'.
    Devuelve ÚNICAMENTE un JSON con esta estructura:
    {
      "tipo": "Factura",
      "empresa": "Nombre",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número",
      "importe": 0.00,
      "iva21": 0.00,
      "irpf19": 0.00,
      "ciudad": "Ciudad",
      "tienda": "Tienda",
      "descripcion": "Resumen"
    }`;

    // Procesar la imagen
    const result = await model.generateContent([
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: file.type
        }
      },
      { text: prompt } // Pasamos el prompt como objeto de texto
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Limpieza de JSON
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    console.error("Error en Gemini:", err);
    // Si sigue dando 404, el error dirá exactamente qué pasó
    return NextResponse.json({ error: "Error de IA: " + err.message }, { status: 500 });
  }
}
