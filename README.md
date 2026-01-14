# iSuite (No-Code Workflow Automation)

iSuite is a powerful, modern, and visually stunning no-code workflow automation platform. Think of it as a premium, developer-friendly alternative to n8n and Zapier, built with the latest web technologies.

![iSuite Dashboard](/public/logos/logo.png)

## 🚀 Key Features

### 🎨 Premium UI/UX
- **Dynamic Workflow Editor**: A high-performance canvas built with React Flow for dragging, dropping, and connecting nodes.
- **Glassmorphic Design**: Modern aesthetics with vibrant colors and smooth micro-animations.
- **Real-time Status**: Live "loading", "success", and "error" indicators on nodes during execution.

### 🧩 Comprehensive Nodes
- **Google Integrations**:
  - **Gmail**: Send emails, create drafts, manage labels, and retrieve threads/messages.
  - **Google Sheets**: Read, append, update, and clear spreadsheet data dynamically.
- **AI Intelligence**:
  - Native support for **Google Gemini**, **OpenAI GPT**, and **Anthropic Claude**.
- **Logic & Utility**:
  - **Conditions (If/Else)**, **Switch (Routers)**, **Loops**, and **Wait** nodes.
  - **JSON Transformer** and **Code** nodes for advanced data manipulation.

### ⚙️ Technical Excellence
- **Durable Execution**: Powered by **Inngest** for reliable, background workflow processing with automatic retries.
- **Expression Engine**: A robust system for dynamic variables using `{{variable}}` syntax.
- **Variable Picker**: Easily map outputs from previous nodes to inputs of current nodes.
- **Type-Safe Backend**: built with Next.js 15, tRPC, and Prisma.

## 🛠 Tech Stack

- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Workflow Engine**: [Inngest](https://www.inngest.com/)
- **Database Layer**: [Prisma ORM](https://www.prisma.io/) with PostgreSQL
- **API Layer**: [tRPC](https://trpc.io/)
- **Styling**: Vanilla CSS & Tailwind CSS
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Canvas**: [React Flow (XYFlow)](https://reactflow.dev/)

## 🏁 Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL database
- Inngest Dev Server

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/mnt-future2020/isuite-nocode.git
    cd isuite-nocode
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Set up environment variables**:
    Create a `.env` file based on the keys provided in the setup guide (DATABASE_URL, INNGEST_EVENT_KEY, etc.).

4.  **Sync Database**:
    ```bash
    npx prisma db push
    npx prisma generate
    ```

5.  **Run Development Server**:
    ```bash
    npm run dev
    ```

6.  **Run Inngest Dev Server**:
    ```bash
    npm run inngest:dev
    ```

## 🚢 Deployment

iSuite is ready for production deployment. It supports **Docker** and **Next.js Standalone** mode.

- **Docker**: A multi-stage `Dockerfile` is included for easy deployment to Digital Ocean Droplets or AWS.
- **App Platform**: Connect your GitHub repository to Digital Ocean App Platform for automatic builds and scaling.

## 📄 License

This project is private and intended for internal use.

---

Built with ❤️ by the iSuite Team.
