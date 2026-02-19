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

    // Prompt muy específico para que no falle al no tener 'responseMimeType'
    const prompt = `Analiza esta imagen de factura o albarán.
    Extrae la información y responde ÚNICAMENTE con un objeto JSON siguiendo esta estructura, sin texto explicativo adicional:
    {
      "tipo": "Factura" o "Albarán",
      "empresa": "Nombre de la empresa",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número",
      "importe": 0.0,
      "iva21": 0.0,
      "irpf19": 0.0,
      "ciudad": "Ciudad",
      "tienda": "Tienda",
      "descripcion": "Resumen"
    }`;

    // Llamada simplificada: Eliminamos 'generationConfig' para evitar errores de campos desconocidos
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Google API: ${result.error?.message || "Error desconocido"}` 
      }, { status: response.status });
    }

    // Procesar la respuesta de la IA
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      let text = result.candidates[0].content.parts[0].text;
      
      // LIMPIEZA MANUAL: Gemini suele envolver el JSON en bloques de código markdown
      // Buscamos lo que hay entre la primera '{' y la última '}'
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
      }

      try {
        const jsonData = JSON.parse(text);
        return NextResponse.json(jsonData);
      } catch (e) {
        return NextResponse.json({ error: "La IA no devolvió un JSON válido", raw: text }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "No se obtuvo respuesta de la IA" }, { status: 500 });
    }

  } catch (err: any) {
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}
