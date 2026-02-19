import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) return NextResponse.json({ error: "Falta API KEY" }, { status: 500 });

    // 1. PRIMERO: Vamos a pedirle a Google que nos diga qué modelos puedes usar
    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;
    const listRes = await fetch(listUrl);
    const listData = await listRes.json();

    if (!listRes.ok) {
      return NextResponse.json({ 
        error: "Tu API Key no funciona o la API no está habilitada.",
        details: listData.error?.message 
      }, { status: 401 });
    }

    // 2. BUSCAR EL MEJOR MODELO DISPONIBLE
    // Buscamos gemini-1.5-flash o cualquier gemini en tu lista
    const availableModels = listData.models.map((m: any) => m.name.replace("models/", ""));
    const modelToUse = availableModels.find((m: string) => m.includes("gemini-1.5-flash")) || availableModels[0];

    console.log("Modelos disponibles:", availableModels);
    console.log("Usando modelo:", modelToUse);

    // 3. PROCESAR LA IMAGEN
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");

    const prompt = `Analiza esta imagen y devuelve SOLO un JSON:
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

    const genUrl = `https://generativelanguage.googleapis.com/v1/models/${modelToUse}:generateContent?key=${apiKey}`;

    const response = await fetch(genUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inlineData: { mimeType: file.type || "image/jpeg", data: base64Data } }
          ]
        }]
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json({ 
        error: `Error al generar contenido con ${modelToUse}`,
        details: result.error?.message 
      }, { status: response.status });
    }

    const text = result.candidates[0].content.parts[0].text;
    const cleanJson = text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1);
    
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (err: any) {
    return NextResponse.json({ error: "Fallo: " + err.message }, { status: 500 });
  }
}
