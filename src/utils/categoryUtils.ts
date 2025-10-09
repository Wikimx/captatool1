import { ProcessedDocument, CategoryDefinition } from "@/types/document";

const MODERADORES = [
  "Yvone Carrillo",
  "Yvon Carrillo",
  "Dan Cortés",
  "Carlos Villanueva Avilez",
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
    .replace(/[\u0300-\u036f]/g, ""); // Elimina acentos y diacríticos
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

export function applyCategoriestoDocuments(
  documents: ProcessedDocument[],
  categories: CategoryDefinition[]
): ProcessedDocument[] {
  if (categories.length === 0) {
    // Si no hay categorías, marcar todas como "Sin clasificar"
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
      
      // Si es moderador, buscar si introduce una nueva categoría
      if (isModerador(participante)) {
        const matchedCategory = findMatchingCategory(texto, categories);
        if (matchedCategory) {
          currentCategory = matchedCategory;
        }
      }
      
      // Asignar la categoría actual a esta participación
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
