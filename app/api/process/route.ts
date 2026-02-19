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

    const prompt = `Extrae los datos de esta factura/albarán. Responde ÚNICAMENTE con JSON puro:
    {
      "tipo": "Factura" | "Albarán",
      "empresa": "Nombre",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número",
      "importe": 0.0,
      "iva21": 0.0,
      "irpf19": 0.0,
      "ciudad": "Ciudad",
      "tienda": "Tienda",
      "descripcion": "Resumen"
    }`;

    // USAMOS GEMINI 2.0 FLASH EXPERIMENTAL (El más nuevo)
    // Si este falla, cambia el modelo a: gemini-1.5-flash-002
    const modelName = "gemini-2.0-flash-exp"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

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
          temperature: 0.1,
          responseMimeType: "application/json"
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Google API (${modelName}): ${result.error?.message || "No encontrado"}` 
      }, { status: response.status });
    }

    const text = result.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    return NextResponse.json({ error: "Error: " + err.message }, { status: 500 });
  }
}
