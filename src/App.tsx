/**
 * TypeFlow Plugin - Main Application Container
 *
 * Root component that orchestrates all UI components and manages global state.
 * Composes FontSelector, ScanPanel, PreviewToggle, and ApplyButton.
 *
 * **Validates: Requirements 8.1, 8.2, 8.4, 9.1, 9.4**
 */

import React, { useState, useCallback, Component, ErrorInfo, ReactNode } from 'react';
import { framer } from 'framer-plugin';
import './styles/global.css';

import {
  FontSelector,
  ScanPanel,
  PreviewToggle,
  ApplyButton,
  FontFinder,
  TypographyPanel,
} from './components';
import { useFontScanner } from './hooks/useFontScanner';
import { useTypography } from './hooks/useTypography';
import { FramerElement, FramerProject, AppError, ErrorCode } from './types/typography';
import { normalizeError, logError } from './utils/helpers';

/**
 * Props for the ErrorBoundary component
 */
interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: AppError) => void;
}

/**
 * State for the ErrorBoundary component
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: AppError | null;
}

/**
 * Error Boundary component for catching and displaying component errors.
 * Prevents the entire plugin from crashing on component errors.
 *
 * **Validates: Requirements 9.1, 9.4**
 */
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = normalizeError(error, 'Component render');
    return { hasError: true, error: appError };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const appError = normalizeError(error, 'Component render');
    const componentStack = errorInfo.componentStack ?? 'No component stack available';
    logError(appError, componentStack);
    this.props.onError?.(appError);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="section">
          <div className="error-message" role="alert">
            <span aria-hidden="true">⚠</span>
            <div>
              <strong>Something went wrong</strong>
              <p className="text-sm mt-xs">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn--secondary btn--full mt-md"
            onClick={this.handleRetry}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Main App component for the TypeFlow plugin.
 *
 * Manages:
 * - Global application state
 * - Component composition and layout
 * - Hook integration for font scanning and typography
 * - Selection state for Framer elements
 * - Error handling and display
 * - Loading indicators for async operations
 *
 * @param props - Optional props for testing/customization
 */
export function App(): React.ReactElement {
  // Font scanner hook
  const {
    scannedFonts,
    isScanning,
    error: scanError,
    scan,
    reset: _resetScanner,
  } = useFontScanner();

  // Typography management hook
  const {
    currentStyle,
    updateStyle,
    isPreviewActive,
    enablePreview,
    disablePreview,
  } = useTypography();

  // Local state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [globalError, setGlobalError] = useState<AppError | null>(null);
  const [activeTab, setActiveTab] = useState<'scanner' | 'finder' | 'typography'>('scanner');
  const [hasUserSelectedFont, setHasUserSelectedFont] = useState<boolean>(false);
  
  // Store original fonts for preview revert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalFontsRef = React.useRef<Map<string, any>>(new Map());
  
  // Request ID counter for cancelling stale hover requests
  const hoverRequestIdRef = React.useRef<number>(0);

  // Derived state
  const selectedFont = currentStyle.fontFamily;
  const selectedWeight = currentStyle.fontWeight;

  /**
   * Gets fonts from the current selection in Framer.
   * Scans selected elements and their children for text nodes with font information.
   */
  const getFramerProject = useCallback(async (): Promise<FramerProject> => {
    const elements: FramerElement[] = [];
    const processedIds = new Set<string>();
    
    /**
     * Extract font info from a Font object or font data
     */
    const extractFontInfo = (fontData: unknown): { family: string; weight: number; style: string } | null => {
      if (!fontData) return null;
      
      // Font is an object with family, weight, style properties
      if (typeof fontData === 'object' && fontData !== null) {
        const fontObj = fontData as { 
          family?: string; 
          weight?: number | null; 
          style?: string | null;
          selector?: string;
        };
        
        // Direct family property (from Font class)
        if (fontObj.family) {
          return {
            family: fontObj.family,
            weight: fontObj.weight || 400,
            style: fontObj.style || 'normal',
          };
        }
        
        // Try selector format: "GF;FontName-Weight"
        if (fontObj.selector && typeof fontObj.selector === 'string') {
          return parseFontSelector(fontObj.selector);
        }
      }
      
      // Font can be a string selector like "GF;Inter-600"
      if (typeof fontData === 'string') {
        return parseFontSelector(fontData);
      }
      
      return null;
    };
    
    /**
     * Parse Framer font selector format: "GF;FontName-Weight" or "FontName"
     */
    const parseFontSelector = (selector: string): { family: string; weight: number; style: string } => {
      let family = selector;
      let weight = 400;
      
      // Parse Framer font selector format: "GF;FontName-Weight"
      if (family.includes(';')) {
        const parts = family.split(';');
        if (parts[1]) {
          const fontPart = parts[1];
          // Extract weight from format like "Inter-600"
          const weightMatch = fontPart.match(/-(\d+)$/);
          if (weightMatch && weightMatch[1]) {
            weight = parseInt(weightMatch[1], 10);
            family = fontPart.replace(/-\d+$/, '');
          } else {
            family = fontPart;
          }
        }
      }
      
      return { family, weight, style: 'normal' };
    };

    /**
     * Process a TextNode and extract font information
     * TextNodes can have font directly OR via inlineTextStyle
     */
    const processTextNode = (node: { 
      id: string; 
      font?: unknown; 
      inlineTextStyle?: { font?: unknown; name?: string } | null;
      name?: string | null 
    }): void => {
      // Skip if already processed
      if (processedIds.has(node.id)) return;
      processedIds.add(node.id);
      
      console.log('[TypeFlow] Processing TextNode:', node.id, node.name);
      
      // First try direct font property
      let fontInfo = extractFontInfo(node.font);
      
      // If no direct font, try inlineTextStyle's font
      if (!fontInfo && node.inlineTextStyle?.font) {
        console.log('[TypeFlow] Checking inlineTextStyle:', node.inlineTextStyle.name);
        fontInfo = extractFontInfo(node.inlineTextStyle.font);
      }
      
      if (fontInfo && fontInfo.family) {
        console.log('[TypeFlow] Found font:', fontInfo);
        elements.push({
          id: node.id,
          type: 'text' as const,
          typography: {
            fontFamily: fontInfo.family,
            fontWeight: fontInfo.weight,
            fontSize: 16,
            lineHeight: 1.5,
            letterSpacing: 0,
          },
        });
      } else {
        console.log('[TypeFlow] No font found on node:', node.id);
      }
    };

    try {
      // Get current selection
      const selection = await framer.getSelection();
      console.log('[TypeFlow] Selection count:', selection?.length || 0);
      
      if (selection && selection.length > 0) {
        for (const node of selection) {
          console.log('[TypeFlow] Selected node:', node.__class, (node as { name?: string }).name);
          
          // If the selected node is a TextNode, process it directly
          if (node.__class === 'TextNode') {
            const textNode = node as { 
              id: string; 
              font?: unknown; 
              inlineTextStyle?: { font?: unknown; name?: string } | null;
              name?: string | null 
            };
            processTextNode(textNode);
          }
          
          // Get all TextNodes within this selection (works for frames, stacks, components)
          try {
            const textNodes = await node.getNodesWithType('TextNode');
            console.log('[TypeFlow] TextNodes in selection:', textNodes.length);
            
            for (const textNode of textNodes) {
              processTextNode(textNode as { 
                id: string; 
                font?: unknown; 
                inlineTextStyle?: { font?: unknown; name?: string } | null;
                name?: string | null 
              });
            }
          } catch (e) {
            console.log('[TypeFlow] Error getting text nodes from selection:', e);
          }
        }
      }
      
      // If no fonts found from selection, scan the entire project
      if (elements.length === 0 && (!selection || selection.length === 0)) {
        console.log('[TypeFlow] No selection, scanning entire project...');
        
        try {
          const allTextNodes = await framer.getNodesWithType('TextNode');
          console.log('[TypeFlow] Total TextNodes in project:', allTextNodes.length);
          
          for (const textNode of allTextNodes) {
            processTextNode(textNode as { 
              id: string; 
              font?: unknown; 
              inlineTextStyle?: { font?: unknown; name?: string } | null;
              name?: string | null 
            });
          }
        } catch (e) {
          console.log('[TypeFlow] Error getting all text nodes:', e);
        }
      }

      console.log('[TypeFlow] Total unique fonts found:', elements.length);

      return {
        id: 'framer-project',
        elements,
      };
    } catch (err) {
      console.error('[TypeFlow] Error scanning fonts:', err);
      return {
        id: 'framer-project',
        elements: [],
      };
    }
  }, []);

  // Remove processNodeById as we're using a simpler approach now

  /**
   * Handles font scan initiation
   */
  const handleScanInitiate = useCallback(async (): Promise<void> => {
    try {
      setGlobalError(null);
      const project = await getFramerProject();
      await scan(project);
    } catch (error) {
      const appError = normalizeError(error, 'Font scan');
      logError(appError);
      setGlobalError(appError);
    }
  }, [scan, getFramerProject]);

  /**
   * Handles font selection from FontSelector (click)
   * When Live Preview is ON, immediately shows the font preview
   * When Live Preview is OFF, just updates the selected font state
   */
  const handleFontSelect = useCallback(
    async (fontFamily: string): Promise<void> => {
      updateStyle({ fontFamily });
      setHasUserSelectedFont(true);
      
      // If Live Preview is ON, apply preview immediately on click
      if (isPreviewActive) {
        try {
          const selection = await framer.getSelection();
          if (!selection || selection.length === 0) return;
          
          const fontWeight = selectedWeight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
          
          // Try to get font from Framer's library first
          let font = await framer.getFont(fontFamily, { weight: fontWeight });
          
          // If not found, try to find it from existing project fonts
          if (!font) {
            const allTextNodes = await framer.getNodesWithType('TextNode');
            for (const textNode of allTextNodes) {
              const nodeFont = (textNode as { font?: { family?: string } }).font;
              if (nodeFont?.family === fontFamily) {
                font = nodeFont as unknown as typeof font;
                break;
              }
            }
          }
          
          if (!font) return;
          
          // Store originals and apply preview
          for (const node of selection) {
            if (node.__class === 'TextNode') {
              if (!originalFontsRef.current.has(node.id)) {
                originalFontsRef.current.set(node.id, (node as { font?: unknown }).font);
              }
              await framer.setAttributes(node.id, { font });
            }
            try {
              const textNodes = await node.getNodesWithType('TextNode');
              for (const textNode of textNodes) {
                if (!originalFontsRef.current.has(textNode.id)) {
                  originalFontsRef.current.set(textNode.id, (textNode as { font?: unknown }).font);
                }
                await framer.setAttributes(textNode.id, { font });
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (error) {
          console.log('[TypeFlow] Preview error:', error);
        }
      }
    },
    [updateStyle, isPreviewActive, selectedWeight]
  );

  /**
   * Handles weight selection from FontSelector (click)
   * When Live Preview is ON, immediately shows the weight preview
   */
  const handleWeightSelect = useCallback(
    async (weight: number): Promise<void> => {
      updateStyle({ fontWeight: weight });
      
      // If Live Preview is ON and a font is selected, apply preview immediately
      if (isPreviewActive && selectedFont) {
        try {
          const selection = await framer.getSelection();
          if (!selection || selection.length === 0) return;
          
          const fontWeight = weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
          
          // Try to get font from Framer's library first
          let font = await framer.getFont(selectedFont, { weight: fontWeight });
          
          // If not found, try to find it from existing project fonts
          if (!font) {
            const allTextNodes = await framer.getNodesWithType('TextNode');
            for (const textNode of allTextNodes) {
              const nodeFont = (textNode as { font?: { family?: string } }).font;
              if (nodeFont?.family === selectedFont) {
                font = nodeFont as unknown as typeof font;
                break;
              }
            }
          }
          
          if (!font) return;
          
          // Store originals and apply preview
          for (const node of selection) {
            if (node.__class === 'TextNode') {
              if (!originalFontsRef.current.has(node.id)) {
                originalFontsRef.current.set(node.id, (node as { font?: unknown }).font);
              }
              await framer.setAttributes(node.id, { font });
            }
            try {
              const textNodes = await node.getNodesWithType('TextNode');
              for (const textNode of textNodes) {
                if (!originalFontsRef.current.has(textNode.id)) {
                  originalFontsRef.current.set(textNode.id, (textNode as { font?: unknown }).font);
                }
                await framer.setAttributes(textNode.id, { font });
              }
            } catch (e) {
              // ignore
            }
          }
        } catch (error) {
          console.log('[TypeFlow] Preview error:', error);
        }
      }
    },
    [updateStyle, isPreviewActive, selectedFont]
  );

  /**
   * Handles font hover for live preview
   * Uses request ID to cancel stale requests when user hovers fast
   */
  const handleFontHover = useCallback(
    async (fontFamily: string | null): Promise<void> => {
      if (!isPreviewActive) return;
      
      // Increment request ID to cancel any pending requests
      hoverRequestIdRef.current += 1;
      const currentRequestId = hoverRequestIdRef.current;
      
      // Mouse leave - revert to original fonts
      if (fontFamily === null) {
        try {
          for (const [nodeId, originalFont] of originalFontsRef.current.entries()) {
            if (originalFont) {
              await framer.setAttributes(nodeId, { font: originalFont });
            }
          }
          originalFontsRef.current.clear();
        } catch (error) {
          console.log('[TypeFlow] Revert hover error:', error);
        }
        return;
      }
      
      // Mouse enter - apply preview font
      try {
        const selection = await framer.getSelection();
        if (!selection || selection.length === 0) return;
        
        // Check if request is still valid (not cancelled by newer hover)
        if (currentRequestId !== hoverRequestIdRef.current) return;
        
        const fontWeight = selectedWeight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
        
        // Try to get font from Framer's library first
        let font = await framer.getFont(fontFamily, { weight: fontWeight });
        
        // If not found, try to find it from existing project fonts
        if (!font) {
          const allTextNodes = await framer.getNodesWithType('TextNode');
          for (const textNode of allTextNodes) {
            const nodeFont = (textNode as { font?: { family?: string } }).font;
            if (nodeFont?.family === fontFamily) {
              font = nodeFont as unknown as typeof font;
              break;
            }
          }
        }
        
        if (!font) return;
        
        // Check again if request is still valid
        if (currentRequestId !== hoverRequestIdRef.current) return;
        
        // Store originals and apply preview
        for (const node of selection) {
          if (node.__class === 'TextNode') {
            if (!originalFontsRef.current.has(node.id)) {
              originalFontsRef.current.set(node.id, (node as { font?: unknown }).font);
            }
            await framer.setAttributes(node.id, { font });
          }
          try {
            const textNodes = await node.getNodesWithType('TextNode');
            for (const textNode of textNodes) {
              if (!originalFontsRef.current.has(textNode.id)) {
                originalFontsRef.current.set(textNode.id, (textNode as { font?: unknown }).font);
              }
              await framer.setAttributes(textNode.id, { font });
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
        console.log('[TypeFlow] Hover preview error:', error);
      }
    },
    [isPreviewActive, selectedWeight]
  );

  /**
   * Handles weight hover for live preview
   * Uses request ID to cancel stale requests when user hovers fast
   */
  const handleWeightHover = useCallback(
    async (weight: number | null): Promise<void> => {
      if (!isPreviewActive || !selectedFont) return;
      
      // Increment request ID to cancel any pending requests
      hoverRequestIdRef.current += 1;
      const currentRequestId = hoverRequestIdRef.current;
      
      // Mouse leave - revert to original fonts
      if (weight === null) {
        try {
          for (const [nodeId, originalFont] of originalFontsRef.current.entries()) {
            if (originalFont) {
              await framer.setAttributes(nodeId, { font: originalFont });
            }
          }
          originalFontsRef.current.clear();
        } catch (error) {
          console.log('[TypeFlow] Revert weight hover error:', error);
        }
        return;
      }
      
      // Mouse enter - apply preview weight
      try {
        const selection = await framer.getSelection();
        if (!selection || selection.length === 0) return;
        
        // Check if request is still valid
        if (currentRequestId !== hoverRequestIdRef.current) return;
        
        const fontWeight = weight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
        
        // Try to get font from Framer's library first
        let font = await framer.getFont(selectedFont, { weight: fontWeight });
        
        // If not found, try to find it from existing project fonts
        if (!font) {
          const allTextNodes = await framer.getNodesWithType('TextNode');
          for (const textNode of allTextNodes) {
            const nodeFont = (textNode as { font?: { family?: string } }).font;
            if (nodeFont?.family === selectedFont) {
              font = nodeFont as unknown as typeof font;
              break;
            }
          }
        }
        
        if (!font) return;
        
        // Check again if request is still valid
        if (currentRequestId !== hoverRequestIdRef.current) return;
        
        // Store originals and apply preview
        for (const node of selection) {
          if (node.__class === 'TextNode') {
            if (!originalFontsRef.current.has(node.id)) {
              originalFontsRef.current.set(node.id, (node as { font?: unknown }).font);
            }
            await framer.setAttributes(node.id, { font });
          }
          try {
            const textNodes = await node.getNodesWithType('TextNode');
            for (const textNode of textNodes) {
              if (!originalFontsRef.current.has(textNode.id)) {
                originalFontsRef.current.set(textNode.id, (textNode as { font?: unknown }).font);
              }
              await framer.setAttributes(textNode.id, { font });
            }
          } catch (e) {
            // ignore
          }
        }
      } catch (error) {
        console.log('[TypeFlow] Weight hover preview error:', error);
      }
    },
    [isPreviewActive, selectedFont]
  );

  /**
   * Handles preview toggle - when turned OFF, reverts to original fonts
   */
  const handlePreviewToggle = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (enabled) {
        enablePreview([]);
      } else {
        disablePreview([]);
        // Revert to original fonts when preview is turned off
        try {
          const selection = await framer.getSelection();
          if (selection && selection.length > 0) {
            for (const node of selection) {
              if (node.__class === 'TextNode') {
                const originalFont = originalFontsRef.current.get(node.id);
                if (originalFont) {
                  await framer.setAttributes(node.id, { font: originalFont });
                }
              }
              try {
                const textNodes = await node.getNodesWithType('TextNode');
                for (const textNode of textNodes) {
                  const originalFont = originalFontsRef.current.get(textNode.id);
                  if (originalFont) {
                    await framer.setAttributes(textNode.id, { font: originalFont });
                  }
                }
              } catch (e) {
                // ignore
              }
            }
          }
          originalFontsRef.current.clear();
        } catch (error) {
          console.log('[TypeFlow] Revert preview error:', error);
        }
      }
    },
    [enablePreview, disablePreview]
  );

  /**
   * Applies font to a text node - changes only font, preserves size/color.
   * For nodes with inlineTextStyle: reads current computed properties, clears style, restores all props with new font.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const applyFontToNode = useCallback(async (nodeId: string, nodeData: any, font: any): Promise<boolean> => {
    try {
      // First try direct font set (works for nodes without inlineTextStyle)
      if (!nodeData.inlineTextStyle) {
        await framer.setAttributes(nodeId, { font });
        return true;
      }
      
      // Node has inlineTextStyle - need to read style props, clear it, then restore
      const style = nodeData.inlineTextStyle;
      
      // Build attributes to restore after clearing text style
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const restoreAttrs: Record<string, any> = { font };
      
      // Copy all properties from the text style's font (size info is in the style)
      if (style.fontSize != null) restoreAttrs.fontSize = style.fontSize;
      if (style.lineHeight != null) restoreAttrs.lineHeight = style.lineHeight;
      if (style.letterSpacing != null) restoreAttrs.letterSpacing = style.letterSpacing;
      if (style.color != null) restoreAttrs.color = style.color;
      if (style.alignment != null) restoreAttrs.alignment = style.alignment;
      if (style.transform != null) restoreAttrs.transform = style.transform;
      if (style.decoration != null) restoreAttrs.decoration = style.decoration;
      
      // Also read from the node itself (node-level overrides)
      if (nodeData.fontSize != null) restoreAttrs.fontSize = nodeData.fontSize;
      if (nodeData.lineHeight != null) restoreAttrs.lineHeight = nodeData.lineHeight;
      if (nodeData.letterSpacing != null) restoreAttrs.letterSpacing = nodeData.letterSpacing;
      if (nodeData.color != null) restoreAttrs.color = nodeData.color;
      if (nodeData.alignment != null) restoreAttrs.alignment = nodeData.alignment;
      
      console.log('[TypeFlow] Preserving attrs for', nodeId, ':', Object.keys(restoreAttrs));
      
      // Clear text style then apply font + preserved properties in one call
      await framer.setAttributes(nodeId, { inlineTextStyle: null, ...restoreAttrs });
      
      return true;
    } catch (e) {
      console.log('[TypeFlow] Error applying font to node:', nodeId, e);
      return false;
    }
  }, []);

  /**
   * Handles apply button click - applies only font family to selected text nodes
   * Keeps existing size, weight, and style unchanged
   */
  const handleApplyClick = useCallback(async (): Promise<boolean> => {
    if (!selectedFont) {
      framer.notify('Please select a font first', { variant: 'error' });
      return false;
    }

    try {
      setIsApplying(true);
      setGlobalError(null);

      // Get the font from Framer (cast weight to valid FontWeight type)
      const fontWeight = selectedWeight as 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
      
      // First try to get font from Framer's library
      let font = await framer.getFont(selectedFont, { weight: fontWeight });
      
      // If not found in library, check if it's a scanned font (already in project)
      if (!font) {
        const isScannedFont = scannedFonts.some(f => f.family === selectedFont);
        
        if (isScannedFont) {
          try {
            const allTextNodes = await framer.getNodesWithType('TextNode');
            for (const textNode of allTextNodes) {
              const nodeFont = (textNode as { font?: { family?: string } }).font;
              if (nodeFont?.family === selectedFont) {
                font = nodeFont as unknown as typeof font;
                console.log(`[TypeFlow] Using existing font from project: ${selectedFont}`);
                break;
              }
            }
          } catch (e) {
            console.log('[TypeFlow] Error finding existing font:', e);
          }
          
          if (!font) {
            setGlobalError({
              code: ErrorCode.APPLY_FAILED,
              message: `Font "${selectedFont}" is in your project but can only change weight. Select a different weight to apply.`,
              recoverable: true,
            });
            return false;
          }
        } else {
          setGlobalError({
            code: ErrorCode.APPLY_FAILED,
            message: `Font "${selectedFont}" not found`,
            recoverable: true,
          });
          return false;
        }
      }

      // Get current selection
      const selection = await framer.getSelection();
      
      if (!selection || selection.length === 0) {
        framer.notify('Please select elements on canvas first', { variant: 'error' });
        return false;
      }

      let appliedCount = 0;
      const errors: string[] = [];

      for (const node of selection) {
        // If the selected node is a TextNode, apply font directly
        if (node.__class === 'TextNode') {
          const success = await applyFontToNode(node.id, node, font);
          if (success) appliedCount++;
          else errors.push(`Failed to apply to ${(node as { name?: string }).name || node.id}`);
        }

        // Get all TextNodes within this selection
        try {
          const textNodes = await node.getNodesWithType('TextNode');
          for (const textNode of textNodes) {
            const success = await applyFontToNode(textNode.id, textNode, font);
            if (success) appliedCount++;
            else errors.push(`Failed to apply to ${(textNode as { name?: string }).name || textNode.id}`);
          }
        } catch (e) {
          console.log('[TypeFlow] Error getting text nodes:', e);
        }
      }

      if (errors.length > 0) {
        setGlobalError({
          code: ErrorCode.APPLY_FAILED,
          message: `Applied to ${appliedCount} elements. Errors: ${errors.slice(0, 3).join(', ')}${errors.length > 3 ? '...' : ''}`,
          recoverable: true,
        });
        return false;
      } else if (appliedCount === 0) {
        framer.notify('No text elements found. Select text layers first.', { variant: 'error' });
        return false;
      } else {
        console.log(`[TypeFlow] Successfully applied ${selectedFont} to ${appliedCount} text elements`);
        originalFontsRef.current.clear();
        framer.notify(`✓ Applied ${selectedFont} (${selectedWeight}) to ${appliedCount} element${appliedCount > 1 ? 's' : ''}`, { variant: 'success' });
        return true;
      }
    } catch (error) {
      const appError = normalizeError(error, 'Apply typography');
      logError(appError);
      setGlobalError(appError);
      return false;
    } finally {
      setIsApplying(false);
    }
  }, [selectedFont, selectedWeight, scannedFonts]);

  /**
   * Handles error boundary errors
   */
  const handleBoundaryError = useCallback((error: AppError): void => {
    setGlobalError(error);
  }, []);

  /**
   * Clears global error
   */
  const handleDismissError = useCallback((): void => {
    setGlobalError(null);
  }, []);

  return (
    <div className="typeflow-plugin">
      <ErrorBoundary onError={handleBoundaryError}>
        {/* Tab Navigation with Live Preview Toggle */}
        <div className="header-row">
          <div className="tabs">
            <button
              type="button"
              className={`tab ${activeTab === 'scanner' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('scanner')}
            >
              Font Scanner
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'typography' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('typography')}
            >
              Typography
            </button>
            <button
              type="button"
              className={`tab ${activeTab === 'finder' ? 'tab--active' : ''}`}
              onClick={() => setActiveTab('finder')}
            >
              Font Finder
            </button>
          </div>
        </div>

        {/* Global Error Display */}
        {globalError && (
          <div className="error-message mb-md full-width" role="alert" aria-live="assertive">
            <span aria-hidden="true">⚠</span>
            <div className="flex-1">
              <span>{globalError.message}</span>
            </div>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={handleDismissError}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Font Scanner Tab */}
        {activeTab === 'scanner' && (
          <div className="scanner-layout">
            {/* Scrollable Content */}
            <div className="scanner-scrollable">
              {/* Font Scanner Section */}
              <ScanPanel
                isScanning={isScanning}
                scannedFonts={scannedFonts}
                onScanInitiate={handleScanInitiate}
                error={scanError}
              />

              {/* Font Selection Section with Live Preview Toggle */}
              <div className="section-header-row">
                <h3 className="section-title m-0">Font Selection</h3>
                <PreviewToggle
                  isEnabled={isPreviewActive}
                  isDisabled={false}
                  disabledReason=""
                  onToggle={handlePreviewToggle}
                  compact
                />
              </div>
              <FontSelector
                fonts={scannedFonts}
                selectedFont={selectedFont}
                selectedWeight={selectedWeight}
                onFontSelect={handleFontSelect}
                onWeightSelect={handleWeightSelect}
                onFontHover={handleFontHover}
                onWeightHover={handleWeightHover}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                hideTitle
              />
            </div>

            {/* Fixed Apply Button at Bottom */}
            <div className="sticky-bottom">
              <ApplyButton
                isDisabled={!hasUserSelectedFont}
                disabledReason="Select a font to apply"
                isLoading={isApplying}
                onClick={handleApplyClick}
              />
            </div>
          </div>
        )}

        {/* Font Finder Tab */}
        {activeTab === 'finder' && (
          <div className="tab-scrollable">
            <FontFinder onFontSelect={handleFontSelect} />
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="tab-scrollable">
            <TypographyPanel />
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

export default App;
