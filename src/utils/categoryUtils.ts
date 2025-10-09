import { ProcessedDocument, FileTimeCategories, TimeRange } from "@/types/document";

// Convert HH:MM time string to minutes since midnight for comparison
const timeToMinutes = (timeStr: string): number => {
  if (!timeStr || !timeStr.includes(':')) return 0;
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Check if a time falls within a range
const isTimeInRange = (time: string, range: TimeRange): boolean => {
  const timeMinutes = timeToMinutes(time);
  const startMinutes = timeToMinutes(range.startTime);
  const endMinutes = timeToMinutes(range.endTime);
  
  return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
};

// Find which category a participation belongs to based on its time
const findCategoryForTime = (time: string, timeRanges: TimeRange[]): string => {
  for (const range of timeRanges) {
    if (isTimeInRange(time, range)) {
      return range.categoryName;
    }
  }
  return "Sin clasificar";
};

export function applyCategoriestoDocuments(
  documents: ProcessedDocument[],
  fileTimeCategories: FileTimeCategories[]
): ProcessedDocument[] {
  if (fileTimeCategories.length === 0) {
    // If no categories, mark all as "Sin clasificar"
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
      // No configuration for this file, mark as "Sin clasificar"
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
