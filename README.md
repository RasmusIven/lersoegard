# Lersøgaard Document Helper

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

Lersøgaard Document Helper is designed to help the community of Lersøgaard with gathering information from documents on their website.
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

```
lersoegard/
├── public/                  # Static assets + documents
│   └── documents/           # Stored PDF/files
│
├── src/                     # Frontend source
│   ├── assets/              # Images & static assets
│   ├── components/          # UI components (shadcn/ui + custom)
│   ├── hooks/               # Custom React hooks
│   ├── integrations/        # Supabase client & types
│   ├── lib/                 # Utility functions
│   ├── pages/               # App pages (Index, NotFound)
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
│
├── supabase/                # Backend setup
│   ├── functions/           # Edge functions (chat)
│   ├── migrations/          # DB migrations
│   └── config.toml          # Supabase config
│
├── .env                     # Environment variables
├── index.html               # HTML entry point
├── package.json             # Dependencies & scripts
├── tailwind.config.ts       # Tailwind config
├── tsconfig.json            # TypeScript config
└── vite.config.ts           # Vite config
```

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


