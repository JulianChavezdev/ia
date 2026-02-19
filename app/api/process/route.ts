import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta API KEY" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // PROMPT OPTIMIZADO PARA GEMINI 2.0 FLASH
    const prompt = `Analiza detalladamente esta imagen. Clasifica como 'Factura' o 'Albarán'.
    Extrae los datos y responde ÚNICAMENTE con un JSON puro con este formato:
    {
      "tipo": "Factura",
      "empresa": "Nombre legal",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número de documento",
      "importe": 0.00,
      "iva21": 0.00,
      "irpf19": 0.00,
      "ciudad": "Ciudad",
      "tienda": "Nombre comercial",
      "descripcion": "Resumen de lo comprado"
    }`;

    // Usamos el modelo más nuevo: gemini-2.0-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: result.error?.message || "Error en Google API" }, { status: response.status });
    }

    const text = result.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}
