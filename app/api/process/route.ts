import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "No API Key" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // Detección de modelos para evitar errores regionales
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    const model = listData.models?.find((m: any) => m.name.includes("gemini-1.5-flash"))?.name || "models/gemini-1.5-flash";

    const prompt = `Analiza este documento (PDF o imagen). Clasifica como 'Factura' o 'Albarán' y extrae los datos. 
    Responde ÚNICAMENTE con JSON puro:
    {
      "tipo": "Factura" | "Albarán",
      "empresa": "Nombre",
      "fecha": "DD/MM/YYYY",
      "numFactura": "Número",
      "importe": number,
      "iva21": number,
      "irpf19": number,
      "ciudad": "Ciudad",
      "tienda": "Tienda",
      "descripcion": "Resumen"
    }`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/${model}:generateContent?key=${apiKey}`, {
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
    const text = result.candidates[0].content.parts[0].text;
    return NextResponse.json(JSON.parse(text));

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
