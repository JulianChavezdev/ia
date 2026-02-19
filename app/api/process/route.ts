import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Usamos la variable sin el prefijo NEXT_PUBLIC para mayor seguridad en el servidor
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export async function POST(req: Request) {
  try {
    // Verificación de seguridad rápida
    if (!apiKey || apiKey === "") {
      return NextResponse.json({ error: "API Key no configurada en el servidor" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `Analiza esta imagen. Extrae los datos y clasifica como 'Factura' o 'Albarán'.
    Devuelve ÚNICAMENTE un JSON:
    {
      "tipo": "Factura" | "Albarán",
      "empresa": "Nombre", "fecha": "DD/MM/YYYY", "numFactura": "Número",
      "importe": 0.00, "iva21": 0.00, "irpf19": 0.00,
      "ciudad": "string", "tienda": "string", "descripcion": "string"
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString("base64"), mimeType: file.type } }
    ]);

    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (err: any) {
    console.error("Error detallado:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
