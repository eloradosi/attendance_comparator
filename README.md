# Attendance Comparator

A modern Next.js application for comparing two attendance files and viewing the differences.

## Features

- 📁 Upload two attendance files (CSV, XLSX, or PDF)
- 🔍 Compare files and display differences
- 🎨 Color-coded table rows (Red = Mismatch, Yellow = Missing, Green = Match)
- 📊 Export results to CSV or Excel
- 📱 Responsive design with clean UI
- ⚡ Built with Next.js 14, TypeScript, and TailwindCSS

## Getting Started

### Installation

1. Install dependencies:

```bash
npm install
```

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build for Production

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── compare/
│   │       └── route.ts          # Mock API endpoint
│   ├── compare/
│   │   └── page.tsx               # Comparison results page
│   ├── layout.tsx                 # Root layout
│   ├── page.tsx                   # Home page (file upload)
│   └── globals.css                # Global styles
├── components/
│   ├── ui/                        # shadcn/ui components
│   ├── DiffStatusBadge.tsx        # Status badge component
│   ├── DiffTable.tsx              # Comparison table component
│   ├── ExportButtons.tsx          # Export functionality
│   └── FileUpload.tsx             # File upload component
├── lib/
│   └── utils.ts                   # Utility functions
└── utils/
    ├── exportCsv.ts               # CSV export utility
    ├── exportExcel.ts             # Excel export utility
    └── types.ts                   # TypeScript type definitions
```

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **UI Components:** shadcn/ui
- **Export:** papaparse (CSV), xlsx (Excel)
- **Icons:** Lucide React

## Usage

1. Open the application in your browser
2. Upload File A and File B (supported formats: CSV, XLSX, PDF)
3. Click "Compare Files"
4. View the comparison results with color-coded differences
5. Export results to CSV or Excel format if needed

## Color Legend

- 🔴 **Red background:** Mismatch in check-in or check-out times
- 🟡 **Yellow background:** Data missing in one of the files
- 🟢 **Green background:** Matching entries

## License

MIT
