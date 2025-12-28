# Architecture - Simplify & Summarize SaaS

## SOLID Design Principles

- **SRP**: Each service handles one responsibility (Crawler, Processor, Content Server)
- **OCP**: Content processors extensible via strategy pattern (summarize, simplify, future modes)
- **LSP**: All content processors implement common interface, substitutable
- **ISP**: Small, focused interfaces (ICrawler, IProcessor, IContentStore)
- **DIP**: Services depend on abstractions, not concrete implementations

---

## Technology Stack

| Layer           | Technology                                    |
|-----------------|-----------------------------------------------|
| Framework       | Next.js (App Router) + TypeScript             |
| Styling         | Tailwind CSS                                  |
| Auth            | Clerk                                         |
| Database        | Supabase (PostgreSQL)                         |
| AI              | Vercel AI SDK + Anthropic                     |
| Edge Functions  | Vercel Edge                                   |
| Background Jobs | BullMQ / Vercel Cron                          |
| Crawling        | Puppeteer/Playwright + Cheerio                |
| Deployment      | Vercel                                        |
| Dev Environment | GitHub Codespaces                             |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CUSTOMER WEBSITE                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  <script src="widget.js?key=xxx"></script>                │  │
│  │                                                           │  │
│  │  ┌─────────────────┐                                      │  │
│  │  │ [Simplify]      │  ← Visitor clicks                    │  │
│  │  │ [Summarize]     │                                      │  │
│  │  └─────────────────┘                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      VERCEL EDGE FUNCTION                       │
│  • Validates API key                                            │
│  • Looks up pre-generated content by URL                        │
│  • Returns cached simplified/summarized content                 │
│  • <50ms response time globally                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ customers   │  │ pages       │  │ processed_content       │  │
│  │ - id        │  │ - id        │  │ - id                    │  │
│  │ - api_key   │  │ - url       │  │ - page_id               │  │
│  │ - domain    │  │ - customer  │  │ - type (simplify/sum)   │  │
│  │ - plan      │  │ - status    │  │ - content               │  │
│  └─────────────┘  └─────────────┘  │ - approved              │  │
│                                    └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components (SOLID)

### 1. Content Processor (SRP + OCP)

```typescript
// Interface - depends on abstraction (DIP)
interface IContentProcessor {
  process(content: string): Promise<string>
}

// Implementations - open for extension (OCP)
class SimplifyProcessor implements IContentProcessor { }
class SummarizeProcessor implements IContentProcessor { }
// Future: TranslateProcessor, AudioProcessor, etc.
```

### 2. Crawler Service (SRP)

- Single responsibility: Fetch and extract page content
- Input: URL list
- Output: Raw HTML/text content

### 3. Content Server (SRP)

- Single responsibility: Serve pre-generated content
- Edge function for low latency
- Validates API keys, returns content

### 4. QA Dashboard (SRP)

- Single responsibility: Review and approve content
- Lists pending content
- Side-by-side original vs processed view
- Approve/reject/edit actions

---

## Data Flow

### Customer Onboarding

```
Customer signs up
       ↓
Submits URL list (or sitemap)
       ↓
Crawler fetches pages
       ↓
Processor generates simplified + summarized versions
       ↓
Content stored in DB (status: pending)
       ↓
Customer reviews in QA Dashboard
       ↓
Customer approves content (status: approved)
       ↓
Widget goes live
```

### Visitor Request Flow

```
Visitor clicks widget button
       ↓
Widget calls Edge Function (GET /api/content?url=X&type=simplify)
       ↓
Edge Function validates API key
       ↓
Fetches approved content from DB
       ↓
Returns content (<50ms)
       ↓
Widget displays in modal/panel
```

---

## API Design

### Public API (Edge Function)

```
GET /api/v1/content
  ?url=https://example.com/page
  &type=simplify|summarize
  Headers: X-API-Key: xxx

Response: { content: "...", generatedAt: "..." }
```

### Internal API (Dashboard)

```
POST /api/crawl          - Start crawl job
GET  /api/pages          - List pages for customer
GET  /api/content/:id    - Get processed content
PUT  /api/content/:id    - Update/approve content
```

---

## Deployment Pipeline

```
Feature Development
       ↓
GitHub Codespaces (local dev + test)
       ↓
Push to feature branch
       ↓
Vercel Preview Deployment (auto)
       ↓
PR Review
       ↓
Merge to main
       ↓
Vercel Production Deployment (auto)
       ↓
Supabase (shared production DB)
```

---

## Security Considerations

### Widget Security

- API keys scoped to specific domains (CORS validation)
- Rate limiting per API key
- Content-Security-Policy headers

### Application Security

- Clerk handles auth (no custom auth code)
- Supabase Row-Level Security (RLS) for data isolation
- Input validation on all endpoints

### Content Safety

- CAPTCHA: Cloudflare Turnstile (free, privacy-friendly)
- Content moderation: Flag inappropriate source content
- No PII storage from crawled pages

### API Security

- Rate limiting (per API key + global)
- Request size limits
- Timeout limits on crawl jobs

---

## Monitoring & Observability

### Key Metrics

| Category | Metrics |
|----------|---------|
| Widget   | Request latency, error rate, cache hit rate |
| Crawler  | Pages processed, failures, queue depth |
| Business | Customers, pages processed, API calls |

### Tools

- **Error tracking**: Sentry
- **Analytics**: Vercel Analytics (built-in)
- **Logs**: Vercel Logs + Supabase Logs

---

## Post-MVP: Chat Agent

### Purpose

Allow visitors to ask follow-up questions about page content beyond the pre-generated summary/simplification. The agent answers questions grounded in the actual page content.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        VISITOR WIDGET                           │
│  ┌─────────────────┐  ┌──────────────────────────────────────┐  │
│  │ [Simplify]      │  │ Chat Panel                           │  │
│  │ [Summarize]     │  │ ┌──────────────────────────────────┐ │  │
│  │ [Ask Question]  │  │ │ User: What does section 3 mean? │ │  │
│  └─────────────────┘  │ │ Agent: Section 3 explains...    │ │  │
│                       │ └──────────────────────────────────┘ │  │
│                       └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CHAT API ENDPOINT                          │
│  • Receives question + page URL                                 │
│  • Retrieves original page content from DB                      │
│  • Calls Anthropic with content as context                      │
│  • Streams response back to widget                              │
└─────────────────────────────────────────────────────────────────┘
```

### AI Configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **Model** | claude-sonnet-4-20250514 | Balance of speed and quality |
| **Temperature** | 0.1 - 0.3 | Low - answers must be grounded in source content |
| **Max Tokens** | 1024 | Concise answers, not essays |
| **System Prompt** | See below | Strict grounding instructions |

### System Prompt Guidelines

```
You are a helpful assistant that answers questions about a specific webpage.

CRITICAL RULES:
1. ONLY answer based on the provided page content
2. If the answer is not in the content, say "I don't see that information on this page"
3. Never make up information or use external knowledge
4. Keep answers concise and direct
5. Quote relevant sections when helpful

Page content:
{page_content}
```

### Data Flow

```
Visitor asks question
       ↓
Widget sends: { question, pageUrl, apiKey }
       ↓
API validates API key
       ↓
Fetches original page content from DB
       ↓
Constructs prompt with content as context
       ↓
Calls Anthropic API (streaming)
       ↓
Streams response back to widget
       ↓
Optionally stores conversation for analytics
```

### Database Additions

```sql
-- conversations table (optional, for analytics)
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  page_id UUID REFERENCES pages(id),
  customer_id UUID REFERENCES customers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT CHECK (role IN ('user', 'assistant')),
  content TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Design

```
POST /api/v1/chat
  Headers: X-API-Key: xxx
  Body: {
    "pageUrl": "https://example.com/page",
    "question": "What does this section mean?",
    "conversationId": "optional-for-context"
  }

Response: Server-Sent Events (streaming)
  data: {"content": "Based on the page..."}
  data: {"content": " section 3 explains..."}
  data: [DONE]
```

### Rate Limiting

| Limit | Value | Rationale |
|-------|-------|-----------|
| Per API key | 100 req/min | Prevent abuse |
| Per conversation | 20 messages | Keep conversations focused |
| Per page | 1000 req/day | Fair usage across customers |

### Cost Control

- Track token usage per customer
- Set monthly token budgets per plan tier
- Alert customers approaching limits
- Hard cutoff at limit (or overage billing)
