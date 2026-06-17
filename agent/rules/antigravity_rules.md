# Antigravity SDK Job Hunt Agent: Rules & Best Practices

This document outlines the architectural guidelines, best practices, and rules for building a zero-cost job hunting agent using the Google Antigravity SDK, Gemini 1.5, Playwright, Google Sheets, and GitHub Actions.

## 1. Project Structure

A clean, modular structure is critical for Antigravity agents to keep reasoning and execution separate.

```text
job-hunt-agent/
├── agent/
│   ├── index.ts              # Agent definition and initialization
│   ├── system_prompt.md      # Core persona and instructions for Gemini
│   └── plugins.ts            # Antigravity plugin configurations
├── tools/
│   ├── index.ts              # Tool registry
│   ├── scrape_lever.ts       # Specific Lever scraper tool
│   ├── scrape_greenhouse.ts  # Specific Greenhouse scraper tool
│   ├── fallback_dom_parse.ts # Fallback DOM parser for unknown ATS
│   └── sheets_state.ts       # Google Sheets API wrappers for state management
├── workflows/
│   └── main.ts               # GitHub Actions entrypoint and main agent loop
├── .github/
│   └── workflows/
│       └── job_hunt.yml      # GitHub Actions configuration (cron triggers)
├── package.json
└── tsconfig.json
```

**Guidelines:**
- **Decouple Prompts:** Keep large system prompts in `.md` files so they can be easily edited and version-controlled separately from the code.
- **Modular Tools:** Each ATS should have its own dedicated tool (e.g., `scrape_lever`, `scrape_greenhouse`) to abstract away the specific DOM structures from the main agent reasoning loop.

## 2. Defining and Registering Tools

Tools are the bridge between the Antigravity agent and the outside world.

- **Single Responsibility Principle:** Each tool must do exactly one thing. Do not mix Lever parsing and Google Sheets updating in the same tool.
- **Robust Schemas:** Define strict, comprehensive JSON schemas (or use Zod) for tool parameters. This drastically reduces hallucinations from Gemini.
- **Graceful Error Handling:** Tools should **never** throw unhandled exceptions that crash the agent. Instead, catch errors and return descriptive string messages (e.g., `"Error: Rate limit exceeded for Google Sheets, please try again in 60s"`). The Antigravity agent can read this and decide to wait or use a fallback.
- **Example Tools:**
  - `scrape_lever(url: string)`: Returns structured JSON containing job title, description, and required form fields.
  - `fallback_dom_parse(url: string, selector?: string)`: Uses Playwright to extract raw text when an unknown ATS is encountered.

## 3. Managing Gemini 1.5 Free-Tier Rate Limits (15 RPM)

Running on the free tier requires strict token and request management.

- **Explicit Delays:** The Antigravity SDK or your main loop should implement a token bucket or simple sleep mechanism. If the agent makes >10 requests in a minute, force a `sleep(60000)` to ensure you never hit a hard `429 Too Many Requests` error.
- **Batch Processing:** Do not ask Gemini to evaluate job postings one by one. Use Playwright to scrape 10-20 job summaries, format them into a single prompt, and ask Gemini to filter the entire batch in one API call.
- **DOM Compression:** Never send raw HTML to Gemini. Strip `<script>`, `<style>`, SVG paths, and hidden elements. Convert the DOM to clean Markdown or structured JSON before feeding it to the model to save tokens.
- **Caching:** Cache responses for static tasks. If the agent needs to classify if a company is B2B or B2C, save the result in Google Sheets. Check the cache before calling Gemini.

## 4. Playwright Best Practices (Avoiding Bot Detection)

Lever and Greenhouse are relatively lenient, but aggressive scraping will trigger Cloudflare or reCAPTCHA.

- **Use Stealth Plugins:** Always wrap Playwright with `playwright-extra` and `puppeteer-extra-plugin-stealth` to mask WebDriver properties, spoof user agents, and handle basic fingerprinting.
- **Human-like Interaction:** 
  - Randomize typing speeds (e.g., `page.type(selector, text, { delay: 50 + Math.random() * 50 })`).
  - Add random delays (1-3 seconds) between navigating pages and clicking 'Apply'.
- **Headless Evasion:** Some ATS providers detect strict headless browsers. In GitHub Actions, you can run Playwright in headed mode using a virtual framebuffer (`xvfb-run -- auto npx playwright test`).
- **Header Optimization:** Ensure standard headers (`Accept-Language`, `Sec-Fetch-Site`, `Sec-Fetch-Mode`) match those of a real browser session.

## 5. Error Handling and State Recovery in GitHub Actions

GitHub Actions runners are ephemeral. If a run times out or crashes, all local memory is wiped. 

- **Google Sheets as the Source of Truth:** Treat Google Sheets as a low-latency database. Update the state immediately after every significant action.
  - Statuses: `DISCOVERED`, `EVALUATING`, `APPLYING`, `APPLIED`, `FAILED`, `SKIPPED`.
- **Checkpointing:** Before starting a complex task (like filling a multi-page application), mark the job as `APPLYING` in Sheets. If the GitHub Action hits its time limit and dies, the next cron job will know to pick up where it left off or mark it as `FAILED` if it's stuck.
- **Timeout Management:** GitHub Actions can run for up to 6 hours, but for a free tier agent, it's safer to limit runs to 15-30 minutes. Monitor execution time within your Antigravity loop; if you approach the timeout limit, cleanly exit the process, flush logs, and wait for the next cron trigger.
- **Idempotency:** Ensure the agent cannot accidentally apply to the same job twice. The very first step of an apply workflow must be checking Google Sheets to verify the job URL hasn't already been processed.
