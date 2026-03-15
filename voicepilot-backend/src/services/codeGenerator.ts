/**
 * Code Generator Service - Generates code changes based on AI analysis
 */

import { mapElementToComponent, detectElementType } from '../utils/componentMapper';
import { parseChangeCommand, generateCSSCode, ParsedChange } from '../utils/changeParser';

export interface CodeChangeRequest {
  element: string;
  intent: string;
  selection?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface CodeChangeResponse {
  targetFile: string;
  codeChange: string;
  description: string;
  confidence: number;
  element: string;
  intent: string;
}

/**
 * Generate code change based on AI analysis
 */
export function generateCodeChange(request: CodeChangeRequest): CodeChangeResponse {
  const { element, intent, selection } = request;
  
  // Detect element type
  const elementType = detectElementType(element, selection);
  
  // Map to component file
  const componentMapping = mapElementToComponent(elementType);
  if (!componentMapping) {
    throw new Error(`Could not map element type: ${elementType}`);
  }
  
  // Parse the change command
  const parsedChange = parseChangeCommand(intent);
  
  if (!parsedChange) {
    // Fallback: generate a generic change
    return generateFallbackChange(componentMapping.targetFile, elementType, intent);
  }
  
  // Generate the actual code change
  const codeChange = generateCodeForElement(elementType, parsedChange);
  
  return {
    targetFile: componentMapping.targetFile,
    codeChange,
    description: parsedChange.description,
    confidence: 0.85,
    element: elementType,
    intent: parsedChange.intent,
  };
}

/**
 * Generate code specific to the element type
 */
function generateCodeForElement(elementType: string, parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  switch (elementType) {
    case 'button':
      return generateButtonChange(parsedChange);
    case 'card':
      return generateCardChange(parsedChange);
    case 'header':
      return generateHeaderChange(parsedChange);
    case 'text':
      return generateTextChange(parsedChange);
    case 'container':
      return generateContainerChange(parsedChange);
    default:
      return `/* Add to component styles */\n.element {\n  ${cssCode}\n}`;
  }
}

/**
 * Generate button-specific code changes
 */
function generateButtonChange(parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  return `// Button.tsx changes:
const Button = styled.button\`\n  ${cssCode}
\`;

// Or inline style:
// style={{ ${generateInlineStyle(parsedChange.changes)} }}`;
}

/**
 * Generate card-specific code changes
 */
function generateCardChange(parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  return `// Card.tsx changes:
const Card = styled.div\`\n  ${cssCode}
\`;

// Or CSS module:
// .card {\n//   ${cssCode}\n// }`;
}

/**
 * Generate header-specific code changes
 */
function generateHeaderChange(parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  return `// Header.tsx changes:
const Header = styled.header\`\n  ${cssCode}
\`;

// Or Tailwind classes update`;
}

/**
 * Generate text-specific code changes
 */
function generateTextChange(parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  return `// typography.css changes:
.text-element {\n  ${cssCode}\n}

// Or update Tailwind class:
// className="text-xl font-bold"`;
}

/**
 * Generate container-specific code changes
 */
function generateContainerChange(parsedChange: ParsedChange): string {
  const cssCode = generateCSSCode(parsedChange.changes);
  
  return `// Container.tsx changes:
const Container = styled.div\`\n  ${cssCode}
\`;

// Or layout component update`;
}

/**
 * Generate inline style string
 */
function generateInlineStyle(changes: ParsedChange['changes']): string {
  return changes
    .map((change) => `${change.property}: '${change.value}'`)
    .join(', ');
}

/**
 * Generate fallback change when parsing fails
 */
function generateFallbackChange(
  targetFile: string,
  elementType: string,
  intent: string
): CodeChangeResponse {
  return {
    targetFile,
    codeChange: `// TODO: Apply change based on intent: "${intent}"\n// Element type: ${elementType}\n// Update styles in ${targetFile}`,
    description: `Apply "${intent}" to ${elementType} (manual review needed)`,
    confidence: 0.5,
    element: elementType,
    intent,
  };
}

/**
 * Validate if a code change is safe to apply
 */
export function validateCodeChange(codeChange: string): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  
  // Check for potentially dangerous patterns
  const dangerousPatterns = [
    { pattern: /eval\s*\(/, message: 'Contains eval() - potential security risk' },
    { pattern: /innerHTML/, message: 'Uses innerHTML - potential XSS risk' },
    { pattern: /document\.write/, message: 'Uses document.write - discouraged' },
  ];
  
  for (const { pattern, message } of dangerousPatterns) {
    if (pattern.test(codeChange)) {
      warnings.push(message);
    }
  }
  
  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Apply a code change to a file (mock implementation)
 * In production, this would use a proper file system API
 */
export async function applyCodeChange(
  filePath: string,
  codeChange: string
): Promise<{ success: boolean; message: string }> {
  try {
    // Validate the change first
    const validation = validateCodeChange(codeChange);
    if (!validation.valid) {
      return {
        success: false,
        message: `Validation failed: ${validation.warnings.join(', ')}`,
      };
    }
    
    // In production, this would actually write to the file
    // For demo, we just return success
    console.log(`Would apply change to ${filePath}:`);
    console.log(codeChange);
    
    return {
      success: true,
      message: `Successfully applied changes to ${filePath}`,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to apply changes: ${error}`,
    };
  }
}

export default {
  generateCodeChange,
  validateCodeChange,
  applyCodeChange,
};
