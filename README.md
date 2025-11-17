# Lersøgard Document Helper

## Table of Contents

* [About the Project](#about-the-project)
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
* [Directory Structure](#directory-structure)
* [Contributing](#contributing)
* [Contact](#contact)

---

## About the Project

Lersøgard Document Helper is designed to help the community of Lersøgard with gathering information from documents on their website.
It provides a clean, responsive UI, built with React and Tailwind CSS, to ensure efficient usage and maintainable code.

## Technologies Used

* **Vite** (build tool)
* **TypeScript** (typed JavaScript)
* **React** (UI library)
* **Tailwind CSS** (utility-first CSS framework)
* **Supabase** (Database)
* **OpenAI Assistant** (Chatbot integration)

## Features

* Chatbot with responsive user interface
* Document management with search and filtering

## Getting Started

### Prerequisites

Make sure you have installed:

* Node.js (e.g., version ≥ 16)
* npm or yarn
* (If applicable) access to the backend service or database used

### Installation

Clone the repository:

```bash
git clone https://github.com/RasmusIven/lersoegard.git  
cd lersoegard  
```

## Directory Structure

ersoegard/ │ ├── public/ # Static assets │ ├── documents/ # Document files directory │ ├── favicon.ico # Site favicon │ ├── placeholder.svg # Placeholder image │ ├── robots.txt # Search engine crawler rules │ └── test-document.pdf # Test document │ ├── src/ # Main source code │ ├── assets/ # Project assets (images, fonts) │ │ └── background.png # Background image │ │ │ ├── components/ # Reusable UI components │ │ ├── ui/ # Base UI components library │ │ │ ├── badge.tsx # Badge component │ │ │ ├── button.tsx # Button component │ │ │ ├── card.tsx # Card component │ │ │ ├── input.tsx # Input component │ │ │ ├── scroll-area.tsx # Scroll area component │ │ │ ├── sonner.tsx # Toast notification component │ │ │ ├── switch.tsx # Switch/toggle component │ │ │ ├── toast.tsx # Toast component │ │ │ ├── toaster.tsx # Toast container │ │ │ ├── tooltip.tsx # Tooltip component │ │ │ └── use-toast.ts # Toast hook │ │ │ │ │ ├── ChatMessage.tsx # Chat message display component │ │ └── DocumentList.tsx # Document list with search │ │ │ ├── hooks/ # Custom React hooks │ │ ├── use-mobile.tsx # Mobile detection hook │ │ └── use-toast.ts # Toast notification hook │ │ │ ├── integrations/ # Third-party integrations │ │ └── supabase/ # Supabase backend integration │ │ ├── client.ts # Supabase client instance │ │ └── types.ts # Auto-generated TypeScript types │ │ │ ├── lib/ # Utility functions │ │ └── utils.ts # Helper utilities (cn, etc.) │ │ │ ├── pages/ # Page components │ │ ├── Index.tsx # Main chat interface page │ │ └── NotFound.tsx # 404 error page │ │ │ ├── App.tsx # Root application component │ ├── main.tsx # Application entry point │ ├── index.css # Global styles and design system │ └── vite-env.d.ts # Vite TypeScript definitions │ ├── supabase/ # Backend configuration │ ├── functions/ # Edge functions │ │ └── chat/ # Chat API endpoint │ │ └── index.ts # OpenAI Assistant integration │ ├── migrations/ # Database migration files │ └── config.toml # Supabase configuration │ ├── .env # Environment variables (auto-generated) ├── .gitignore # Git ignore rules ├── README.md # Project documentation ├── components.json # shadcn/ui configuration ├── eslint.config.js # ESLint configuration ├── index.html # HTML entry point ├── package.json # Project dependencies & scripts ├── postcss.config.js # PostCSS configuration ├── tailwind.config.ts # Tailwind CSS configuration ├── tsconfig.json # TypeScript configuration ├── tsconfig.app.json # App-specific TypeScript config ├── tsconfig.node.json # Node-specific TypeScript config └── vite.config.ts # Vite build configuration

This directory structure:

    ✅ Shows all major directories and key files
    ✅ Includes helpful descriptions for each item
    ✅ Maintains the tree structure for easy visualization
    ✅ Highlights the separation between frontend (src), backend (supabase), and static assets (public)
    ✅ Documents the purpose of configuration files

You can copy this directly into your README.md file to replace the existing Directory Structure section!

Based on my exploration of your project, here's a comprehensive Directory Structure section for your README:

## Directory Structure



## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/MyFeature`)
3. Commit your changes (`git commit -m 'Add MyFeature'`)
4. Push to the branch (`git push origin feature/MyFeature`)
5. Open a Pull Request and describe your changes
6. Ensure code style, and tests (if any) pass

## Contact

Project Maintainer: [@RasmusIven](https://github.com/RasmusIven)
If you have any questions or suggestions, feel free to open an issue or reach out.


