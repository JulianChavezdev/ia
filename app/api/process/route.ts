import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Falta API KEY en Vercel" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `Analiza esta imagen. Extrae los datos y clasifica como 'Factura' o 'Albarán'.
    Responde ÚNICAMENTE con un JSON puro con esta estructura:
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

    // CAMBIO CLAVE: Usamos v1beta y el modelo gemini-1.5-flash
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: file.type || "image/jpeg",
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // Si falla, intentamos dar un mensaje muy claro
      return NextResponse.json({ 
        error: `Google dice: ${result.error?.message || "Error desconocido"}` 
      }, { status: response.status });
    }

    if (result.candidates && result.candidates[0].content.parts[0].text) {
      let text = result.candidates[0].content.parts[0].text;
      
      // Limpiar el texto para obtener solo el JSON
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        text = text.substring(start, end + 1);
      }

      return NextResponse.json(JSON.parse(text));
    } else {
      return NextResponse.json({ error: "La IA no pudo leer la imagen correctamente" }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}
