require('dotenv').config();

// ✅ VARIABLES DE ENTORNO (SIN SECRETS HARDCODEADOS)
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID || 'b1817dc74fe314e2f';

// DEBUG (sin mostrar secrets completos)
console.log('🚀 Iniciando servidor SMART...');
console.log('📂 Directorio actual:', process.cwd());
console.log('📄 Archivo .env existe:', require('fs').existsSync('.env'));
console.log('🔍 Variables configuradas:');
console.log('NOTION_TOKEN:', NOTION_TOKEN ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('NOTION_DATABASE_ID:', NOTION_DATABASE_ID ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('OPENAI_API_KEY:', OPENAI_API_KEY ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('GOOGLE_API_KEY:', GOOGLE_API_KEY ? 'Definido ✅' : 'UNDEFINED ❌');
console.log('---');

const express = require('express');
const cors = require('cors');
const { Client } = require('@notionhq/client');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

// Configurar clientes
const notion = new Client({ auth: NOTION_TOKEN });
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Ruta principal - Formulario SMART
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMART - Sistema de Reportes Fortinet</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #e74c3c; 
            text-align: center; 
            margin-bottom: 10px;
            font-size: 2.2em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-style: italic;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input, textarea, select { 
            width: 100%; 
            padding: 12px; 
            margin-bottom: 5px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus, textarea:focus, select:focus {
            border-color: #e74c3c;
            outline: none;
        }
        button { 
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s;
        }
        button:hover { 
            background: linear-gradient(135deg, #c0392b, #a93226);
            transform: translateY(-1px);
        }
        button:disabled { 
            background: #bdc3c7; 
            cursor: not-allowed; 
            transform: none;
        }
        .loading { opacity: 0.7; pointer-events: none; }
        .result { 
            margin-top: 20px; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 5px solid #27ae60;
        }
        .success { 
            background: #d5f4e6; 
            color: #155724; 
            border-color: #27ae60;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border-color: #e74c3c;
        }
        .details { 
            background: #f8f9fa; 
            padding: 15px; 
            margin-top: 15px; 
            border-radius: 5px; 
            font-size: 13px;
            line-height: 1.5;
        }
        .smart-comment {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
        }
        .client-brief {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
            margin: 10px 0;
            font-style: italic;
        }
        .required { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SMART</h1>
        <p class="subtitle">Sistema de Reportes Técnicos - Fortinet</p>
        
        <form id="smartForm">
            <div class="form-group">
                <label for="type">¿Nuevo o Seguimiento? <span class="required">*</span></label>
                <select id="type" required>
                    <option value="">Selecciona tipo</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="seguimiento">Seguimiento</option>
                </select>
            </div>

            <div class="form-group">
                <label for="client">Cliente <span class="required">*</span></label>
                <input type="text" id="client" placeholder="Ej: GRUPO CYRBURGOS, ICONN, etc." required>
            </div>

            <div class="form-group">
                <label for="title">Título de la Actividad <span class="required">*</span></label>
                <input type="text" id="title" placeholder="Ej: Reunión con equipo técnico, Implementación FortiEDR, etc." required>
            </div>

            <div class="form-group">
                <label for="technology">Tecnología Fortinet</label>
                <select id="technology">
                    <option value="">Selecciona tecnología</option>
                    <option value="FortiGate">FortiGate</option>
                    <option value="FortiSASE">FortiSASE</option>
                    <option value="FortiEDR">FortiEDR</option>
                    <option value="FortiAnalyzer">FortiAnalyzer</option>
                    <option value="FortiManager">FortiManager</option>
                    <option value="FortiWiFi">FortiWiFi</option>
                    <option value="FortiClient">FortiClient</option>
                    <option value="Multiple">Múltiples tecnologías</option>
                    <option value="Other">Otra</option>
                </select>
            </div>

            <div class="form-group">
                <label for="description">Descripción de la Actividad <span class="required">*</span></label>
                <textarea id="description" rows="4" placeholder="Describe qué se realizó, qué se demostró, problemas encontrados, etc." required></textarea>
            </div>

            <div class="form-group">
                <label for="nextSteps">Siguientes Pasos</label>
                <textarea id="nextSteps" rows="3" placeholder="¿Qué se hará después? ¿Fechas importantes? ¿Validaciones pendientes?"></textarea>
            </div>

            <div class="form-group">
                <label for="attendees">Asistentes</label>
                <input type="text" id="attendees" placeholder="Ej: Juan Pérez (Cliente), María González (Fortinet), etc.">
            </div>

            <div class="form-group">
                <label for="smartId">SMART ID</label>
                <input type="number" id="smartId" placeholder="ID del caso SMART (si aplica)">
            </div>

            <div class="form-group">
                <label for="salesforceId">SalesForce ID</label>
                <input type="text" id="salesforceId" placeholder="Ej: SF123456, CASE-ABC789, etc.">
            </div>

            <button type="submit">🚀 Procesar y Generar SMART Comment</button>
        </form>

        <div id="result"></div>
    </div>

    <script>
        document.getElementById('smartForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const button = form.querySelector('button');
            const result = document.getElementById('result');
            
            // UI de carga
            button.textContent = '⏳ Procesando con IA...';
            button.disabled = true;
            form.classList.add('loading');
            result.innerHTML = '';
            
            const formData = {
                type: document.getElementById('type').value,
                client: document.getElementById('client').value,
                title: document.getElementById('title').value,
                technology: document.getElementById('technology').value,
                description: document.getElementById('description').value,
                nextSteps: document.getElementById('nextSteps').value,
                attendees: document.getElementById('attendees').value,
                smartId: document.getElementById('smartId').value,
                salesforceId: document.getElementById('salesforceId').value
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
                            
                            \${data.processed.client_brief !== 'N/A - Follow-up' ? \`
                            <div class="client-brief">
                                <strong>👤 Brief del Cliente (para copiar/pegar):</strong><br>
                                \${data.processed.client_brief}
                            </div>
                            \` : ''}
                            
                            <div class="smart-comment">
                                <strong>📋 SMART Comment (listo para copiar/pegar):</strong><br>
                                \${data.processed.smart_comment}
                            </div>
                            
                            <div class="details">
                                <strong>📝 Resumen del Procesamiento:</strong><br>
                                • Tipo: \${data.original.type}<br>
                                • Cliente: \${data.original.client}<br>
                                • Tecnología: \${data.processed.technology}<br>
                                • Enfoque técnico: \${data.processed.technical_focus}<br>
                                • Título generado: \${data.processed.title}<br>
                                • Próximas acciones: \${data.processed.next_actions}<br><br>
                                
                                <strong>📄 Página creada en Notion:</strong><br>
                                ID: \${data.notionPageId}
                            </div>
                        </div>
                    \`;
                    form.reset();
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                result.innerHTML = \`
                    <div class="result error">
                        <h3>❌ Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            } finally {
                button.textContent = '🚀 Procesar y Generar SMART Comment';
                button.disabled = false;
                form.classList.remove('loading');
            }
        });
    </script>
</body>
</html>
  `);
});

// Función para buscar actividades existentes (para seguimiento)
async function searchExistingActivity(client, technology) {
  try {
    const response = await fetch('https://api.notion.com/v1/databases/' + NOTION_DATABASE_ID + '/query', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filter: {
          and: [
            {
              property: 'Cliente',
              rich_text: {
                contains: client
              }
            },
            {
              property: 'Tecnología',
              rich_text: {
                contains: technology
              }
            }
          ]
        },
        sorts: [
          {
            property: 'Processed Date',
            direction: 'descending'
          }
        ],
        page_size: 5
      })
    });

    if (!response.ok) {
      throw new Error(`Error buscando actividades: ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error buscando actividades existentes:', error);
    return [];
  }
}

// ✅ NUEVA FUNCIÓN: Búsqueda directa en Google Search API
async function performGoogleSearch(query) {
  try {
    console.log(`🔍 Realizando búsqueda en Google para: ${query}`);
    
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
      // Extraer información relevante de los resultados
      const relevantInfo = data.items.slice(0, 3).map(item => ({
        title: item.title,
        snippet: item.snippet,
        link: item.link
      }));
      
      // Combinar información en texto para la IA
      const searchResults = relevantInfo.map(item => 
        `Título: ${item.title}\nDescripción: ${item.snippet}\nFuente: ${item.link}`
      ).join('\n\n');
      
      console.log(`✅ Encontrados ${data.items.length} resultados de búsqueda`);
      
      return { 
        success: true, 
        results: searchResults,
        query: query
      };
    } else {
      console.log(`⚠️ No se encontraron resultados para: ${query}`);
      return { 
        success: true, 
        results: 'No se encontraron resultados específicos en la búsqueda web.',
        query: query
      };
    }
    
  } catch (error) {
    console.error('Error en Google Search:', error);
    return { 
      success: false, 
      results: `Error en búsqueda web: ${error.message}`,
      query: query
    };
  }
}

// ✅ FUNCIÓN MEJORADA: Generar brief del cliente con web search
async function generateClientBrief(clientName) {
  try {
    console.log(`🔍 Buscando información sobre: ${clientName}`);
    
    // 🎯 BÚSQUEDA MÁS ESPECÍFICA para información corporativa completa
    const searchQuery = `"${clientName}" empresa México industry sector size revenue empleados headquarters subsidiarias`;
    
    let searchResults = '';
    
    try {
      // ✅ LLAMAR DIRECTAMENTE A LA FUNCIÓN DE BÚSQUEDA
      const searchData = await performGoogleSearch(searchQuery);
      searchResults = searchData.results || '';
      
      if (searchData.success) {
        console.log(`✅ Búsqueda web completada exitosamente`);
      } else {
        console.log(`⚠️ Búsqueda web con errores: ${searchData.results}`);
      }
      
    } catch (searchError) {
      console.error('Error en Google Search API:', searchError);
      searchResults = `Información limitada disponible para ${clientName}. Error en búsqueda web: ${searchError.message}`;
    }
    
    const prompt = `
Eres un analista de inteligencia empresarial especializado en generar briefs ejecutivos informativos.

CLIENTE A INVESTIGAR: "${clientName}"

INFORMACIÓN DE BÚSQUEDA WEB:
${searchResults}

INSTRUCCIONES ESPECÍFICAS:
Genera un brief ejecutivo de 3-4 oraciones que incluya:

1. 🏢 INDUSTRIA/SECTOR: ¿A qué se dedica específicamente?
2. 📊 TAMAÑO/IMPORTANCIA: Tamaño de la empresa (pequeña/mediana/grande), número aproximado de empleados si está disponible
3. 🌎 PRESENCIA: Cobertura geográfica (local/regional/nacional), principales ciudades/estados
4. 💼 CONTEXTO ADICIONAL: Tipo de clientes que atienden, servicios principales, o posición en el mercado

FORMATO REQUERIDO:
"[EMPRESA] is a [TAMAÑO] [SECTOR/INDUSTRY] company operating in Mexico, specializing in [SERVICIOS/PRODUCTOS]. The company has [PRESENCIA GEOGRÁFICA] and serves [TIPO DE CLIENTES]. [CONTEXTO ADICIONAL sobre importancia, subsidiarias, o características distintivas]."

INCLUYE SI ESTÁ DISPONIBLE:
✅ Sector específico de la industria
✅ Tamaño aproximado (empleados, sucursales)
✅ Cobertura geográfica
✅ Tipo de clientes que atienden
✅ Servicios/productos principales
✅ Importancia en el mercado mexicano

EVITA:
❌ Nombres específicos de ejecutivos
❌ Fechas muy específicas
❌ Información financiera detallada
❌ Más de 4 oraciones

Si la información es limitada, usa: "based on available information" o "according to sources".

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

    const generatedBrief = response.choices[0].message.content.trim();
    console.log(`✅ Brief generado: ${generatedBrief}`);
    
    return generatedBrief;
    
  } catch (error) {
    console.error('Error generando brief del cliente:', error);
    return `${clientName} is a business organization operating in Mexico. Industry sector, company size, and market presence details require additional research to provide comprehensive information.`;
  }
}

// Función principal para procesar con IA
async function processWithAI(data) {
  try {
    const isNew = data.type === 'nuevo' || data.type === 'Nuevo';
    
    let clientBrief = '';
    if (isNew) {
      console.log('🆕 Cliente nuevo detectado - Generando brief...');
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
- SMART ID: ${data.smartId || 'Pendiente'}
- SalesForce ID: ${data.salesforceId || 'Pendiente'}

${isNew ? `BRIEF DEL CLIENTE GENERADO: ${clientBrief}` : ''}

INSTRUCCIONES ESPECÍFICAS:
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

REGLAS IMPORTANTES:
- Usa terminología técnica de Fortinet (FortiGate, FortiSASE, FortiEDR, ZTNA, SPA, DEM, etc.)
- Extrae puntos técnicos específicos de la descripción
- Si la tecnología es FortiEDR, enfócate en endpoint security, threat detection, incident response
- Si es FortiSASE, enfócate en ZTNA, SPA, cloud security, DEM
- Si es FortiGate, enfócate en firewall, VPN, network security
- Describe el estado actual del proyecto/implementación
- Define próximos pasos claros y específicos
- Mantén el tono profesional y ejecutivo
- Traduce todo del español al inglés técnico

RESPONDE ÚNICAMENTE en este formato JSON:
{
  "title": "título traducido y mejorado en inglés",
  "description": "descripción técnica breve traducida",
  "technology": "tecnología en formato estándar",
  "smart_comment": "El comentario SMART completo siguiendo el formato exacto mostrado arriba",
  "client_brief": "${isNew ? 'brief del cliente en inglés' : 'N/A - Follow-up'}",
  "next_actions": "próximos pasos específicos en inglés",
  "recommended_smart_id": "ID sugerido si no se proporcionó",
  "technical_focus": "área técnica principal (ej: Endpoint Security, Network Security, Cloud Security)"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "Eres un especialista en documentación técnica de Fortinet. Tu expertise incluye FortiGate, FortiSASE, FortiEDR, ZTNA, SPA, DEM, y todas las tecnologías de seguridad. Generas documentación ejecutiva profesional para reportes SMART empresariales." 
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1200
    });

    const aiResponse = response.choices[0].message.content;
    console.log('Respuesta de IA:', aiResponse);
    
    return JSON.parse(aiResponse);
  } catch (error) {
    console.error('Error en IA:', error);
    throw new Error('Error procesando con IA: ' + error.message);
  }
}

// Función para crear página en Notion
async function createNotionPage(originalData, processedData) {
  try {
    const isNew = originalData.type === 'nuevo' || originalData.type === 'Nuevo';
    
    // 🆕 Preparar propiedades base
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
      "Original Language": {
        rich_text: [
          {
            text: {
              content: `Original (ES): ${originalData.title} | ${originalData.description}`
            }
          }
        ]
      },
      "SMART ID": {
        number: parseInt(originalData.smartId) || null
      },
      "SALESFORCE ID": {
        rich_text: [
          {
            text: {
              content: originalData.salesforceId || ""
            }
          }
        ]
      },
      "Status": {
        select: {
          name: "Processed"
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

    // ✅ AÑADIR CLIENT BRIEF SOLO PARA CLIENTES NUEVOS
    if (isNew && processedData.client_brief && processedData.client_brief !== 'N/A - Follow-up') {
      console.log('🆕 Cliente nuevo detectado - Guardando Client Brief en Notion...');
      pageProperties["Client Brief"] = {
        rich_text: [
          {
            text: {
              content: processedData.client_brief
            }
          }
        ]
      };
      console.log(`✅ Client Brief añadido: ${processedData.client_brief.substring(0, 100)}...`);
    } else if (!isNew) {
      console.log('🔄 Cliente de seguimiento - No se guarda Client Brief');
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

    const result = await response.json();
    console.log('✅ Página creada en Notion exitosamente');
    
    return result;
  } catch (error) {
    console.error('Error en Notion:', error);
    throw new Error('Error creando página en Notion: ' + error.message);
  }
}

// ✅ RUTA MEJORADA: Búsqueda web de clientes con Google Custom Search
app.post('/api/search-client', async (req, res) => {
  try {
    const { query } = req.body;
    
    console.log(`🔍 API Endpoint: Buscando información web para: ${query}`);
    
    // Usar la función de búsqueda directa
    const searchData = await performGoogleSearch(query);
    
    res.json({ 
      success: searchData.success, 
      results: searchData.results,
      query: query
    });
    
  } catch (error) {
    console.error('Error en búsqueda de cliente (API endpoint):', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ruta principal para procesar formularios
app.post('/api/submit-form', async (req, res) => {
  try {
    console.log('📝 Datos recibidos:', req.body);
    
    const { formData } = req.body;

    // Validar datos esenciales
    if (!formData.title || !formData.description || !formData.client) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan campos requeridos: título, descripción y cliente' 
      });
    }

    console.log('🤖 Procesando con IA...');
    // Procesar con IA
    const processedData = await processWithAI(formData);
    
    console.log('📄 Creando página en Notion...');
    // Crear página en Notion
    const notionResponse = await createNotionPage(formData, processedData);
    
    console.log('✅ Proceso completado exitosamente');
    
    res.json({ 
      success: true, 
      message: '¡Datos procesados y enviados a Notion exitosamente!',
      original: formData,
      processed: processedData,
      notionPageId: notionResponse.id,
      notionUrl: notionResponse.url
    });

  } catch (error) {
    console.error('❌ Error completo:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Ruta para probar conexiones
app.get('/api/test', async (req, res) => {
  try {
    console.log('🧪 Probando conexión con Database ID:', NOTION_DATABASE_ID);
    
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📡 Status de respuesta:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      throw new Error(`Notion API error: ${response.status} - ${errorText}`);
    }
    
    const notionData = await response.json();
    console.log('✅ Respuesta exitosa de Notion:', notionData.title);
    
    // Probar OpenAI
    console.log('🤖 Probando OpenAI...');
    const aiTest = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Responde solo: OK" }],
      max_tokens: 5
    });
    
    console.log('✅ Respuesta de OpenAI:', aiTest.choices[0].message.content);

    // ✅ PROBAR GOOGLE SEARCH API
    console.log('🔍 Probando Google Search API...');
    const testSearch = await performGoogleSearch('test empresa Mexico');
    
    res.json({
      notion: "✅ Conectado (con fetch directo)",
      openai: "✅ Conectado", 
      googleSearch: testSearch.success ? "✅ Conectado" : `❌ Error: ${testSearch.results}`,
      database: notionData.title[0]?.plain_text || "Sin título",
      databaseId: NOTION_DATABASE_ID,
      method: "fetch directo"
    });
    
  } catch (error) {
    console.error('❌ Error en test:', error);
    
    res.status(500).json({ 
      error: error.message,
      debugInfo: {
        originalId: NOTION_DATABASE_ID,
        type: typeof NOTION_DATABASE_ID,
        length: NOTION_DATABASE_ID ? NOTION_DATABASE_ID.length : 0
      }
    });
  }
});

// Ruta de estado (para monitoreo)
app.get('/status', (req, res) => {
  res.send('¡Servidor SMART funcionando! 🚀');
});

// También mantener la ruta /form como alternativa
app.get('/form', (req, res) => {
  res.redirect('/');
});

// HTML actualizado para el formulario completo
app.get('/form', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SMART - Sistema de Reportes Fortinet</title>
    <style>
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px; 
            background: #f8f9fa;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { 
            color: #e74c3c; 
            text-align: center; 
            margin-bottom: 10px;
            font-size: 2.2em;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-style: italic;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #333;
        }
        input, textarea, select { 
            width: 100%; 
            padding: 12px; 
            margin-bottom: 5px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            font-size: 14px;
            transition: border-color 0.3s;
        }
        input:focus, textarea:focus, select:focus {
            border-color: #e74c3c;
            outline: none;
        }
        button { 
            background: linear-gradient(135deg, #e74c3c, #c0392b); 
            color: white; 
            padding: 15px 30px; 
            border: none; 
            border-radius: 8px; 
            cursor: pointer; 
            font-size: 16px;
            font-weight: 600;
            width: 100%;
            transition: all 0.3s;
        }
        button:hover { 
            background: linear-gradient(135deg, #c0392b, #a93226);
            transform: translateY(-1px);
        }
        button:disabled { 
            background: #bdc3c7; 
            cursor: not-allowed; 
            transform: none;
        }
        .loading { opacity: 0.7; pointer-events: none; }
        .result { 
            margin-top: 20px; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 5px solid #27ae60;
        }
        .success { 
            background: #d5f4e6; 
            color: #155724; 
            border-color: #27ae60;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            border-color: #e74c3c;
        }
        .details { 
            background: #f8f9fa; 
            padding: 15px; 
            margin-top: 15px; 
            border-radius: 5px; 
            font-size: 13px;
            line-height: 1.5;
        }
        .smart-comment {
            background: #e8f5e8;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #27ae60;
            margin: 10px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            white-space: pre-wrap;
        }
        .client-brief {
            background: #e3f2fd;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #2196f3;
            margin: 10px 0;
            font-style: italic;
        }
        .required { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 SMART</h1>
        <p class="subtitle">Sistema de Reportes Técnicos - Fortinet</p>
        
        <form id="smartForm">
            <div class="form-group">
                <label for="type">¿Nuevo o Seguimiento? <span class="required">*</span></label>
                <select id="type" required>
                    <option value="">Selecciona tipo</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="seguimiento">Seguimiento</option>
                </select>
            </div>

            <div class="form-group">
                <label for="client">Cliente <span class="required">*</span></label>
                <input type="text" id="client" placeholder="Ej: GRUPO CYRBURGOS, ICONN, etc." required>
            </div>

            <div class="form-group">
                <label for="title">Título de la Actividad <span class="required">*</span></label>
                <input type="text" id="title" placeholder="Ej: Reunión con equipo técnico, Implementación FortiEDR, etc." required>
            </div>

            <div class="form-group">
                <label for="technology">Tecnología Fortinet</label>
                <select id="technology">
                    <option value="">Selecciona tecnología</option>
                    <option value="FortiGate">FortiGate</option>
                    <option value="FortiSASE">FortiSASE</option>
                    <option value="FortiEDR">FortiEDR</option>
                    <option value="FortiAnalyzer">FortiAnalyzer</option>
                    <option value="FortiManager">FortiManager</option>
                    <option value="FortiWiFi">FortiWiFi</option>
                    <option value="FortiClient">FortiClient</option>
                    <option value="Multiple">Múltiples tecnologías</option>
                    <option value="Other">Otra</option>
                </select>
            </div>

            <div class="form-group">
                <label for="description">Descripción de la Actividad <span class="required">*</span></label>
                <textarea id="description" rows="4" placeholder="Describe qué se realizó, qué se demostró, problemas encontrados, etc." required></textarea>
            </div>

            <div class="form-group">
                <label for="nextSteps">Siguientes Pasos</label>
                <textarea id="nextSteps" rows="3" placeholder="¿Qué se hará después? ¿Fechas importantes? ¿Validaciones pendientes?"></textarea>
            </div>

            <div class="form-group">
                <label for="attendees">Asistentes</label>
                <input type="text" id="attendees" placeholder="Ej: Juan Pérez (Cliente), María González (Fortinet), etc.">
            </div>

            <div class="form-group">
                <label for="smartId">SMART ID</label>
                <input type="number" id="smartId" placeholder="ID del caso SMART (si aplica)">
            </div>

            <div class="form-group">
                <label for="salesforceId">SalesForce ID</label>
                <input type="text" id="salesforceId" placeholder="Ej: SF123456, CASE-ABC789, etc.">
            </div>

            <button type="submit">🚀 Procesar y Generar SMART Comment</button>
        </form>

        <div id="result"></div>
    </div>

    <script>
        document.getElementById('smartForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const form = e.target;
            const button = form.querySelector('button');
            const result = document.getElementById('result');
            
            // UI de carga
            button.textContent = '⏳ Procesando con IA...';
            button.disabled = true;
            form.classList.add('loading');
            result.innerHTML = '';
            
            const formData = {
                type: document.getElementById('type').value,
                client: document.getElementById('client').value,
                title: document.getElementById('title').value,
                technology: document.getElementById('technology').value,
                description: document.getElementById('description').value,
                nextSteps: document.getElementById('nextSteps').value,
                attendees: document.getElementById('attendees').value,
                smartId: document.getElementById('smartId').value,
                salesforceId: document.getElementById('salesforceId').value
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
                            
                            \${data.processed.client_brief !== 'N/A - Follow-up' ? \`
                            <div class="client-brief">
                                <strong>👤 Brief del Cliente (para copiar/pegar):</strong><br>
                                \${data.processed.client_brief}
                            </div>
                            \` : ''}
                            
                            <div class="smart-comment">
                                <strong>📋 SMART Comment (listo para copiar/pegar):</strong><br>
                                \${data.processed.smart_comment}
                            </div>
                            
                            <div class="details">
                                <strong>📝 Resumen del Procesamiento:</strong><br>
                                • Tipo: \${data.original.type}<br>
                                • Cliente: \${data.original.client}<br>
                                • Tecnología: \${data.processed.technology}<br>
                                • Enfoque técnico: \${data.processed.technical_focus}<br>
                                • Título generado: \${data.processed.title}<br>
                                • Próximas acciones: \${data.processed.next_actions}<br><br>
                                
                                <strong>📄 Página creada en Notion:</strong><br>
                                ID: \${data.notionPageId}
                            </div>
                        </div>
                    \`;
                    form.reset();
                } else {
                    throw new Error(data.error);
                }
            } catch (error) {
                result.innerHTML = \`
                    <div class="result error">
                        <h3>❌ Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            } finally {
                button.textContent = '🚀 Procesar y Generar SMART Comment';
                button.disabled = false;
                form.classList.remove('loading');
            }
        });
    </script>
</body>
</html>
  `);
});
// Exportar para Vercel
module.exports = app;
