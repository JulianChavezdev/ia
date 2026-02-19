import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Falta la API KEY en Vercel" }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No hay archivo" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `Analiza esta imagen y extrae los datos. Clasifica como 'Factura' o 'Albarán'.
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

    // LLAMADA CORREGIDA: Usando camelCase (responseMimeType, inlineData, mimeType)
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
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Error de Google: ${result.error?.message || "Error desconocido"}`
      }, { status: response.status });
    }

    // Extraer el texto de la respuesta
    if (result.candidates && result.candidates[0].content.parts[0].text) {
      const textContent = result.candidates[0].content.parts[0].text;
      return NextResponse.json(JSON.parse(textContent));
    } else {
      throw new Error("La IA no devolvió datos válidos");
    }

  } catch (err: any) {
    console.error("Error crítico:", err);
    return NextResponse.json({ error: "Error interno: " + err.message }, { status: 500 });
  }
}
