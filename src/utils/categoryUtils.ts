import { ProcessedDocument, CategoryDefinition, FileTimeCategories, TimeRange, CategoryConfiguration } from "@/types/document";

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

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // Remove accents
};

const isModerador = (participante: string): boolean => {
  return MODERADORES.some(moderador => 
    moderador.toLowerCase() === participante.toLowerCase().trim()
  );
};

const findMatchingCategory = (texto: string, categories: CategoryDefinition[]): string | undefined => {
  const textoNormalizado = normalizeText(texto);
  
  for (const category of categories) {
    for (const frase of category.frasesClave) {
      const fraseNormalizada = normalizeText(frase);
      if (textoNormalizado.includes(fraseNormalizada)) {
        return category.nombre;
      }
    }
  }
  
  return undefined;
};

// Time-based categorization helpers
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    // HH:MM format
    const [hours, minutes] = parts;
    return hours * 60 + minutes;
  } else if (parts.length === 3) {
    // HH:MM:SS format
    const [hours, minutes, seconds] = parts;
    return hours * 60 + minutes + seconds / 60;
  }
  
  return 0;
};

const isTimeInRange = (time: string, range: TimeRange): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(range.startTime);
  const endMinutes = timeToMinutes(range.endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

const findCategoryForTime = (time: string, timeRanges: TimeRange[]): string => {
  for (const range of timeRanges) {
    if (isTimeInRange(time, range)) {
      return range.categoryName;
    }
  }
  return "Sin clasificar";
};

// Keyword-based categorization
function applyKeywordCategories(
  documents: ProcessedDocument[],
  categories: CategoryDefinition[]
): ProcessedDocument[] {
  if (categories.length === 0) {
    return documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        participaciones: doc.metadata.participaciones?.map(p => ({
          ...p,
          categoria: "Sin clasificar"
        }))
      }
    }));
  }

  return documents.map(doc => {
    if (!doc.metadata.participaciones || doc.metadata.participaciones.length === 0) {
      return doc;
    }

    let currentCategory = "Sin clasificar";
    
    const participacionesWithCategories = doc.metadata.participaciones.map(participacion => {
      const participante = participacion.participante || "";
      const texto = participacion.texto || "";
      
      // If moderator, search for new category
      if (isModerador(participante)) {
        const matchedCategory = findMatchingCategory(texto, categories);
        if (matchedCategory) {
          currentCategory = matchedCategory;
        }
      }
      
      return {
        ...participacion,
        categoria: currentCategory
      };
    });

    return {
      ...doc,
      metadata: {
        ...doc.metadata,
        participaciones: participacionesWithCategories
      }
    };
  });
}

// Time-based categorization
function applyTimeCategories(
  documents: ProcessedDocument[],
  fileTimeCategories: FileTimeCategories[]
): ProcessedDocument[] {
  if (fileTimeCategories.length === 0) {
    return documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        participaciones: doc.metadata.participaciones?.map(p => ({
          ...p,
          categoria: "Sin clasificar"
        }))
      }
    }));
  }

  return documents.map(doc => {
    if (!doc.metadata.participaciones || doc.metadata.participaciones.length === 0) {
      return doc;
    }

    // Find time configuration for this specific file
    const fileConfig = fileTimeCategories.find(
      ftc => ftc.fileName === doc.originalFilename
    );

    if (!fileConfig || fileConfig.timeRanges.length === 0) {
      // No configuration for this file
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          participaciones: doc.metadata.participaciones.map(p => ({
            ...p,
            categoria: "Sin clasificar"
          }))
        }
      };
    }

    // Apply time-based categorization
    const participacionesWithCategories = doc.metadata.participaciones.map(participacion => {
      const time = participacion.hora || "";
      const category = findCategoryForTime(time, fileConfig.timeRanges);
      
      return {
        ...participacion,
        categoria: category
      };
    });

    return {
      ...doc,
      metadata: {
        ...doc.metadata,
        participaciones: participacionesWithCategories
      }
    };
  });
}

// Main function that routes to the appropriate categorization method
export function applyCategoriestoDocuments(
  documents: ProcessedDocument[],
  config: CategoryConfiguration
): ProcessedDocument[] {
  if (config.method === 'keywords' && config.keywordCategories) {
    return applyKeywordCategories(documents, config.keywordCategories);
  } else if (config.method === 'time' && config.timeCategories) {
    return applyTimeCategories(documents, config.timeCategories);
  }
  
  // Default: mark all as "Sin clasificar"
  return documents.map(doc => ({
    ...doc,
    metadata: {
      ...doc.metadata,
      participaciones: doc.metadata.participaciones?.map(p => ({
        ...p,
        categoria: "Sin clasificar"
      }))
    }
  }));
}
