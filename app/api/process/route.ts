import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "Falta API KEY" }, { status: 500 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    // Autodetectar modelo disponible
    const listRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listRes.json();
    const foundModel = listData.models?.find((m: any) => 
      m.name.includes("gemini") && m.supportedGenerationMethods.includes("generateContent")
    );
    const modelToUse = foundModel?.name || "models/gemini-1.5-flash";

    const prompt = `Analiza este documento (puede ser imagen o PDF). Extrae los datos y clasifica como 'Factura' o 'Albarán'.
    Responde ÚNICAMENTE con JSON puro:
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

    const genUrl = `https://generativelanguage.googleapis.com/v1beta/${modelToUse}:generateContent?key=${apiKey}`;

    const response = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type, data: base64Data } }
          ]
        }]
      })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error?.message);

    let text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
o

