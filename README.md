# Family Expense Management System

A production-ready, premium fintech application built according to the **Master One-Prompt Build Specification (v1.0)**. 

---

## 🌟 Key Features

### 🛡️ Dual Role Architecture

#### 1. Administrator Portal (`/admin/*`)
- **Full Family Financial Control**: Manage all members, allocations, and expenditures.
- **Member Management**: Add new members with initial budgets, edit profiles, adjust allowances, and toggle active/inactive status.
- **Budget Allocations**: Periodic budget assignment with strict database audit trails.
- **Family Expenses Ledger**: Filter by member, category, date range, or amount; sort by newest/oldest/highest/lowest; export to CSV.
- **Financial Reports**:
  - **Daily Report**: Real-time daily ledger with member breakdown and Family Total footer row.
  - **10-Day Report**: Spending pace, average daily spend, category breakdown, and highest spending trends.
  - **30-Day Report**: Monthly audit with budget risk identification, category distributions, and highest spending highlights.
  - **Real Report Generation**: 1-click **PDF export** (using jsPDF + autoTable) and **CSV export** generated directly from live ledger data.
- **Analytics & Dynamic Insights**:
  - Visual comparison bar charts, donut distribution charts, and timeline charts.
  - Non-judgmental, automated insights backed by real transaction data.
- **Alerts Center**: Real-time notifications for threshold triggers (85% watch, 98% near limit, over-budget, large transactions $\ge$ Rs. 5,000).
- **Settings & Controls**:
  - Currency configuration (Default: `PKR` / `Rs.`), timezone (`Asia/Karachi`).
  - **Over-Budget Guard**: Toggle `allow_over_budget` to block or allow deficit spending.
  - Custom category manager (Food, Transport, Education, Shopping, Health, Home, Bills, Personal, Other).

#### 2. Family Member Portal (`/member/*`)
- **Strict Data Isolation**: Family members can **never** access admin reports, family totals, or other members' expenses.
- **Hero Budget Card**:
  - Live Remaining Budget in PKR (`Rs. 22,450`).
  - Animated SVG Progress Ring showing available budget and utilization percentage.
  - Total allocated and total spent metrics.
- **Suggested Daily Pace**: Dynamically computed guidance metric (`Remaining Budget / Days Remaining`, e.g., `Rs. 620/day`).
- **Add Expense Modal / Bottom Sheet**:
  - Desktop centered modal and mobile-friendly bottom sheet.
  - Amount in PKR, category icon picker, description, date.
  - Instant server/store deduction with celebratory confetti and toast feedback.
- **Expense History**: Tabbed period filters (Today, 7 Days, 10 Days, 30 Days, All) with instant search and category filters.
- **Personal Analytics**: Personal donut category breakdown and daily spending bar chart (strictly personal data only).
- **Gamification & Feedback**:
  - Friendly non-judgmental guidance (*Healthy*, *Pace Increasing*, *Budget Running Low*, *Over Budget*).
  - Habit Milestone badges (*Budget Master*, *Smart Spender*, *Consistent Tracker*, *Savings Champion*).
- **Mobile-First Experience**: 5-tab responsive bottom navigation with a prominent center **+ Add Expense** action button.

---

## 📐 Financial Calculation Engine

Calculations are never left to client discretion; all calculations are executed through standard formula validations:

- **Remaining Budget**: $\text{Allocated} - \sum(\text{valid expenses in budget period})$
- **Spent Percentage**: $(\text{Total Spent} / \text{Allocated}) \times 100$
- **Remaining Percentage**: $(\text{Remaining} / \text{Allocated}) \times 100$
- **Suggested Daily Pace**: $\max(0, \text{Remaining Budget} / \text{Days Remaining})$
- **Budget Health Status**:
  - `healthy`: Spent $\le 85\%$ of allocation
  - `watch`: Spent $> 85\%$ and $\le 100\%$ of allocation
  - `over_budget`: Spent $> \text{Allocated}$

---

## 🗄️ Database Schema & Security (Supabase / PostgreSQL)

The complete SQL schema with Row-Level Security (RLS) is located at `supabase/schema.sql`:
- `profiles`: User information with `role` (`admin` | `member`) and `status` (`active` | `inactive`).
- `family_settings`: Currency, timezone, and `allow_over_budget` toggle.
- `categories`: Category icons, hex colors, and status.
- `budgets`: Member-allocated sums with date ranges and audit tracking.
- `expenses`: Ledger entries validated against active budget periods and member ownership.
- `notifications`: User-targeted alerts and warnings.
- `audit_logs`: Detailed tracking of administrator actions.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Financial Tests
```bash
npm test
```
All financial calculation core logic is covered by automated unit tests (`lib/calculations/financial.test.ts`).

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Build for Production
```bash
npm run build
npm start
```

---

## 🎭 Demo Credentials & 1-Click Persona Switcher

The application comes pre-loaded with realistic sample data matching Section 49 of the specification:
- **Tariq Al-Rashid (Admin)**: `admin@family.com` (Full family management)
- **Awais Al-Rashid (Member)**: `awais@family.com` (Allocated: Rs. 30,000 | Spent: Rs. 7,550)
- **Ali Al-Rashid (Member)**: `ali@family.com` (Allocated: Rs. 20,000 | Spent: Rs. 11,300)
- **Sara Al-Rashid (Member)**: `sara@family.com` (Allocated: Rs. 25,000 | Spent: Rs. 18,900)
- **Ahmed Al-Rashid (Member)**: `ahmed@family.com` (Allocated: Rs. 15,000 | Spent: Rs. 7,450)
- **Hira Al-Rashid (Member)**: `hira@family.com` (Allocated: Rs. 20,000 | Spent: Rs. 1,100)
- **Fatima Al-Rashid (Member)**: `fatima@family.com` (Allocated: Rs. 10,000 | Spent: Rs. 9,800 - Near Limit)

You can also use the **Persona Switcher** in the top navigation bar to seamlessly switch between Admin and Member accounts without signing out.
