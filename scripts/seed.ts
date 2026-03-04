import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FalkorDB } from "falkordb";
import type { NewsCategory, NewsItem } from "../src/lib/types";

const FALKORDB_HOST = process.env.FALKORDB_HOST ?? "localhost";
const FALKORDB_PORT = Number.parseInt(process.env.FALKORDB_PORT ?? "6379", 10);
const FALKORDB_USERNAME = process.env.FALKORDB_USERNAME;
const FALKORDB_PASSWORD = process.env.FALKORDB_PASSWORD;

function formatDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

const dates = {
  dayBefore: formatDate(2),
  yesterday: formatDate(1),
  today: formatDate(0),
};

function item(
  id: string,
  headline: string,
  summary: string,
  category: NewsCategory,
  opts: {
    takeaway?: string;
    source?: string;
    url?: string;
    relatedTo?: string[];
  } = {},
): NewsItem {
  return {
    id,
    headline,
    summary,
    category,
    ...(opts.takeaway ? { takeaway: opts.takeaway } : {}),
    ...(opts.source ? { source: opts.source } : {}),
    ...(opts.url ? { url: opts.url } : {}),
    ...(opts.relatedTo ? { relatedTo: opts.relatedTo } : {}),
  };
}

const dayBeforeItems: NewsItem[] = [
  item(
    "claude-5-release",
    "Anthropic Releases Claude 5 with Native Tool Use",
    "Anthropic launched Claude 5 today, featuring built-in tool use, 1M context window, and improved reasoning. Early benchmarks show significant gains on MMLU and HumanEval.",
    "LLMs",
    {
      takeaway:
        "Claude 5 sets a new bar for agentic AI with native tool orchestration.",
      source: "Anthropic Blog",
      url: "https://www.anthropic.com/news/claude-5",
    },
  ),
  item(
    "mistral-series-c",
    "Mistral AI Closes $1.2B Series C at $12B Valuation",
    "French AI lab Mistral raised $1.2 billion led by General Atlantic, with participation from Lightspeed and Andreessen Horowitz. The funds will go toward training next-gen open-weight models.",
    "Funding",
    {
      takeaway: "Mistral becomes Europe's most valuable AI startup.",
      source: "TechCrunch",
      url: "https://techcrunch.com/2026/03/mistral-series-c",
    },
  ),
  item(
    "vllm-0.8",
    "vLLM 0.8 Ships with Speculative Decoding and Multi-LoRA",
    "The popular open-source inference engine hit v0.8 with speculative decoding support, multi-LoRA serving, and 40% throughput gains on A100 clusters.",
    "Open Source",
    {
      takeaway: "vLLM continues to dominate the open-source inference stack.",
      source: "GitHub",
      url: "https://github.com/vllm-project/vllm/releases/tag/v0.8.0",
    },
  ),
  item(
    "eu-ai-act-enforcement",
    "EU AI Act Enforcement Begins for High-Risk Systems",
    "The European AI Act's high-risk system provisions went into effect today, requiring conformity assessments for AI used in hiring, credit scoring, and law enforcement.",
    "Regulation",
    {
      source: "Reuters",
      url: "https://www.reuters.com/technology/eu-ai-act-enforcement-2026",
    },
  ),
  item(
    "deepseek-moe-paper",
    "DeepSeek Publishes MoE Scaling Laws Paper",
    "DeepSeek released a paper detailing scaling laws for mixture-of-experts architectures, showing that sparse MoE models achieve GPT-4 quality at 1/5 the compute cost.",
    "Research",
    {
      takeaway:
        "MoE scaling laws could reshape how labs allocate training budgets.",
      source: "arXiv",
      url: "https://arxiv.org/abs/2603.01234",
      relatedTo: ["claude-5-release"],
    },
  ),
  item(
    "codeium-windsurf-launch",
    "Codeium Launches Windsurf IDE with Agentic Coding",
    "Codeium released Windsurf, a full IDE built around agentic AI workflows. It features multi-file edits, terminal integration, and autonomous task execution.",
    "Product",
    {
      source: "Codeium Blog",
      url: "https://codeium.com/blog/windsurf-launch",
    },
  ),
  item(
    "trending-llamaindex-ts",
    "LlamaIndex.TS Trending on GitHub",
    "LlamaIndex's TypeScript port gained 2,400 stars this week after adding a streaming RAG pipeline and Vercel AI SDK integration.",
    "GitHub Trending",
    {
      source: "GitHub Trending",
      url: "https://github.com/run-llama/LlamaIndexTS",
    },
  ),
  item(
    "nvidia-blackwell-shipments",
    "NVIDIA Begins Volume Blackwell Shipments",
    "NVIDIA started shipping Blackwell B200 GPUs at scale, with hyperscalers receiving initial allocations. Performance benchmarks show 2.5x inference throughput over H100.",
    "Infra",
    {
      takeaway:
        "Blackwell availability could accelerate the shift to larger frontier models.",
      source: "The Information",
      url: "https://www.theinformation.com/nvidia-blackwell-shipments",
      relatedTo: ["vllm-0.8"],
    },
  ),
];

const yesterdayItems: NewsItem[] = [
  item(
    "claude-5-benchmarks",
    "Claude 5 Benchmarks: 92% on GPQA, State-of-the-Art on SWE-Bench",
    "Independent evaluations confirm Claude 5 achieves 92% on GPQA Diamond and 64% on SWE-Bench Verified, surpassing GPT-4o and Gemini Ultra across most categories.",
    "LLMs",
    {
      takeaway:
        "Claude 5 leads on reasoning-heavy benchmarks, though coding gaps remain on some tasks.",
      source: "Artificial Analysis",
      url: "https://artificialanalysis.ai/models/claude-5",
      relatedTo: ["claude-5-release"],
    },
  ),
  item(
    "vllm-claude5-support",
    "vLLM Adds Claude 5 API Compatibility Layer",
    "The vLLM team shipped an adapter allowing Claude 5's API format to be served through vLLM's OpenAI-compatible endpoint, enabling drop-in migration.",
    "Open Source",
    {
      source: "GitHub",
      url: "https://github.com/vllm-project/vllm/pull/9876",
      relatedTo: ["vllm-0.8", "claude-5-release"],
    },
  ),
  item(
    "openai-codex-agent",
    "OpenAI Launches Codex Agent for Autonomous Software Engineering",
    "OpenAI released Codex Agent, a cloud-hosted coding agent that can clone repos, run tests, and submit PRs autonomously. Available to ChatGPT Pro and Enterprise users.",
    "Product",
    {
      takeaway:
        "The coding agent wars are heating up between OpenAI, Anthropic, and Codeium.",
      source: "OpenAI Blog",
      url: "https://openai.com/blog/codex-agent",
      relatedTo: ["codeium-windsurf-launch"],
    },
  ),
  item(
    "databricks-acquires-tabular",
    "Databricks Acquires Tabular for $2B",
    "Databricks acquired Tabular, the company behind Apache Iceberg, for $2 billion. The deal consolidates the open table format ecosystem under the Databricks umbrella.",
    "Funding",
    {
      source: "Bloomberg",
      url: "https://bloomberg.com/news/databricks-tabular-acquisition",
    },
  ),
  item(
    "apple-on-device-llm",
    "Apple Previews On-Device LLM Framework at WWDC",
    "Apple announced Foundation Models framework at WWDC, bringing on-device LLM inference to iOS 26. The 3B parameter model runs entirely on-device with ~30 tokens/sec on iPhone 17 Pro.",
    "Product",
    {
      takeaway:
        "On-device inference goes mainstream — no cloud roundtrip needed.",
      source: "Apple Newsroom",
      url: "https://developer.apple.com/foundation-models",
    },
  ),
  item(
    "eu-ai-compliance-tools",
    "Startups Race to Build EU AI Act Compliance Tooling",
    "At least five startups have launched compliance platforms for the EU AI Act, offering automated risk classification, documentation generation, and audit trails.",
    "Regulation",
    {
      source: "Sifted",
      url: "https://sifted.eu/articles/ai-act-compliance-startups",
      relatedTo: ["eu-ai-act-enforcement"],
    },
  ),
  item(
    "trending-instructor",
    "Instructor Library Passes 10k GitHub Stars",
    "Jason Liu's Instructor library for structured LLM outputs crossed 10,000 stars, driven by its Pydantic-based schema validation and multi-provider support.",
    "GitHub Trending",
    {
      source: "GitHub Trending",
      url: "https://github.com/jxnl/instructor",
    },
  ),
  item(
    "google-tpu-v6",
    "Google Announces TPU v6 Trillium with 4x Performance Gains",
    "Google unveiled TPU v6 (Trillium) at Cloud Next, claiming 4x performance over TPU v5e for both training and inference. Available in preview on GCP.",
    "Infra",
    {
      takeaway:
        "The AI chip race intensifies as Google closes the gap with NVIDIA.",
      source: "Google Cloud Blog",
      url: "https://cloud.google.com/blog/tpu-v6-trillium",
      relatedTo: ["nvidia-blackwell-shipments"],
    },
  ),
  item(
    "robotics-figure-02",
    "Figure 02 Humanoid Robot Deployed in BMW Factory",
    "Figure AI's second-generation humanoid robot began working alongside humans at BMW's Spartanburg plant, handling parts transfer and quality inspection tasks.",
    "Robotics",
    {
      source: "Figure AI",
      url: "https://figure.ai/news/bmw-deployment",
    },
  ),
];

const todayItems: NewsItem[] = [
  item(
    "claude-5-enterprise",
    "Anthropic Launches Claude 5 Enterprise with Extended Thinking",
    "Anthropic rolled out Claude 5 Enterprise tier with extended thinking mode, audit logging, and SSO. The extended thinking feature lets Claude reason for up to 128k tokens before responding.",
    "LLMs",
    {
      takeaway:
        "Extended thinking positions Claude 5 as the go-to for complex enterprise workflows.",
      source: "Anthropic Blog",
      url: "https://www.anthropic.com/news/claude-5-enterprise",
      relatedTo: ["claude-5-release", "claude-5-benchmarks"],
    },
  ),
  item(
    "mistral-large-3",
    "Mistral Releases Mistral Large 3 — Open Weights, 405B Parameters",
    "Days after its massive funding round, Mistral released its largest model yet as open weights. Mistral Large 3 matches GPT-4o on most benchmarks while being freely downloadable.",
    "LLMs",
    {
      takeaway: "Open-weight models are catching up to closed frontier models.",
      source: "Mistral Blog",
      url: "https://mistral.ai/news/mistral-large-3",
      relatedTo: ["mistral-series-c", "deepseek-moe-paper"],
    },
  ),
  item(
    "cursor-agent-mode",
    "Cursor Adds Agent Mode with Multi-File Editing",
    "Cursor's new agent mode can plan and execute multi-file changes, run terminal commands, and iterate on test failures — directly competing with Windsurf and Codex Agent.",
    "Product",
    {
      takeaway:
        "Every IDE is converging on agentic coding as the core differentiator.",
      source: "Cursor Blog",
      url: "https://cursor.com/blog/agent-mode",
      relatedTo: ["codeium-windsurf-launch", "openai-codex-agent"],
    },
  ),
  item(
    "cloudflare-ai-gateway",
    "Cloudflare AI Gateway Hits 1B Requests/Day",
    "Cloudflare's AI Gateway, which provides caching, rate limiting, and observability for LLM API calls, crossed 1 billion daily requests. The company announced a free tier expansion.",
    "Infra",
    {
      source: "Cloudflare Blog",
      url: "https://blog.cloudflare.com/ai-gateway-billion",
    },
  ),
  item(
    "openai-safety-board",
    "OpenAI Appoints Independent AI Safety Board",
    "OpenAI announced a new independent safety board with veto power over model releases, following months of public pressure. Board members include AI researchers and ethicists.",
    "Regulation",
    {
      source: "The New York Times",
      url: "https://nytimes.com/2026/03/openai-safety-board",
      relatedTo: ["eu-ai-act-enforcement"],
    },
  ),
  item(
    "arxiv-diffusion-reasoning",
    "New Paper: Diffusion Models Can Learn to Reason",
    "Researchers from Stanford and Google DeepMind show that diffusion-based language models can perform multi-step reasoning when trained with chain-of-thought data, challenging the transformer-only paradigm.",
    "Research",
    {
      takeaway:
        "Diffusion LMs could offer an alternative architecture for reasoning tasks.",
      source: "arXiv",
      url: "https://arxiv.org/abs/2603.04567",
      relatedTo: ["deepseek-moe-paper"],
    },
  ),
  item(
    "trending-aider",
    "Aider CLI Gains 1,800 Stars After Agent Protocol Support",
    "The terminal-based AI coding assistant Aider added Agent Protocol support, enabling it to be orchestrated by any agent framework. Weekly star count hit an all-time high.",
    "GitHub Trending",
    {
      source: "GitHub Trending",
      url: "https://github.com/paul-gauthier/aider",
      relatedTo: ["cursor-agent-mode"],
    },
  ),
  item(
    "humanoid-tesla-optimus",
    "Tesla Optimus Gen 3 Walks Unassisted in Demo",
    "Tesla showed Optimus Gen 3 walking unassisted on uneven terrain at its AI Day event. The robot uses a vision-only navigation system inspired by FSD.",
    "Robotics",
    {
      source: "Tesla",
      url: "https://tesla.com/ai-day-2026",
      relatedTo: ["robotics-figure-02"],
    },
  ),
  item(
    "scale-ai-government",
    "Scale AI Wins $500M DoD Contract for Data Labeling",
    "Scale AI secured a $500M multi-year contract with the Department of Defense for AI training data curation and evaluation, the largest government AI data contract to date.",
    "Funding",
    {
      source: "Defense One",
      url: "https://www.defenseone.com/scale-ai-dod-contract",
      relatedTo: ["mistral-series-c"],
    },
  ),
  item(
    "vision-segment-anything-2",
    "Meta Releases Segment Anything 2 for Video",
    "Meta AI released SAM 2, extending the Segment Anything model to video with real-time object tracking. The model processes 24fps video on a single GPU.",
    "Vision",
    {
      source: "Meta AI Blog",
      url: "https://ai.meta.com/sam2",
    },
  ),
];

const fixturesByDate: Record<string, NewsItem[]> = {
  [dates.dayBefore]: dayBeforeItems,
  [dates.yesterday]: yesterdayItems,
  [dates.today]: todayItems,
};

async function seed() {
  const isCloud = FALKORDB_HOST.includes(".cloud");

  const db = await FalkorDB.connect({
    socket: {
      host: FALKORDB_HOST,
      port: FALKORDB_PORT,
      ...(isCloud ? { tls: true } : {}),
    },
    ...(FALKORDB_USERNAME ? { username: FALKORDB_USERNAME } : {}),
    ...(FALKORDB_PASSWORD ? { password: FALKORDB_PASSWORD } : {}),
  });

  const graph = db.selectGraph("uptodaty");

  try {
    console.log(`Connected to FalkorDB at ${FALKORDB_HOST}:${FALKORDB_PORT}`);

    console.log("Clearing all data...");
    try {
      await graph.query("MATCH (n) DETACH DELETE n");
    } catch {
      // graph may not exist yet
    }

    console.log("Creating indexes...");
    const indexQueries = [
      "CREATE INDEX FOR (n:NewsItem) ON (n.id)",
      "CREATE INDEX FOR (n:NewsItem) ON (n.date)",
      "CREATE INDEX FOR (d:DailyIssue) ON (d.date)",
    ];
    for (const query of indexQueries) {
      try {
        await graph.query(query);
      } catch {
        // index already exists
      }
    }

    for (const [date, items] of Object.entries(fixturesByDate)) {
      await graph.query(
        `
        MERGE (issue:DailyIssue {date: $date})
        ON CREATE SET issue.createdAt = localdatetime()
        WITH issue
        UNWIND $items AS item
        MERGE (n:NewsItem {id: item.id})
        ON CREATE SET
          n.headline  = item.headline,
          n.summary   = item.summary,
          n.takeaway  = item.takeaway,
          n.category  = item.category,
          n.source    = item.source,
          n.url       = item.url,
          n.date      = $date
        MERGE (n)-[:PUBLISHED_IN]->(issue)
        `,
        {
          params: {
            date,
            items: items.map((i) => ({
              id: i.id,
              headline: i.headline,
              summary: i.summary,
              takeaway: i.takeaway ?? null,
              category: i.category,
              source: i.source ?? null,
              url: i.url ?? null,
            })),
          },
        },
      );

      const pairs: Array<{ fromId: string; toId: string }> = [];
      for (const i of items) {
        if (i.relatedTo) {
          for (const targetId of i.relatedTo) {
            pairs.push({ fromId: i.id, toId: targetId });
          }
        }
      }

      if (pairs.length > 0) {
        await graph.query(
          `
          UNWIND $pairs AS pair
          MATCH (a:NewsItem {id: pair.fromId})
          MATCH (b:NewsItem {id: pair.toId})
          MERGE (a)-[:RELATED_TO]->(b)
          `,
          { params: { pairs } },
        );
      }

      console.log(
        `  ${date}: ${items.length} items, ${pairs.length} relations`,
      );
    }

    const cacheDir = join(process.cwd(), ".next", "cache", "news");
    if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

    for (const [date, items] of Object.entries(fixturesByDate)) {
      writeFileSync(
        join(cacheDir, `${date}.json`),
        JSON.stringify(items, null, 2),
      );
    }
    console.log(`Dev cache written to ${cacheDir}`);

    const totalItems = Object.values(fixturesByDate).reduce(
      (sum, items) => sum + items.length,
      0,
    );
    console.log(
      `\nDone — ${totalItems} items across ${Object.keys(fixturesByDate).length} days`,
    );
  } finally {
    db.close();
  }
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
