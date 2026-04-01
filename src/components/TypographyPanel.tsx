/**
 * TypographyPanel Component - Shows text elements from selection
 * Note: Framer Plugin SDK doesn't expose fontSize or color properties
 */

import React, { useState, useEffect, useCallback } from 'react';
import { framer } from 'framer-plugin';

interface TextInfo {
  id: string;
  name: string;
  fontFamily: string;
  fontWeight: number;
}

interface TypographyPanelProps {
  onColorChange?: (id: string, color: string) => void;
}

export function TypographyPanel({ onColorChange: _onColorChange }: TypographyPanelProps): React.ReactElement {
  const [textElements, setTextElements] = useState<TextInfo[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<'selection' | 'currentPage' | 'allPages'>('currentPage');

  const scanTextElements = useCallback(async () => {
    setIsScanning(true);
    const foundElements: TextInfo[] = [];
    const processedIds = new Set<string>();

    try {
      const processTextNode = (node: Record<string, unknown>) => {
        const id = node.id as string;
        if (!id || processedIds.has(id)) return;
        processedIds.add(id);
        
        const name = (node.name as string) || 'Text';
        
        // Extract font info
        let fontFamily = 'Unknown';
        let fontWeight = 400;
        
        if (node.font && typeof node.font === 'object') {
          const font = node.font as Record<string, unknown>;
          if (typeof font.family === 'string') fontFamily = font.family;
          if (typeof font.weight === 'number') fontWeight = font.weight;
        }
        
        foundElements.push({
          id,
          name,
          fontFamily,
          fontWeight,
        });
      };

      if (scanMode === 'selection') {
        const selection = await framer.getSelection();
        if (selection && selection.length > 0) {
          for (const node of selection) {
            if (node.__class === 'TextNode') {
              processTextNode(node as unknown as Record<string, unknown>);
            }
            try {
              const textNodes = await node.getNodesWithType('TextNode');
              for (const textNode of textNodes) {
                processTextNode(textNode as unknown as Record<string, unknown>);
              }
            } catch (e) {
              // ignore
            }
          }
        } else {
          framer.notify('Please select elements first', { variant: 'warning' });
        }
      } else if (scanMode === 'currentPage') {
        try {
          const canvasRoot = await framer.getCanvasRoot();
          if (canvasRoot) {
            const textNodes = await canvasRoot.getNodesWithType('TextNode');
            for (const textNode of textNodes) {
              processTextNode(textNode as unknown as Record<string, unknown>);
            }
          }
        } catch (e) {
          framer.notify('Error scanning current page', { variant: 'error' });
        }
      } else {
        try {
          const allTextNodes = await framer.getNodesWithType('TextNode');
          for (const textNode of allTextNodes) {
            processTextNode(textNode as unknown as Record<string, unknown>);
          }
        } catch (e) {
          // ignore
        }
      }

      setTextElements(foundElements);
      
      if (foundElements.length > 0) {
        framer.notify(`Found ${foundElements.length} text element(s)`, { variant: 'success' });
      }
    } catch (err) {
      framer.notify('Error scanning', { variant: 'error' });
    } finally {
      setIsScanning(false);
    }
  }, [scanMode]);

  useEffect(() => {
    scanTextElements();
  }, [scanTextElements]);

  const handleNavigateToElement = async (id: string, name: string) => {
    try {
      await framer.setSelection([id]);
      await framer.zoomIntoView([id]);
      framer.notify(`Selected "${name}"`, { variant: 'success' });
    } catch (err) {
      framer.notify('Failed to navigate', { variant: 'error' });
    }
  };

  return (
    <div className="typography-panel">
      <div className="typography-header">
        <h3 className="typography-title">Text Elements</h3>
        <div className="typography-actions">
          <select 
            className="select select--sm"
            value={scanMode}
            onChange={(e) => setScanMode(e.target.value as 'selection' | 'currentPage' | 'allPages')}
          >
            <option value="selection">Selection Only</option>
            <option value="currentPage">Current Page</option>
            <option value="allPages">All Pages</option>
          </select>
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={scanTextElements}
            disabled={isScanning}
          >
            {isScanning ? 'Scanning...' : 'Scan'}
          </button>
        </div>
      </div>

      <div className="typography-note">
        <span>💡</span>
        <span>Click on a text element to select it in Framer. Use Framer's panel to view/edit size and color.</span>
      </div>

      {textElements.length === 0 ? (
        <div className="typography-empty">
          <span className="typography-empty-icon">📝</span>
          <p>No text elements found</p>
          <p className="text-muted text-sm">Scan to find text elements</p>
        </div>
      ) : (
        <div className="heading-list">
          {textElements.map((element) => (
            <div 
              key={element.id} 
              className="heading-item clickable-row"
              onClick={() => handleNavigateToElement(element.id, element.name)}
            >
              <div className="text-icon">T</div>
              <div className="heading-info">
                <span className="heading-name">{element.name}</span>
                <span className="heading-size">{element.fontFamily} • {element.fontWeight}</span>
              </div>
              <div className="navigate-arrow">→</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TypographyPanel;
