/**
 * Change Parser - Parses voice commands and generates code changes
 * Hardcoded patterns for demo purposes
 */

export interface CodeChange {
  property: string;
  value: string;
  cssProperty?: string;
  cssValue?: string;
}

export interface ParsedChange {
  intent: string;
  changes: CodeChange[];
  description: string;
}

// Hardcoded change patterns for demo
const CHANGE_PATTERNS: Record<string, CodeChange[]> = {
  // Color changes
  'blue': [
    { property: 'backgroundColor', value: '#3b82f6', cssProperty: 'background-color', cssValue: '#3b82f6' },
  ],
  'red': [
    { property: 'backgroundColor', value: '#ef4444', cssProperty: 'background-color', cssValue: '#ef4444' },
  ],
  'green': [
    { property: 'backgroundColor', value: '#22c55e', cssProperty: 'background-color', cssValue: '#22c55e' },
  ],
  'yellow': [
    { property: 'backgroundColor', value: '#eab308', cssProperty: 'background-color', cssValue: '#eab308' },
  ],
  'purple': [
    { property: 'backgroundColor', value: '#a855f7', cssProperty: 'background-color', cssValue: '#a855f7' },
  ],
  'black': [
    { property: 'backgroundColor', value: '#000000', cssProperty: 'background-color', cssValue: '#000000' },
  ],
  'white': [
    { property: 'backgroundColor', value: '#ffffff', cssProperty: 'background-color', cssValue: '#ffffff' },
  ],
  
  // Spacing changes
  'padding': [
    { property: 'padding', value: '1rem', cssProperty: 'padding', cssValue: '1rem' },
  ],
  'margin': [
    { property: 'margin', value: '1rem', cssProperty: 'margin', cssValue: '1rem' },
  ],
  'big padding': [
    { property: 'padding', value: '2rem', cssProperty: 'padding', cssValue: '2rem' },
  ],
  'small padding': [
    { property: 'padding', value: '0.5rem', cssProperty: 'padding', cssValue: '0.5rem' },
  ],
  
  // Font changes
  'bigger font': [
    { property: 'fontSize', value: '1.25rem', cssProperty: 'font-size', cssValue: '1.25rem' },
  ],
  'big font': [
    { property: 'fontSize', value: '1.5rem', cssProperty: 'font-size', cssValue: '1.5rem' },
  ],
  'small font': [
    { property: 'fontSize', value: '0.875rem', cssProperty: 'font-size', cssValue: '0.875rem' },
  ],
  'bold': [
    { property: 'fontWeight', value: 'bold', cssProperty: 'font-weight', cssValue: 'bold' },
  ],
  
  // Layout changes
  'grid': [
    { property: 'display', value: 'grid', cssProperty: 'display', cssValue: 'grid' },
    { property: 'gridTemplateColumns', value: 'repeat(3, 1fr)', cssProperty: 'grid-template-columns', cssValue: 'repeat(3, 1fr)' },
  ],
  'flex': [
    { property: 'display', value: 'flex', cssProperty: 'display', cssValue: 'flex' },
  ],
  'center': [
    { property: 'justifyContent', value: 'center', cssProperty: 'justify-content', cssValue: 'center' },
    { property: 'alignItems', value: 'center', cssProperty: 'align-items', cssValue: 'center' },
  ],
  
  // Border changes
  'rounded': [
    { property: 'borderRadius', value: '0.5rem', cssProperty: 'border-radius', cssValue: '0.5rem' },
  ],
  'circle': [
    { property: 'borderRadius', value: '50%', cssProperty: 'border-radius', cssValue: '50%' },
  ],
  
  // Shadow
  'shadow': [
    { property: 'boxShadow', value: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', cssProperty: 'box-shadow', cssValue: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' },
  ],
};

/**
 * Parse a voice command and generate code changes
 */
export function parseChangeCommand(command: string): ParsedChange | null {
  const normalizedCommand = command.toLowerCase().trim();
  
  // Check for exact pattern matches
  for (const [pattern, changes] of Object.entries(CHANGE_PATTERNS)) {
    if (normalizedCommand.includes(pattern)) {
      return {
        intent: pattern,
        changes,
        description: generateDescription(pattern, changes),
      };
    }
  }
  
  // Check for color mentions
  const colorMatch = normalizedCommand.match(/\b(red|blue|green|yellow|purple|black|white|orange|pink|gray)\b/);
  if (colorMatch) {
    const color = colorMatch[1];
    const changes = CHANGE_PATTERNS[color] || [
      { property: 'backgroundColor', value: color, cssProperty: 'background-color', cssValue: color },
    ];
    return {
      intent: `change color to ${color}`,
      changes,
      description: `Change background color to ${color}`,
    };
  }
  
  // Check for padding mentions
  if (normalizedCommand.includes('padding') || normalizedCommand.includes('space')) {
    const changes = normalizedCommand.includes('more') || normalizedCommand.includes('big')
      ? CHANGE_PATTERNS['big padding']
      : normalizedCommand.includes('less') || normalizedCommand.includes('small')
      ? CHANGE_PATTERNS['small padding']
      : CHANGE_PATTERNS['padding'];
    
    return {
      intent: 'add padding',
      changes,
      description: 'Add padding to element',
    };
  }
  
  // Check for font size mentions
  if (normalizedCommand.includes('font') || normalizedCommand.includes('text')) {
    if (normalizedCommand.includes('bigger') || normalizedCommand.includes('larger') || normalizedCommand.includes('increase')) {
      return {
        intent: 'increase font size',
        changes: CHANGE_PATTERNS['bigger font'],
        description: 'Increase font size',
      };
    }
    if (normalizedCommand.includes('smaller') || normalizedCommand.includes('decrease')) {
      return {
        intent: 'decrease font size',
        changes: CHANGE_PATTERNS['small font'],
        description: 'Decrease font size',
      };
    }
  }
  
  // Check for grid layout
  if (normalizedCommand.includes('grid') || normalizedCommand.includes('columns')) {
    return {
      intent: 'change to grid layout',
      changes: CHANGE_PATTERNS['grid'],
      description: 'Change layout to grid with 3 columns',
    };
  }
  
  // Default: couldn't parse
  return null;
}

/**
 * Generate CSS code from changes
 */
export function generateCSSCode(changes: CodeChange[]): string {
  return changes
    .map((change) => `${change.cssProperty}: ${change.cssValue};`)
    .join('\n  ');
}

/**
 * Generate inline style code from changes
 */
export function generateInlineStyle(changes: CodeChange[]): string {
  return changes
    .map((change) => `${change.property}: '${change.value}'`)
    .join(', ');
}

/**
 * Generate a human-readable description
 */
function generateDescription(intent: string, changes: CodeChange[]): string {
  if (changes.length === 1) {
    return `Change ${changes[0].cssProperty} to ${changes[0].cssValue}`;
  }
  return `Apply ${intent} styling (${changes.length} properties)`;
}

export default {
  parseChangeCommand,
  generateCSSCode,
  generateInlineStyle,
};
