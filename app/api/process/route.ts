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

    const prompt = `Analiza esta imagen. Extrae los datos y clasifica como 'Factura' o 'Albarán'.
    Devuelve ÚNICAMENTE un JSON:
    {
      "tipo": "Factura" o "Albarán",
      "empresa": "Nombre", "fecha": "DD/MM/YYYY", "numFactura": "Número",
      "importe": 0.00, "iva21": 0.00, "irpf19": 0.00,
      "ciudad": "Ciudad", "tienda": "Tienda", "descripcion": "Resumen"
    }`;

    const result = await model.generateContent([
      prompt,
      { inlineData: { data: buffer.toString("base64"), mimeType: file.type } }
    ]);

    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(text));
  } catch (err) {
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
