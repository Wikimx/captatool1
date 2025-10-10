
// Re-export types for backward compatibility
export type {
  ProcessedDocument,
  DocumentMetadata,
  Participacion,
  FileWithContent,
  GroupPattern,
  GroupDistribution
} from '@/types/document';

// Re-export file processing functions
export { extractTextFromDocx } from './fileProcessing';

// Re-export metadata extraction functions
export { extractMetadata, validNSEValues, validAgeRanges } from './metadataExtraction';

// Re-export group distribution functions
export {
  detectFileGroups,
  applyGroupDistribution,
  applyAllGroupDistributions
} from './groupDistribution';

import { ProcessedDocument } from '@/types/document';
import { validNSEValues, validAgeRanges } from './metadataExtraction';
import { detectFileGroups, applyAllGroupDistributions } from './groupDistribution';

// Enhanced processing function that applies group distribution if available
export function processDocumentsWithGroupDistribution(
  documents: ProcessedDocument[], 
  files: File[]
): ProcessedDocument[] {
  console.log("🔄 Starting group detection and distribution process...");
  
  // Create FileWithContent objects
  const filesWithContent = files.map((file, index) => ({
    file,
    content: documents[index]?.text || ''
  }));
  
  // Detect groups
  const detectedGroups = detectFileGroups(filesWithContent);
  console.log(`🎯 Detected ${detectedGroups.size} groups`);
  
  // Apply group distributions
  const groupDistributions = applyAllGroupDistributions(detectedGroups);
  console.log(`📊 Generated distributions for ${groupDistributions.size} files`);
  
  // Update documents with group distributions
  return documents.map(doc => {
    const groupDist = groupDistributions.get(doc.originalFilename);
    
    if (groupDist) {
      console.log(`🎯 Applying group distribution to ${doc.originalFilename}: NSE=${groupDist.nse}, Edades=${groupDist.edades}`);
      return {
        ...doc,
        metadata: {
          ...doc.metadata,
          nse: groupDist.nse,
          edades: groupDist.edades,
          distributionSource: 'group' as const
        }
      };
    }
    
    // For files not in groups, mark distribution source appropriately
    const updatedMetadata = { ...doc.metadata };
    if (updatedMetadata.nse || updatedMetadata.edades) {
      updatedMetadata.distributionSource = updatedMetadata.nse && validNSEValues.includes(updatedMetadata.nse) 
        ? (updatedMetadata.edades && validAgeRanges.includes(updatedMetadata.edades) ? 'title' : 'content')
        : 'content';
    } else {
      updatedMetadata.distributionSource = 'none';
    }
    
    return {
      ...doc,
      metadata: updatedMetadata
    };
  });
}
