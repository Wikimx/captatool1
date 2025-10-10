
import { FileWithContent, GroupPattern, GroupDistribution } from '@/types/document';

function extractPrefixAndNumber(filename: string): { prefix: string; number: number } | null {
  // Remove file extension
  const nameWithoutExt = filename.replace(/\.(docx?|txt)$/i, '');
  
  // Pattern to match: prefix followed by number (e.g., "GF_CDMX_C1", "Session_3")
  const match = nameWithoutExt.match(/^(.+?)(\d+)$/);
  
  if (match) {
    return {
      prefix: match[1],
      number: parseInt(match[2], 10)
    };
  }
  
  return null;
}

// Detect groups of files with same prefix and consecutive numbers
export function detectFileGroups(files: FileWithContent[]): Map<string, GroupPattern> {
  const prefixGroups = new Map<string, { numbers: number[]; files: FileWithContent[] }>();
  
  // Group files by prefix
  files.forEach(file => {
    const parsed = extractPrefixAndNumber(file.file.name);
    if (parsed) {
      if (!prefixGroups.has(parsed.prefix)) {
        prefixGroups.set(parsed.prefix, { numbers: [], files: [] });
      }
      prefixGroups.get(parsed.prefix)!.numbers.push(parsed.number);
      prefixGroups.get(parsed.prefix)!.files.push(file);
    }
  });

  // Filter groups that have exactly 3 or 4 files with consecutive numbers
  const validGroups = new Map<string, GroupPattern>();
  
  prefixGroups.forEach((group, prefix) => {
    if (group.numbers.length === 3 || group.numbers.length === 4) {
      const sortedNumbers = [...group.numbers].sort((a, b) => a - b);
      
      // Check if numbers are consecutive
      let isConsecutive = true;
      for (let i = 1; i < sortedNumbers.length; i++) {
        if (sortedNumbers[i] !== sortedNumbers[i-1] + 1) {
          isConsecutive = false;
          break;
        }
      }
      
      if (isConsecutive) {
        // Sort files by their numbers
        const sortedFiles = group.files.sort((a, b) => {
          const aNum = extractPrefixAndNumber(a.file.name)?.number || 0;
          const bNum = extractPrefixAndNumber(b.file.name)?.number || 0;
          return aNum - bNum;
        });
        
        validGroups.set(prefix, {
          prefix,
          numbers: sortedNumbers,
          files: sortedFiles
        });
        
        console.log(`✅ Detected group of ${group.numbers.length}: ${prefix} with numbers ${sortedNumbers.join(', ')}`);
      }
    }
  });
  
  return validGroups;
}

// Get distribution for groups of 4 files
function getDistributionFor4Files(): GroupDistribution[] {
  return [
    { nse: "C+B", edades: "18 a 25" },
    { nse: "C+B", edades: "35 a 55" },
    { nse: "C-D+", edades: "18 a 25" },
    { nse: "C-D+", edades: "35 a 55" }
  ];
}

// Get distribution for groups of 3 files
function getDistributionFor3Files(): GroupDistribution[] {
  return [
    { nse: "C+B", edades: "35 a 55" },
    { nse: "C-D+", edades: "18 a 25" },
    { nse: "C-D+", edades: "35 a 55" }
  ];
}

// Apply automatic distribution to a group
export function applyGroupDistribution(group: GroupPattern): Map<string, GroupDistribution> {
  const distribution = new Map<string, GroupDistribution>();
  
  let distributions: GroupDistribution[];
  
  if (group.files.length === 4) {
    distributions = getDistributionFor4Files();
    console.log(`📋 Applying 4-file distribution to group ${group.prefix}`);
  } else if (group.files.length === 3) {
    distributions = getDistributionFor3Files();
    console.log(`📋 Applying 3-file distribution to group ${group.prefix}`);
  } else {
    return distribution;
  }
  
  // Assign distribution to each file
  group.files.forEach((file, index) => {
    const dist = distributions[index];
    distribution.set(file.file.name, dist);
    console.log(`  📌 ${file.file.name} -> NSE: ${dist.nse}, Edades: ${dist.edades}`);
  });
  
  return distribution;
}

// Apply group distributions to all detected groups
export function applyAllGroupDistributions(groups: Map<string, GroupPattern>): Map<string, GroupDistribution> {
  const allDistributions = new Map<string, GroupDistribution>();
  
  groups.forEach(group => {
    const groupDistribution = applyGroupDistribution(group);
    groupDistribution.forEach((dist, fileName) => {
      allDistributions.set(fileName, dist);
    });
  });
  
  return allDistributions;
}
