
import { DocumentMetadata, Participacion } from '@/types/document';

// Function to normalize time format to HH:MM:SS
const normalizeTimeFormat = (time: string): string => {
  if (!time) return "";
  
  // Remove milliseconds if present (e.g., "14:30:45.123" -> "14:30:45")
  const timeWithoutMs = time.split('.')[0];
  
  // Split by colon
  const parts = timeWithoutMs.split(':');
  
  if (parts.length === 1) {
    // Only minutes (e.g., "45" -> "00:45:00")
    const minutes = parts[0].padStart(2, '0');
    return `00:${minutes}:00`;
  } else if (parts.length === 2) {
    // MM:SS or HH:MM format
    const firstPart = parseInt(parts[0]);
    const secondPart = parts[1].padStart(2, '0');
    
    if (firstPart > 59) {
      // This is MM:SS format where minutes > 59, convert to HH:MM:SS
      const hours = Math.floor(firstPart / 60);
      const minutes = firstPart % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondPart}`;
    } else {
      // This could be MM:SS (minutes:seconds) or HH:MM (hours:minutes)
      // We need to determine based on context - if it's likely MM:SS, treat as such
      // For now, assume it's MM:SS if the first part is <= 59
      const hours = 0;
      const minutes = firstPart;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secondPart}`;
    }
  } else if (parts.length === 3) {
    // HH:MM:SS format (e.g., "14:30:45" -> "14:30:45")
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    const seconds = parts[2].padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }
  
  // Return as is if format is unexpected
  return time;
};

// List of moderator names
const MODERADORES = [
  "Yvone Carrillo",
  "Yvon Carrillo",
  "Dan Cortés",
  "Carlos Villanueva Avilez",
  "Karime Galicia",
  "Mario Juárez", 
  "Natalia Rodríguez",
  "Diego De Alba Montes",
  "Daniela RK",
  "Jaime Ruiz",
  "Joaquín García Luna Pérez",
  "Daniel Behn",
  "Judith B.",
  "Andrea Chávez"
];

// Corrected valid NSE values - only the specific ones from the patterns
const validNSEValues = ["C+B", "C-D+"];

// Corrected valid age ranges - only the specific ones from the patterns
const validAgeRanges = ["18 a 25", "35 a 55"];

// Map of Mexican states
const mexicanStates: Record<string, string> = {
  "CDMX": "Ciudad de México",
  "DF": "Ciudad de México",
  "MEX": "Estado de México",
  "EDOMEX": "Estado de México",
  "GDL": "Jalisco",
  "JAL": "Jalisco",
  "MTY": "Nuevo León",
  "NL": "Nuevo León",
  "PUE": "Puebla",
  "QRO": "Querétaro",
  "VER": "Veracruz",
  "YUC": "Yucatán",
  "MER": "Yucatán",
  "OAX": "Oaxaca",
  "SIN": "Sinaloa",
  "SON": "Sonora",
  "CHIH": "Chihuahua",
  "COAH": "Coahuila",
  "AGS": "Aguascalientes",
  "BC": "Baja California",
  "BCS": "Baja California Sur",
  "CAM": "Campeche",
  "CHIS": "Chiapas",
  "COL": "Colima",
  "DGO": "Durango",
  "GTO": "Guanajuato",
  "GRO": "Guerrero",
  "HGO": "Hidalgo",
  "MIC": "Michoacán",
  "MOR": "Morelos",
  "NAY": "Nayarit",
  "SLP": "San Luis Potosí",
  "TAB": "Tabasco",
  "TAMS": "Tamaulipas",
  "TLAX": "Tlaxcala",
  "ZAC": "Zacatecas"
};

// Check if a participant name is valid
const isValidParticipant = (name: string): boolean => {
  const normalizedName = name.toLowerCase().trim();
  
  const invalidPatterns = [
    /presentation/i,
    /transcription/i,
    /transcripción/i,
    /documento/i,
    /presentación/i,
    /informe/i,
    /report/i,
    /archivo/i,
    /session/i,
    /sesión/i,
    /\bfecha\b/i,
    /\bdate\b/i
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(normalizedName)) {
      return false;
    }
  }
  
  if (normalizedName.length < 2 || normalizedName.length > 50) {
    return false;
  }
  
  return true;
}

function extractPlazaFromContent(content: string): string | undefined {
  const plazaPatterns = [
    /(?:en|plaza|ciudad)\s+(CDMX|GDL|MTY|QRO|PUE|TIJ|DGO|Guadalajara|Monterrey|Querétaro|Puebla|Tijuana|Durango)/i,
    /(?:realizado en|ubicado en|sesión en)\s+([A-Za-z\s]+(?:México|Jalisco|Nuevo León|Querétaro|Puebla|Baja California|Durango))/i,
    /ciudad de\s+([A-Za-z\s]+)/i
  ];

  for (const pattern of plazaPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const found = match[1].trim().toUpperCase();
      // Map common city names to plaza codes
      const cityMappings: Record<string, string> = {
        'GUADALAJARA': 'GDL',
        'MONTERREY': 'MTY',
        'QUERÉTARO': 'QRO',
        'PUEBLA': 'PUE',
        'TIJUANA': 'TIJ',
        'DURANGO': 'DGO'
      };
      return cityMappings[found] || found;
    }
  }
  return undefined;
}

function extractGrupoFromContent(content: string): string | undefined {
  const grupoPatterns = [
    /grupo\s+focal\s*(\d+)/i,
    /focus\s+group\s*(\d+)/i,
    /sesión\s*(\d+)/i,
    /grupo\s*(\d+)/i,
    /(SG\d+)/i
  ];

  for (const pattern of grupoPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      let grupo = match[1].toUpperCase();
      if (/^\d+$/.test(grupo)) {
        grupo = `SG${grupo}`;
      }
      return grupo;
    }
  }
  return undefined;
}

function extractEdadesFromTitle(title: string): string | undefined {
  // Generic pattern: "número a número" (e.g., "15 a 17", "32 a 40", "18 a 25")
  const genericAgePattern = /(\d{1,2})\s*a\s*(\d{1,2})(?:\s*años)?/i;
  
  const match = title.match(genericAgePattern);
  if (match) {
    const startAge = match[1];
    const endAge = match[2];
    const ageRange = `${startAge} a ${endAge}`;
    
    console.log(`🎯 Found age pattern: ${ageRange}`);
    return ageRange;
  }

  return undefined;
}

function extractNSEFromTitle(title: string): string | undefined {
  const normalizedTitle = title.toUpperCase();
  
  console.log(`🔍 Analyzing NSE in title: "${title}"`);
  
  // Direct NSE patterns with flexible formatting (existing patterns)
  const nsePatterns = [
    /NSE\s*[:_\-\s]*(C\+B|C-D\+|D\+C-|B\+C)/i,
    /NIVEL\s*[:_\-\s]*(C\+B|C-D\+|D\+C-|B\+C)/i,
    /(C\+B|C-D\+|D\+C-|B\+C)/i,
  ];
  
  // Try existing patterns first
  for (const pattern of nsePatterns) {
    const match = normalizedTitle.match(pattern);
    if (match && match[1]) {
      const extracted = match[1].toUpperCase();
      console.log(`✅ Found direct NSE pattern: ${extracted}`);
      
      // Map variations to our valid values
      if (extracted === 'C+B' || extracted === 'B+C') {
        return "C+B";
      } else if (extracted === 'C-D+' || extracted === 'D+C-') {
        return "C-D+";
      }
    }
  }
  
  // Enhanced component detection patterns - more flexible
  const componentPatterns = [
    /\b(C\+)\b/g,
    /\b(C-)\b/g, 
    /\b(D\+)\b/g,
    /\b(B)\b(?![A-Z])/g,  // B not followed by another letter
    // New patterns for components separated by underscores or spaces
    /_(C\+)_/g,
    /_(C-)_/g,
    /_(D\+)_/g,
    /_(B)_/g,
    /\s(C\+)\s/g,
    /\s(C-)\s/g,
    /\s(D\+)\s/g,
    /\s(B)\s/g,
    // Pattern for "D+ C-"
    /(D\+)\s*[_\-\s]*(C-)/g,
    /(C-)\s*[_\-\s]*(D\+)/g,
  ];
  
  const foundComponents: string[] = [];
  
  for (const pattern of componentPatterns) {
    pattern.lastIndex = 0; // Reset regex
    let match;
    while ((match = pattern.exec(normalizedTitle)) !== null) {
      // Handle compound patterns like "D+ C-"
      if (match.length > 2) {
        for (let i = 1; i < match.length; i++) {
          if (match[i] && !foundComponents.includes(match[i])) {
            foundComponents.push(match[i]);
            console.log(`🎯 Found NSE component: ${match[i]}`);
          }
        }
      } else if (match[1] && !foundComponents.includes(match[1])) {
        foundComponents.push(match[1]);
        console.log(`🎯 Found NSE component: ${match[1]}`);
      }
    }
  }
  
  console.log(`📋 All found NSE components: [${foundComponents.join(', ')}]`);
  
  // Apply immediate mapping based on found components
  if (foundComponents.length > 0) {
    // Rule 1: If we find C+ alone, immediately map to C+B
    if (foundComponents.includes('C+')) {
      console.log(`🎯 Found C+, immediately mapping to C+B`);
      return "C+B";
    }
    
    // Rule 2: If we find C- alone, immediately map to C-D+
    if (foundComponents.includes('C-')) {
      console.log(`🎯 Found C-, immediately mapping to C-D+`);
      return "C-D+";
    }
    
    // Rule 3: If we find D+ alone, immediately map to C-D+
    if (foundComponents.includes('D+')) {
      console.log(`🎯 Found D+, immediately mapping to C-D+`);
      return "C-D+";
    }
    
    // Rule 4: If we find B alone, map to C+B
    if (foundComponents.includes('B')) {
      console.log(`🎯 Found B, mapping to C+B`);
      return "C+B";
    }
  }
  
  // Look for valid NSE values in content as fallback
  for (const nseValue of validNSEValues) {
    const regex = new RegExp(`\\b${nseValue.replace(/([+\-\/])/g, '\\$1')}\\b`, 'i');
    if (regex.test(normalizedTitle)) {
      console.log(`✅ Found exact NSE match: ${nseValue}`);
      return nseValue;
    }
  }
  
  console.log(`❌ No NSE detected in title`);
  return undefined;
}

function extractEdadesFromContent(content: string): string | undefined {
  // Only look for the specific valid age ranges in content
  const edadesPatterns = [
    /edades?\s+(?:de\s+)?18\s+a\s+25(?:\s*años)?/i,
    /edades?\s+(?:de\s+)?35\s+a\s+55(?:\s*años)?/i,
    /participantes\s+de\s+18\s+a\s+25\s+años/i,
    /participantes\s+de\s+35\s+a\s+55\s+años/i,
    /entre\s+18\s+y\s+25\s+años/i,
    /entre\s+35\s+y\s+55\s+años/i
  ];

  for (const pattern of edadesPatterns) {
    const match = content.match(pattern);
    if (match) {
      if (pattern.source.includes('18')) {
        return "18 a 25";
      } else if (pattern.source.includes('35')) {
        return "35 a 55";
      }
    }
  }

  return undefined;
}

function extractNSEFromContent(content: string): string | undefined {
  const nsePatterns = [
    /NSE\s*[:_\-\s]*(C\+B|C-D\+)/i,
    /nivel\s+socioeconómico\s*[:_\-\s]*(C\+B|C-D\+)/i,
    /clase\s+(C\+B|C-D\+)/i,
    /estrato\s+(C\+B|C-D\+)/i
  ];

  for (const pattern of nsePatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const extracted = findExactNseMatch(match[1].trim());
      if (extracted) {
        return extracted;
      }
    }
  }

  // Scan for valid NSE values in content
  for (const nseValue of validNSEValues) {
    const regex = new RegExp(`\\b${nseValue.replace(/([+\-\/])/g, '\\$1')}\\b`, 'i');
    if (regex.test(content)) {
      return nseValue;
    }
  }

  return undefined;
}

// Find exact match from valid NSE values
function findExactNseMatch(extractedValue: string): string | undefined {
  const normalized = extractedValue.toUpperCase();
  
  for (const validValue of validNSEValues) {
    if (validValue.toUpperCase() === normalized) {
      return validValue;
    }
  }
  
  // Try with normalized separators
  const normalizedWithStandardSep = normalized.replace(/[\s_\-]/g, "");
  
  for (const validValue of validNSEValues) {
    const normalizedValid = validValue.toUpperCase().replace(/[\s_\-]/g, "");
    if (normalizedValid === normalizedWithStandardSep) {
      return validValue;
    }
  }
  
  return undefined;
}

export function extractMetadata(title: string, content: string): DocumentMetadata {
  const metadata: DocumentMetadata = {
    wordCount: content.split(/\s+/).filter(Boolean).length,
    characterCount: content.length,
    participaciones: []
  };

  // Extract Plaza (title first, then content)
  const plazaPatterns = [
    /\b(CDMX|GDL|MTY|QRO|PUE|TIJ|DGO)\b/i,
    /Plaza\s+([^\s_]+)/i,
    /OP\s+([A-Za-z]+)/i
  ];

  for (const pattern of plazaPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      metadata.plaza = match[1].toUpperCase();
      break;
    }
  }

  // Fallback: search in content if not found in title
  if (!metadata.plaza) {
    metadata.plaza = extractPlazaFromContent(content);
  }

  // Extract Grupo (title first, then content)
  const grupoPatterns = [
    /\b(SG\d+)\b/i,
    /Grupo\s*(\w+)/i,
    /G(\d+)/i,
    /_SG(\d+)_/i
  ];

  for (const pattern of grupoPatterns) {
    const match = title.match(pattern);
    if (match && match[1]) {
      let grupo = match[1].toUpperCase();
      
      if (/^\d+$/.test(grupo)) {
        grupo = `SG${grupo}`;
      } else if (/^G\d+$/i.test(grupo)) {
        grupo = `S${grupo}`;
      }
      
      metadata.grupo = grupo;
      break;
    }
  }

  // Fallback: search in content if not found in title
  if (!metadata.grupo) {
    metadata.grupo = extractGrupoFromContent(content);
  }

  // Extract age range using enhanced function (title first, then content)
  metadata.edades = extractEdadesFromTitle(title);
  
  // Fallback: search in content if not found in title
  if (!metadata.edades) {
    metadata.edades = extractEdadesFromContent(content);
  }

  // Extract NSE using enhanced function (title first, then content)
  metadata.nse = extractNSEFromTitle(title);

  // Fallback: search in content if not found in title
  if (!metadata.nse) {
    metadata.nse = extractNSEFromContent(content);
  }
  
  // Special rules for specific state codes in title
  const upperTitle = title.toUpperCase();
  
  if (upperTitle.includes("GTO")) {
    metadata.plaza = "León";
    metadata.estado = "Guanajuato";
  } else if (upperTitle.includes("EDOMEX") || upperTitle.includes("EDO MEX")) {
    metadata.plaza = "Varias";
    metadata.estado = "Estado de México";
  } else {
    // Extract Estado based on Plaza (default behavior)
    if (metadata.plaza) {
      const upperPlaza = metadata.plaza.toUpperCase();
      if (mexicanStates[upperPlaza]) {
        metadata.estado = mexicanStates[upperPlaza];
      }
    }
  }
  
  // Enhanced participation extraction with simplified patterns
  console.log("🔍 Extracting participations from content...");
  console.log("📄 Content preview (first 500 chars):", content.substring(0, 500));
  
  // Enhanced regex patterns for participation extraction
  const participacionPatterns = [
    // Pattern 1: HH:MM:SS Name: text (full format)
    /(\d{1,2}:\d{2}:\d{2})\s+([^:]+?):\s*(.+?)(?=\n\d{1,2}:\d{2}|\n\n|$)/gs,
    // Pattern 2: MM:SS Name: text (minutes:seconds format - most common at start)
    // This pattern specifically looks for MM:SS where MM can be > 59
    /(\d{1,3}:\d{2})\s+([^:]+?):\s*(.+?)(?=\n\d{1,2}:\d{2}|\n\n|$)/gs,
    // Pattern 3: HH:MM Name: text (fallback for older format)
    /(\d{1,2}:\d{2})\s+([^:]+?):\s*(.+?)(?=\n\d{1,2}:\d{2}|\n\n|$)/gs
  ];
  
  // Try all patterns and combine results
  for (let i = 0; i < participacionPatterns.length; i++) {
    const regex = participacionPatterns[i];
    regex.lastIndex = 0;
    let match;
    let patternMatches = 0;
    
    console.log(`🔍 Testing pattern ${i + 1}: ${regex}`);
    
    while ((match = regex.exec(content)) !== null) {
      const timeStr = match[1];
      const participantName = match[2].trim();
      const participationText = match[3].trim();
      
      console.log(`🎯 Found match: "${timeStr}" - "${participantName}" - "${participationText.substring(0, 50)}..."`);
      
      if (!isValidParticipant(participantName)) {
        console.log(`❌ Invalid participant: "${participantName}"`);
        continue;
      }
      
      // Normalize time format to HH:MM:SS
      let formattedTime = normalizeTimeFormat(timeStr);
      
      // Debug log for time conversion
      console.log(`🕐 Time conversion: "${timeStr}" -> "${formattedTime}"`);
      
      // Check if this participation already exists (avoid duplicates)
      const existingParticipation = metadata.participaciones.find(p => 
        p.hora === formattedTime && 
        p.participante === participantName && 
        p.texto === participationText
      );
      
      if (!existingParticipation) {
        metadata.participaciones.push({
          hora: formattedTime,
          participante: participantName,
          texto: participationText
        });
        patternMatches++;
      } else {
        console.log(`⚠️ Duplicate participation skipped`);
      }
    }
    
    console.log(`📊 Pattern ${i + 1} matches: ${patternMatches}`);
  }
  
  console.log(`🎯 Total participaciones extracted: ${metadata.participaciones.length}`);
  
  // Sort participations by time (HH:MM:SS format)
  metadata.participaciones.sort((a, b) => {
    const timeA = a.hora.split(':').map(Number);
    const timeB = b.hora.split(':').map(Number);
    
    // Convert to total seconds for comparison
    const secondsA = timeA[0] * 3600 + timeA[1] * 60 + timeA[2];
    const secondsB = timeB[0] * 3600 + timeB[1] * 60 + timeB[2];
    
    return secondsA - secondsB;
  });
  
  console.log(`📊 Participaciones sorted chronologically. First few times:`, 
    metadata.participaciones.slice(0, 5).map(p => p.hora));
  
  return metadata;
}

export { validNSEValues, validAgeRanges };
