# Product Requirements Document (PRD)
**Product Name:** Zero-Cost Job Hunt Agent
**Framework:** Google Antigravity SDK
**Version:** 1.0.0

## 1. Product Objective
Build a fully autonomous, zero-cost AI agent that sources job postings, evaluates candidate fit using an LLM, and automatically submits applications to supported Applicant Tracking Systems (ATS).

## 2. Core Components

### 2.1 Workflow A: The Scraper (Sourcing)
- **Objective:** Continuously find new job postings.
- **Sources:** RSS Feeds (e.g., WeWorkRemotely) and targeted company job boards.
- **Execution:** Runs via GitHub Actions cron schedule every 4 hours.
- **Data Storage:** Raw data is inserted into the Supabase Postgres database with a `PENDING` status.

### 2.2 Workflow B: The Evaluator (Brain)
- **Objective:** Evaluate if a pending job matches the candidate's profile.
- **Filtering:** Performs a regex pass to filter out mismatched seniorities.
- **LLM Engine:** Gemini 2.5 Flash via Google AI Studio Free Tier (Max 15 RPM).
- **Process:** Performs a 1:1 evaluation (Master Resume vs Job Description).
- **Data Storage:** Evaluated jobs are updated in the Supabase Postgres database to an `EVALUATED` status with a match score (0-100).

### 2.3 Workflow C: The Auto-Applier (Execution)
- **Objective:** Submit job applications autonomously.
- **Trigger:** Any job scoring > 85 in the `Evaluated` tab.
- **Automation Engine:** Playwright with stealth plugins to evade bot detection.
- **Logging & Notification:** Updates job status to `APPLIED` in Supabase Postgres and sends an email notification via Resend API upon success or failure.

## 3. Strict Project Constraints & Guardrails

### 3.1 Auto-Apply Restrictions
- **Initial Human Check:** The agent MUST require explicit human approval via email for the first 10 auto-applications to ensure no hallucinations occur during form-filling.
- **ATS Targeting:** The Auto-Applier is restricted to **Greenhouse** and **Lever** job postings only. Workday and Taleo must be ignored or flagged for manual review.
- **Cover Letters:** The agent will only generate and attach a cover letter PDF if the application form explicitly marks it as a required field.

### 3.2 Infrastructure & Cost
- **Budget:** $0.00. 
- **Compute:** Ephemeral GitHub Actions.
- **Database:** Supabase Postgres (Free Tier).
- **Notifications:** Resend API.

## 4. Key Performance Indicators (KPIs)
- **Scrape Rate:** Number of jobs discovered daily.
- **Match Accuracy:** Human-verified alignment of jobs scoring > 85.
- **Application Success Rate:** Percentage of Playwright scripts that successfully submit the form without failing on CAPTCHAs or broken DOM selectors.

## 5. Security & Privacy
- **Resume Protection:** Ensure the master resume data is not inadvertently exposed or published.
- **Secret Management:** GitHub Actions Secrets must be used for Supabase credentials, Gemini API keys, and Resend API keys.
