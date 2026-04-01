/**
 * FontFinder Component - Coming Soon with premium 3D animation
 */

import React from 'react';

interface FontFinderProps {
  onFontSelect?: (fontName: string) => void;
}

export function FontFinder({ onFontSelect: _onFontSelect }: FontFinderProps): React.ReactElement {
  return (
    <div className="coming-soon-container">
      {/* Animated background */}
      <div className="coming-soon-bg">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="glow-orb"></div>
      </div>
      
      {/* 3D Icon */}
      <div className="coming-soon-icon">
        <div className="icon-3d">
          <span className="icon-face front">🔍</span>
          <span className="icon-face back">✨</span>
        </div>
      </div>
      
      {/* Content */}
      <div className="coming-soon-content">
        <span className="coming-soon-badge">COMING SOON</span>
        <h2 className="coming-soon-title">AI Font Finder</h2>
        
        {/* Features preview */}
        <div className="coming-soon-features">
          <div className="feature-item">
            <span className="feature-icon">📷</span>
            <span>Image Upload</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">🤖</span>
            <span>AI Detection</span>
          </div>
          <div className="feature-item">
            <span className="feature-icon">⚡</span>
            <span>Instant Results</span>
          </div>
        </div>
      </div>
      
      {/* Animated border */}
      <div className="animated-border"></div>
    </div>
  );
}

export default FontFinder;
