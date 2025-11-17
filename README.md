# Welcome to Lersøgard Document Helper

## Project info

**URL**: https://lovable.dev/projects/4e2707cd-57a1-4105-9d06-309657f630d2

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

Here’s a suggested **README.md** template for the repository **Lersøgard Document Helper** (GitHub: [RasmusIven/lersoegard](https://github.com/RasmusIven/lersoegard)). Feel free to adjust wording, sections or formatting to suit your project’s style and audience.

---

# Lersøgard Document Helper

A web-app built with modern frontend tools to help manage/document whatever “Lersøgard” refers to (adjust description as needed).

## Table of Contents

* [About the Project](#about-the-project)
* [Technologies Used](#technologies-used)
* [Features](#features)
* [Getting Started](#getting-started)
  * [Prerequisites](#prerequisites)
  * [Installation](#installation)
  * [Running in Development](#running-in-development)
  * [Building for Production](#building-for-production)
* [Configuration](#configuration)
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

Install dependencies:

```bash
npm install  
# or  
yarn install  
```

### Running in Development

Start the development server:

```bash
npm run dev  
# or  
yarn dev  
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port) in your browser to view the app.

## Configuration

* Copy `.env.example` (if provided) to `.env` and fill in the environment variables (e.g., API keys, database URL, auth secrets)
* Tailwind config is in `tailwind.config.ts`, Vite config in `vite.config.ts`
* If using a backend like Supabase, configure the project accordingly under `supabase/` folder

## Directory Structure

```
lersoegard/
│
├─ public/                 # Static assets  
├─ src/                    # Main source code  
│   ├─ components/         # Reusable UI components  
│   ├─ pages/              # Page components  
│   ├─ styles/             # Additional styling  
│   └─ …  
├─ supabase/               # Backend setup (if applicable)  
├─ .env                    # Environment variables  
├─ package.json            # Project metadata & scripts  
├─ tsconfig.json           # TypeScript configuration  
├─ tailwind.config.ts      # Tailwind configuration  
└─ vite.config.ts          # Vite configuration  
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

---

**Thank you for checking out Lersøgard Document Helper!**
Feel free to modify this template as your project evolves.
