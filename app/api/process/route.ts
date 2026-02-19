import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: "La API KEY no está configurada o es demasiado corta." }, { status: 500 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `Extrae datos de la imagen y responde SOLO JSON:
    {
      "tipo": "Factura" o "Albarán",
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

    // MODELO "8B": Es el que tiene mayor disponibilidad global y menos restricciones.
    const model = "gemini-1.5-flash-8b";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }, { inlineData: { mimeType: file.type || "image/jpeg", data: base64Data } }]
        }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      // ESTO TE DIRÁ EL ERROR REAL
      console.error("DEBUG GOOGLE:", JSON.stringify(result));
      return NextResponse.json({ 
        error: `Error de Google: ${result.error?.message || "Error desconocido"}`,
        reason: result.error?.status || "Sin estado"
      }, { status: response.status });
    }

    if (result.candidates && result.candidates[0].content.parts[0].text) {
      let text = result.candidates[0].content.parts[0].text;
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const json = JSON.parse(text.substring(start, end + 1));
      return NextResponse.json(json);
    }

    return NextResponse.json({ error: "La IA no devolvió texto" }, { status: 500 });

  } catch (err: any) {
    return NextResponse.json({ error: "Fallo crítico: " + err.message }, { status: 500 });
  }
}
