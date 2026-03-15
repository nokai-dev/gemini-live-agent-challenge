/**
 * Component Mapper - Maps UI elements to their corresponding source files
 * Hardcoded mappings for demo purposes
 */

export interface ComponentMapping {
  element: string;
  targetFile: string;
  componentName: string;
}

// Hardcoded component mappings for demo
const COMPONENT_MAPPINGS: Record<string, ComponentMapping> = {
  button: {
    element: 'button',
    targetFile: 'src/components/Button.tsx',
    componentName: 'Button',
  },
  card: {
    element: 'card',
    targetFile: 'src/components/Card.tsx',
    componentName: 'Card',
  },
  header: {
    element: 'header',
    targetFile: 'src/components/Header.tsx',
    componentName: 'Header',
  },
  text: {
    element: 'text',
    targetFile: 'src/styles/typography.css',
    componentName: 'Typography',
  },
  container: {
    element: 'container',
    targetFile: 'src/components/Container.tsx',
    componentName: 'Container',
  },
  image: {
    element: 'image',
    targetFile: 'src/components/Image.tsx',
    componentName: 'Image',
  },
};

/**
 * Map an element type to its component file
 */
export function mapElementToComponent(elementType: string): ComponentMapping | null {
  const normalizedElement = elementType.toLowerCase().trim();
  
  // Check for exact match first
  if (COMPONENT_MAPPINGS[normalizedElement]) {
    return COMPONENT_MAPPINGS[normalizedElement];
  }
  
  // Check for partial matches
  for (const [key, mapping] of Object.entries(COMPONENT_MAPPINGS)) {
    if (normalizedElement.includes(key) || key.includes(normalizedElement)) {
      return mapping;
    }
  }
  
  // Default fallback
  return {
    element: normalizedElement,
    targetFile: `src/components/${capitalizeFirst(normalizedElement)}.tsx`,
    componentName: capitalizeFirst(normalizedElement),
  };
}

/**
 * Detect element type from selection context and Gemini response
 */
export function detectElementType(
  geminiElement: string,
  selection?: { x: number; y: number; width: number; height: number }
): string {
  const normalizedElement = geminiElement.toLowerCase();
  
  // Check if it's a known element type
  for (const key of Object.keys(COMPONENT_MAPPINGS)) {
    if (normalizedElement.includes(key)) {
      return key;
    }
  }
  
  // Infer from selection size if available
  if (selection) {
    const aspectRatio = selection.width / selection.height;
    
    // Wide and short = likely a button or header
    if (aspectRatio > 3 && selection.height < 100) {
      return 'button';
    }
    
    // Tall and narrow = likely text or container
    if (aspectRatio < 0.5 && selection.height > 200) {
      return 'text';
    }
    
    // Square-ish = likely a card or image
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2) {
      return 'card';
    }
  }
  
  return 'container';
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
  mapElementToComponent,
  detectElementType,
};
