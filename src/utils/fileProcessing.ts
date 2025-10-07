
import { ProcessedDocument } from '@/types/document';
import { extractMetadata } from './metadataExtraction';

// Function to extract text from .txt files
const extractTextFromTxt = async (file: File): Promise<ProcessedDocument> => {
  try {
    const text = await file.text();
    
    const originalFilename = file.name;
    const baseFilename = originalFilename.replace(/\.txt$/i, "");
    
    console.log("📄 Processing .txt file:", originalFilename);
    
    const metadata = extractMetadata(baseFilename, text);
    metadata.creationDate = new Date().toISOString().split('T')[0];
    
    return {
      title: baseFilename,
      text: text,
      originalFilename,
      metadata
    };
  } catch (error) {
    console.error("Error extracting text from TXT:", error);
    throw new Error("Failed to process TXT document. Please check the file format.");
  }
};

export const extractTextFromDocx = async (file: File): Promise<ProcessedDocument> => {
  try {
    // Check if it's a .txt file
    if (file.name.toLowerCase().endsWith('.txt')) {
      return await extractTextFromTxt(file);
    }
    
    // Original .docx processing logic
    const arrayBuffer = await file.arrayBuffer();
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({
      arrayBuffer: arrayBuffer,
    });
    
    const originalFilename = file.name;
    const baseFilename = originalFilename.replace(/\.docx$/i, "");
    const text = result.value;
    
    const metadata = extractMetadata(baseFilename, text);
    metadata.creationDate = new Date().toISOString().split('T')[0];
    
    return {
      title: baseFilename,
      text: text,
      originalFilename,
      metadata
    };
  } catch (error) {
    console.error("Error extracting text from DOCX:", error);
    throw new Error("Failed to process document. Please check the file format.");
  }
};
