import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analiza esta imagen de factura o albarán. 
    Extrae los datos y clasifica. Devuelve ÚNICAMENTE un objeto JSON puro, sin bloques de código markdown, con esta estructura exacta:
    {
      "tipo": "Factura" o "Albarán",
      "empresa": "string",
      "fecha": "string (DD/MM/YYYY)",
      "numFactura": "string",
      "importe": number (total con decimales),
      "iva21": number (cuota de iva),
      "irpf19": number (cuota de irpf),
      "ciudad": "string",
      "tienda": "string",
      "descripcion": "string"
    }
    Si un campo no existe o no se ve, pon null o 0 para números. No inventes datos.`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString("base64"), mimeType: file.type } }
    ]);

    let text = result.response.text();
    
    // LIMPIEZA EXTREMA: Eliminar markdown si la IA lo incluyó
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      const jsonData = JSON.parse(text);
      return NextResponse.json(jsonData);
    } catch (parseError) {
      console.error("Error parseando JSON de Gemini:", text);
      return NextResponse.json({ error: "La IA no devolvió un formato válido", raw: text }, { status: 500 });
    }

  } catch (err: any) {
    console.error("Error en API:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
