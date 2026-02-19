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

    // CAMBIO CLAVE: Usamos 'v1' (estable) y 'gemini-1.5-flash-latest'
    // Esta combinación es la más robusta para evitar el error 404
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

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
          // Eliminamos responseMimeType aquí porque algunas regiones de v1 no lo soportan aún
          // Lo limpiaremos manualmente abajo
          temperature: 0.1,
        }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Google API (${response.status}): ${result.error?.message || "Error desconocido"}` 
      }, { status: response.status });
    }

    // Limpieza manual del JSON por si acaso
    let text = result.candidates[0].content.parts[0].text;
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }

    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}

