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

    const prompt = `Analiza la imagen. Extrae datos y clasifica como 'Factura' o 'Albarán'.
    Responde ÚNICAMENTE con un JSON puro:
    {
      "tipo": "Factura",
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

    // Volvemos a gemini-1.5-flash para mayor estabilidad de cuota
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Si el error es 429, enviamos un mensaje amigable
      if (response.status === 429) {
        return NextResponse.json({ error: "Límite de Google alcanzado. Espera 60 segundos y vuelve a intentar." }, { status: 429 });
      }
      return NextResponse.json({ error: result.error?.message || "Error en Google API" }, { status: response.status });
    }

    const text = result.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}
