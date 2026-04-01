# TypeFlow

A comprehensive typography management plugin for Framer that enables designers to scan, preview, and apply typography styles across their projects.

## Features

- **Font Scanning** - Automatically scan your Framer project to discover all fonts in use with usage counts
- **Font Selection** - Browse and select fonts with weight variants and search functionality
- **Size Controls** - Precise controls for font size, line height, and letter spacing with validation
- **Live Preview** - Preview typography changes in real-time before applying them
- **Apply Typography** - Apply typography styles to selected elements with one click
- **Style Presets** - Save and manage reusable typography configurations

## Installation

### From Framer Marketplace

1. Open your Framer project
2. Navigate to the Plugins panel
3. Search for "TypeFlow"
4. Click "Install"

### Manual Installation

1. Download the latest release from the releases page
2. In Framer, go to Plugins > Install Plugin
3. Select the downloaded plugin file

## Usage

### Scanning Fonts

1. Open the TypeFlow plugin from the Plugins panel
2. Click the "Scan" button in the Scan Panel
3. View all discovered fonts with their usage counts

### Selecting Fonts

1. Use the Font Selector dropdown to browse available fonts
2. Type in the search field to filter fonts by name
3. Select a font weight from the available options

### Adjusting Sizes

1. Enter a font size value in pixels using the numeric input
2. Adjust line height and letter spacing as needed
3. Use increment/decrement buttons for fine adjustments
4. Invalid values will show validation errors

### Previewing Changes

1. Select one or more elements on the canvas
2. Enable the Preview Toggle to see changes in real-time
3. Adjust typography settings while preview is active
4. Disable preview to revert to original styles

### Applying Typography

1. Configure your desired typography settings
2. Select the target elements on the canvas
3. Click the "Apply" button to commit changes
4. A success message confirms the application

## Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Framer Desktop app

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd typeflow-plugin

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint source files |
| `npm run typecheck` | Run TypeScript type checking |

### Project Structure

```
typeflow-plugin/
├── public/
│   └── icon.png           # Plugin icon
├── assets/
│   └── preview.png        # Marketplace preview image
├── src/
│   ├── components/        # React UI components
│   │   ├── ApplyButton.tsx
│   │   ├── FontSelector.tsx
│   │   ├── PreviewToggle.tsx
│   │   ├── ScanPanel.tsx
│   │   └── SizeControls.tsx
│   ├── features/          # Core feature modules
│   │   ├── applyTypography.ts
│   │   ├── fontUtils.ts
│   │   ├── scanFonts.ts
│   │   └── sizeUtils.ts
│   ├── hooks/             # React hooks
│   │   ├── useFontScanner.ts
│   │   └── useTypography.ts
│   ├── styles/            # CSS styles
│   │   └── global.css
│   ├── types/             # TypeScript type definitions
│   │   └── typography.ts
│   ├── utils/             # Utility functions
│   │   └── helpers.ts
│   ├── App.tsx            # Main application component
│   └── index.ts           # Plugin entry point
├── framer.json            # Framer plugin configuration
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

### Testing

TypeFlow uses Vitest for testing with both unit tests and property-based tests:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production

```bash
npm run build
```

The built plugin will be output to the `dist/` directory.

## Configuration

The plugin is configured via `framer.json`:

```json
{
  "id": "typeflow-plugin",
  "name": "TypeFlow",
  "version": "1.0.0",
  "icon": "public/icon.png",
  "main": "dist/index.js",
  "modes": ["canvas"],
  "permissions": ["selection", "elements", "fonts", "storage"],
  "ui": {
    "width": 320,
    "height": 480,
    "minWidth": 280,
    "minHeight": 400
  }
}
```

## Permissions

TypeFlow requires the following Framer permissions:

- **selection** - Access to selected canvas elements
- **elements** - Read and modify element properties
- **fonts** - Access to font information
- **storage** - Persist user presets and settings

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Support

For issues and feature requests, please open an issue on the repository.
