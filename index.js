// index.js - Archivo principal para Vercel
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const OpenAI = require('openai');

const app = express();

// Variables de entorno
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || 'b1817dc74fe314e2f';

// Debug
console.log('🚀 Iniciando servidor SMART...');
console.log('🔍 Variables configuradas:');
console.log('NOTION_TOKEN:', NOTION_TOKEN ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('NOTION_DATABASE_ID:', NOTION_DATABASE_ID ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('OPENAI_API_KEY:', OPENAI_API_KEY ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'Definido ✅' : 'UNDEFINED ❌');

// Configurar clientes
const notion = new Client({ auth: NOTION_TOKEN });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Función para Google Search
async function performGoogleSearch(query) {
  try {
    if (!GOOGLE_API_KEY) {
      throw new Error('Google API Key no configurada');
    }
    
    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=5`;
    const response = await fetch(searchUrl);
    
    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const relevantInfo = data.items.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
      
      const searchResults = relevantInfo.map(item => 
        `Título: ${item.title}\nDescripción: ${item.snippet}\nFuente: ${item.link}`
      ).join('\n\n');
      
      return { 
        success: true, 
        results: searchResults,
        query: query
      };
    } else {
      return { 
        success: true, 
        results: 'No se encontraron resultados específicos en la búsqueda web.',
        query: query
      };
    }
  } catch (error) {
    return { 
      success: false, 
      results: `Error en búsqueda web: ${error.message}`,
      query: query
    };
  }
}

// Función para generar brief del cliente
async function generateClientBrief(clientName) {
  try {
    const searchQuery = `"${clientName}" empresa México industry sector size revenue empleados`;
    let searchResults = '';
    
    try {
      const searchData = await performGoogleSearch(searchQuery);
      searchResults = searchData.results || '';
    } catch (searchError) {
      searchResults = `Información limitada disponible para ${clientName}.`;
    }
    
    const prompt = `
Eres un analista de inteligencia empresarial especializado en generar briefs ejecutivos informativos.

CLIENTE A INVESTIGAR: "${clientName}"

INFORMACIÓN DE BÚSQUEDA WEB:
${searchResults}

Genera un brief ejecutivo de 3-4 oraciones en inglés que incluya industria, tamaño, presencia geográfica y tipo de clientes.

FORMATO REQUERIDO:
"[EMPRESA] is a [TAMAÑO] [SECTOR/INDUSTRY] company operating in Mexico, specializing in [SERVICIOS/PRODUCTOS]. The company has [PRESENCIA GEOGRÁFICA] and serves [TIPO DE CLIENTES]. [CONTEXTO ADICIONAL]."

Responde ÚNICAMENTE con el brief corporativo informativo (3-4 oraciones).
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Eres un analista que genera briefs ejecutivos informativos. Incluye industria, tamaño, presencia geográfica, y tipo de clientes. 3-4 oraciones con información útil para contexto de ventas." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 180
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    return `${clientName} is a business organization operating in Mexico. Industry sector, company size, and market presence details require additional research to provide comprehensive information.`;
  }
}

// Función para procesar con IA
async function processWithAI(data) {
  try {
    const isNew = data.type === 'nuevo' || data.type === 'Nuevo';
    
    let clientBrief = '';
    if (isNew) {
      clientBrief = await generateClientBrief(data.client);
    }

    const prompt = `
Eres un especialista en documentación técnica empresarial para la plataforma SMART de Fortinet.

INFORMACIÓN RECIBIDA:
- Tipo: ${data.type} ${isNew ? '(GENERAR BRIEF DEL CLIENTE)' : '(ACTUALIZACIÓN)'}
- Cliente: ${data.client}
- Título: "${data.title}"
- Descripción: "${data.description}"
- Tecnología: ${data.technology || 'No especificado'}
- Asistentes: ${data.attendees || 'No especificado'}
- Siguientes pasos: ${data.nextSteps || 'Ver descripción'}

${isNew ? `BRIEF DEL CLIENTE GENERADO: ${clientBrief}` : ''}

Genera un SMART Comment profesional en inglés siguiendo EXACTAMENTE este formato:

${isNew ? 'NEW' : 'FOLLOW-UP'}: A meeting was held with ${data.client} to [PURPOSE EXTRACTED FROM DESCRIPTION]. 
Attendees: ${data.attendees || 'To be specified'}

During the session, we [DETAILED TECHNICAL DESCRIPTION BASED ON TECHNOLOGY AND DESCRIPTION]. The following functionalities/topics were covered:
1.- [Technical point 1 - extract from description]
2.- [Technical point 2 - if applicable]
3.- [Technical point 3 - if applicable]

[CURRENT STATUS AND TECHNICAL SITUATION - based on description]

Next Steps:
1.- [Specific action with timeline from "Siguientes pasos"]
2.- [Additional actions if needed]

RESPONDE ÚNICAMENTE en este formato JSON:
{
  "title": "título traducido y mejorado en inglés",
  "description": "descripción técnica breve traducida",
  "technology": "tecnología en formato estándar",
  "smart_comment": "El comentario SMART completo siguiendo el formato exacto mostrado arriba",
  "client_brief": "${isNew ? 'brief del cliente en inglés' : 'N/A - Follow-up'}",
  "next_actions": "próximos pasos específicos en inglés",
  "technical_focus": "área técnica principal"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Eres un especialista en documentación técnica de Fortinet. Generas documentación ejecutiva profesional para reportes SMART empresariales." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    throw new Error('Error procesando con IA: ' + error.message);
  }
}

// Función para crear página en Notion
async function createNotionPage(originalData, processedData) {
  try {
    const isNew = originalData.type === 'nuevo' || originalData.type === 'Nuevo';
    
    const pageProperties = {
      "¿Seguimiento o Nuevo?": {
        select: {
          name: originalData.type || "Nuevo"
        }
      },
      "Cliente": {
        rich_text: [
          {
            text: {
              content: originalData.client || "No especificado"
            }
          }
        ]
      },
      "Title": {
        title: [
          {
            text: {
              content: processedData.title
            }
          }
        ]
      },
      "Tecnología": {
        rich_text: [
          {
            text: {
              content: processedData.technology || originalData.technology || "No especificado"
            }
          }
        ]
      },
      "Description": {
        rich_text: [
          {
            text: {
              content: processedData.description
            }
          }
        ]
      },
      "Siguientes pasos:": {
        rich_text: [
          {
            text: {
              content: processedData.next_actions || originalData.nextSteps || "To be defined"
            }
          }
        ]
      },
      "Asistentes": {
        rich_text: [
          {
            text: {
              content: originalData.attendees || "To be specified"
            }
          }
        ]
      },
      "Processed Date": {
        date: {
          start: new Date().toISOString().split('T')[0]
        }
      },
      "SMART Comment": {
        rich_text: [
          {
            text: {
              content: processedData.smart_comment
            }
          }
        ]
      }
    };

    if (isNew && processedData.client_brief && processedData.client_brief !== 'N/A - Follow-up') {
      pageProperties["Client Brief"] = {
        rich_text: [
          {
            text: {
              content: processedData.client_brief
            }
          }
        ]
      };
    }

    const response = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { 
          database_id: NOTION_DATABASE_ID 
        },
        properties: pageProperties
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    throw new Error('Error creando página en Notion: ' + error.message);
  }
}

// RUTAS
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMART - Sistema de Reportes Fortinet</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .container { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #e74c3c; text-align: center; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: 600; }
        input, textarea, select { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; }
        button { background: #e74c3c; color: white; padding: 15px 30px; border: none; border-radius: 8px; cursor: pointer; width: 100%; }
        .result { margin-top: 20px; padding: 20px; border-radius: 8px; }
        .success { background: #d5f4e6; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SMART</h1>
        <form id="smartForm">
            <div class="form-group">
                <label for="type">¿Nuevo o Seguimiento? *</label>
                <select id="type" required>
                    <option value="">Selecciona tipo</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="seguimiento">Seguimiento</option>
                </select>
            </div>
            <div class="form-group">
                <label for="client">Cliente *</label>
                <input type="text" id="client" required>
            </div>
            <div class="form-group">
                <label for="title">Título de la Actividad *</label>
                <input type="text" id="title" required>
            </div>
            <div class="form-group">
                <label for="technology">Tecnología Fortinet</label>
                <select id="technology">
                    <option value="">Selecciona tecnología</option>
                    <option value="FortiGate">FortiGate</option>
                    <option value="FortiSASE">FortiSASE</option>
                    <option value="FortiEDR">FortiEDR</option>
                    <option value="Other">Otra</option>
                </select>
            </div>
            <div class="form-group">
                <label for="description">Descripción *</label>
                <textarea id="description" rows="4" required></textarea>
            </div>
            <div class="form-group">
                <label for="nextSteps">Siguientes Pasos</label>
                <textarea id="nextSteps" rows="3"></textarea>
            </div>
            <div class="form-group">
                <label for="attendees">Asistentes</label>
                <input type="text" id="attendees">
            </div>
            <button type="submit">🚀 Procesar</button>
        </form>
        <div id="result"></div>
    </div>
    <script>
        document.getElementById('smartForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const result = document.getElementById('result');
            const formData = {
                type: document.getElementById('type').value,
                client: document.getElementById('client').value,
                title: document.getElementById('title').value,
                technology: document.getElementById('technology').value,
                description: document.getElementById('description').value,
                nextSteps: document.getElementById('nextSteps').value,
                attendees: document.getElementById('attendees').value
            };
            
            try {
                const response = await fetch('/api/submit-form', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ formData })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    result.innerHTML = \`
                        <div class="result success">
                            <h3>✅ \${data.message}</h3>
                            <div style="background: #e8f5e8; padding: 15px; margin: 10px 0; font-family: monospace; white-space: pre-wrap;">
                                <strong>SMART Comment:</strong><br>
                                \${data.processed.smart_comment}
                            </div>
                        </div>
                    \`;
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                result.innerHTML = \`<div class="result error"><h3>❌ Error</h3><p>\${error.message}</p></div>\`;
            }
        });
    </script>
</body>
</html>
  `);
});

app.post('/api/submit-form', async (req, res) => {
  try {
    const { formData } = req.body;

    if (!formData.title || !formData.description || !formData.client) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos' 
      });
    }

    const processedData = await processWithAI(formData);
    const notionResponse = await createNotionPage(formData, processedData);
    
    res.json({ 
      success: true, 
      message: '¡Datos procesados exitosamente!',
      original: formData,
      processed: processedData,
      notionPageId: notionResponse.id
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/test', async (req, res) => {
  try {
    res.json({
      status: "✅ Servidor funcionando",
      notion: NOTION_TOKEN ? "✅ Token configurado" : "❌ Token faltante",
      openai: OPENAI_API_KEY ? "✅ API Key configurada" : "❌ API Key faltante"
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ EXPORTAR INMEDIATAMENTE
module.exports = app;
