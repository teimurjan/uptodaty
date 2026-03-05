export type VerticalId = "ai" | "software-engineering" | "web3";

interface VerticalSourceConfig {
  reddit: { subreddits: string[] };
  github: { topics: string[] };
}

export interface VerticalPromptConfig {
  audience: string;
  focusAreas: string[];
  categories: string[];
  ignoreList: string[];
}

export interface Vertical {
  id: VerticalId;
  label: string;
  description: string;
  sources: VerticalSourceConfig;
  prompt: VerticalPromptConfig;
}

export const VERTICALS: Record<VerticalId, Vertical> = {
  ai: {
    id: "ai",
    label: "Artificial Intelligence",
    description: "LLMs, infra, research, and open-source tooling",
    sources: {
      reddit: {
        subreddits: ["MachineLearning", "LocalLLaMA", "artificial"],
      },
      github: {
        topics: [
          "machine-learning",
          "large-language-models",
          "artificial-intelligence",
          "deep-learning",
          "llm",
          "generative-ai",
        ],
      },
    },
    prompt: {
      audience: "senior AI engineers",
      focusAreas: [
        "LLM releases",
        "open-source tools",
        "frameworks",
        "infrastructure",
        "funding rounds",
        "research papers with practical impact",
        "product launches",
        "developer tools",
        "regulation affecting AI engineers",
      ],
      categories: [
        "LLMs",
        "Open Source",
        "Funding",
        "Infra",
        "Research",
        "Product",
        "Regulation",
        "Robotics",
        "Vision",
        "GitHub Trending",
        "General",
      ],
      ignoreList: [
        "memes",
        "career advice",
        "generic tech opinions",
        "non-AI content",
      ],
    },
  },
  "software-engineering": {
    id: "software-engineering",
    label: "Software Engineering",
    description:
      "Languages, tools, architecture, DevOps, and engineering culture",
    sources: {
      reddit: {
        subreddits: [
          "programming",
          "ExperiencedDevs",
          "devops",
          "rust",
          "golang",
        ],
      },
      github: {
        topics: [
          "developer-tools",
          "devops",
          "programming-language",
          "compiler",
          "cli",
          "framework",
        ],
      },
    },
    prompt: {
      audience: "senior software engineers",
      focusAreas: [
        "language releases and updates",
        "framework launches",
        "developer tooling",
        "architecture patterns",
        "DevOps and CI/CD",
        "open-source projects",
        "performance engineering",
        "security vulnerabilities and patches",
      ],
      categories: [
        "Languages",
        "Tooling",
        "Architecture",
        "DevOps",
        "Security",
        "Open Source",
        "GitHub Trending",
        "Product",
        "General",
      ],
      ignoreList: [
        "AI hype",
        "job listings",
        "career rants",
        "generic opinion pieces",
      ],
    },
  },
  web3: {
    id: "web3",
    label: "Web3",
    description:
      "DeFi, protocols, on-chain infrastructure, and crypto engineering",
    sources: {
      reddit: {
        subreddits: ["ethereum", "defi", "solana", "CryptoTechnology"],
      },
      github: {
        topics: [
          "ethereum",
          "solidity",
          "defi",
          "blockchain",
          "smart-contracts",
          "web3",
        ],
      },
    },
    prompt: {
      audience: "Web3 and blockchain engineers",
      focusAreas: [
        "protocol upgrades",
        "DeFi launches and exploits",
        "smart contract tooling",
        "L2 and rollup developments",
        "security exploits and audits",
        "regulatory news affecting crypto",
        "new chains and ecosystems",
      ],
      categories: [
        "Protocols",
        "DeFi",
        "Infrastructure",
        "Security",
        "NFTs",
        "Regulation",
        "GitHub Trending",
        "Funding",
        "General",
      ],
      ignoreList: [
        "price speculation",
        "trading advice",
        "celebrity NFT drops",
        "memes",
      ],
    },
  },
};

export const VERTICAL_IDS = Object.keys(VERTICALS) as VerticalId[];

export const DEFAULT_VERTICAL_ID: VerticalId = "ai";

export function getVertical(id: string): Vertical {
  return VERTICALS[id as VerticalId] ?? VERTICALS[DEFAULT_VERTICAL_ID];
}

export function parseVerticalId(raw: string | null): VerticalId {
  if (raw && raw in VERTICALS) return raw as VerticalId;
  return DEFAULT_VERTICAL_ID;
}
