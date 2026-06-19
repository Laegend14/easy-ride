# Easy Ride 🚖

[![Verification Status](https://img.shields.io/badge/verification-passing-success.svg)](#pre-deploy-gate)
[![Next.js 16](https://img.shields.io/badge/framework-Next.js%2016-blue.svg)](https://nextjs.org/)
[![Vitest](https://img.shields.io/badge/tests-51%20passed-brightgreen.svg)](#testing)
[![Web2-First Guard](https://img.shields.io/badge/ux-web2--first-teal.svg)](#the-web2-first-design-rule)

Easy Ride is a **production-ready, AI-powered autonomous mobility platform**. By letting riders express their travel needs in plain natural language (e.g., *"Take me to the airport"*), an intelligent AI agent orchestrates the entire transit lifecycle—parsing requirements, querying multiple ride providers, evaluating options according to user preferences, securing funds in a decentralized escrow, and automatically recovering booking status in case of driver cancellations.

![Easy Ride Logo](/logo.png)

---

## 🌟 Key Features

- **Natural Language Request Dispatch**: Describe where you want to go in plain English. Powered by Google Gemini (`gemini-2.5-flash`), the system automatically resolves intents, saved places (Home/Work), budgets, and vehicle preferences.
- **Multi-Provider Comparison & Scoring**: Integrates a Provider Adapter Layer (simulating Uber, Lyft, Bolt, inDrive, and Tesla). The agent scores each quote against user-configured optimization goals (e.g., *cheapest*, *fastest*, *highest rated*, or *balanced*).
- **Protected Payments (Escrow)**: Ride fares are secured using a Solidity-based escrow contract (`EasyRideEscrow.sol`) deployed on the **Arc Testnet** (a USDC-native EVM L1). Funds are only released to the driver on arrival.
- **Self-Healing Cancellation Recovery**: If a provider cancels, the agent re-runs its decision loop, identifies the next-best ride, reassigns the on-chain escrow to the new provider, and moves the booking forward—all autonomously.
- **Insights & Analytics**: Live tracking of savings, time saved, optimization score, and success rates based on trip history.
- **Security-First Architecture**: Strictly follows a Web2-first presentation layer with rate-limiting, database Row Level Security (RLS) checked by Supabase advisors, and server-only security boundaries.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16.2.7 (App Router, Turbopack), React 19, Tailwind CSS v4, Framer Motion, Lucide React, Zustand.
- **Database & Auth**: Supabase (Postgres, Auth, RLS Policies).
- **Decentralized Infrastructure**: Circle Developer-Controlled Wallets, Arc Testnet (Chain ID `5042002`, native USDC gas), Hardhat, Ethers v6.
- **AI Core**: Google Gemini API via `@google/genai`.
- **Testing**: Vitest 4.1.9 (for Web/API unit testing) & Hardhat (for Smart Contract testing).

---

## 🧱 Project Architecture & Folder Map

```
easy-ride/
├── src/
│   ├── app/                      # Next.js Pages & Route Handlers
│   ├── components/               # UI components (Header, Footer, Booking, Wallet, etc.)
│   ├── lib/
│   │   ├── agent/                # The Arc Agent (scoring, reasoning, state lifecycle)
│   │   ├── gemini/               # Gemini intent parser & insights generator
│   │   ├── providers/            # Provider adapter & registry definitions
│   │   ├── circle/               # Circle developer wallets & on-chain balances
│   │   ├── contracts/            # Smart contract ABIs & clients
│   │   ├── payments/             # Escrow booking, funding, & recovery logics
│   │   ├── analytics/            # Analytics calculators
│   │   ├── notifications/        # In-app notifications
│   │   └── security/             # Rate limits & input validators
│   └── utils/supabase/           # Server, Client, and Middleware Supabase helpers
├── supabase/migrations/          # SQL database schemas & RLS policies (0001-0014)
├── contracts-hardhat/            # Smart contract code, Hardhat config, & unit tests (Isolated)
├── DEPLOY.md                     # Comprehensive Vercel deployment guide
└── SECURITY.md                   # Security audit checklist & tradeoffs
```

---

## 🚦 Getting Started & Local Development

### 1. Prerequisites
- Node.js 20.x
- [Supabase CLI](https://supabase.com/docs/guides/cli) (optional, if running database locally)
- A funded Arc Testnet Deployer wallet for contract interactions.

### 2. Environment Setup
Create a `.env` file in the `easy-ride/` directory (see [easy-ride/.env](file:///c:/Users/MueAb/Desktop/Easy%20Ride/easy-ride/.env) for current configurations):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
CIRCLE_API_KEY=your_circle_api_key
CIRCLE_ENTITY_SECRET=your_circle_entity_secret
CIRCLE_WALLET_SET_ID=your_circle_wallet_set_id
ARC_DEPLOYER_PRIVATE_KEY=your_contract_operator_key
```

### 3. Install Dependencies
```bash
cd easy-ride
npm install
```

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🧪 Testing and Verification

Easy Ride uses a rigorous pre-deployment gate. Always run verification before pushing changes:

```bash
npm run verify
```

This single command triggers:
1. **Web2-First terminology check** (`check:web2`) - Ensures no blockchain leakages reach the UI.
2. **Vitest unit tests** (`test`) - Runs 51 passing unit tests.
3. **Next.js static optimization & compilation** (`build`) - Validates TypeScript types and build success.

### Running Contract Tests (Hardhat)
```bash
cd contracts-hardhat
npm install
npm test
```

---

## 🌍 The Web2-First Design Rule

Easy Ride prioritizes a consumer-grade experience. The UI **never** references terms like *blockchain*, *smart contract*, *crypto*, *gas fee*, *transaction hash*, or *wallet*. Instead, it maps them to:
- **Easy Ride Balance** (Circle USDC Account)
- **Protected Payment** (Escrow Contract)
- **Secure Ride Lock** (Funding Escrow)
- **Secure Settlement** (Releasing Escrow)
- **Digital Receipt** (Verifiable payment receipt with transaction links hidden under Settings → Advanced)

---

## 🚀 Live Deployment Guide

Refer to [DEPLOY.md](file:///c:/Users/MueAb/Desktop/Easy%20Ride/easy-ride/DEPLOY.md) for full instructions on deploying Easy Ride to Vercel and linking database authentication callbacks, redirect URLs, and security flags.
