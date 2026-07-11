// Mock responses to act as the sandbox fallback
const MOCK_ARCHITECTURES = [
  {
    arch_id: "mock-1",
    idea_text: "a food delivery app for my campus",
    services: ["Amplify", "API Gateway", "Lambda", "DynamoDB", "Cognito", "SNS"],
    architecture_summary: "A serverless, event-driven stack optimized for low-latency updates and high scalability. Amplify hosts the static frontend, API Gateway exposes REST endpoints for users to place orders, and Lambda processes payments and updates the DynamoDB menu/order table. Cognito handles safe campus email verification, and SNS coordinates order updates to drivers.",
    build_steps: [
      "Set up DynamoDB 'Orders' and 'Menus' tables with on-demand capacity.",
      "Write Lambda functions for Order Processing, Driver Management, and Menu Fetching.",
      "Deploy API Gateway REST routes (/orders, /menu) routing to the Lambdas.",
      "Configure Cognito User Pool to restrict sign-ups to campus email domains.",
      "Integrate AWS SDK on the frontend and host the static build on AWS Amplify."
    ],
    complexity: "Intermediate",
    estimated_monthly_cost: "Free tier eligible",
    created_at: new Date().toISOString()
  },
  {
    arch_id: "mock-2",
    idea_text: "a portfolio website that loads instantly",
    services: ["S3", "CloudFront", "Route 53", "ACM"],
    architecture_summary: "A ultra-fast, global static content delivery setup. S3 stores the HTML/CSS/JS files, CloudFront distributes them to edge locations globally, and Route 53 routes the custom domain using an SSL certificate managed by AWS Certificate Manager (ACM).",
    build_steps: [
      "Create a private S3 bucket and upload index.html and assets.",
      "Request a public SSL certificate in ACM for your custom domain.",
      "Provision a CloudFront distribution pointing to the S3 bucket (Origin Access Control).",
      "Configure Route 53 CNAME/Alias records pointing to the CloudFront domain."
    ],
    complexity: "Beginner",
    estimated_monthly_cost: "Free tier eligible",
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

// AWS Service icon map — Official AWS Branded Logos hosted on unpkg CDN
const SERVICE_ICONS = {
  "Amplify": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSAmplify.svg",
  "AWS Amplify": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSAmplify.svg",
  "API Gateway": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonAPIGateway.svg",
  "Amazon API Gateway": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonAPIGateway.svg",
  "Lambda": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSLambda.svg",
  "AWS Lambda": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSLambda.svg",
  "DynamoDB": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonDynamoDB.svg",
  "Amazon DynamoDB": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonDynamoDB.svg",
  "Cognito": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCognito.svg",
  "Amazon Cognito": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCognito.svg",
  "CloudFront": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCloudFront.svg",
  "Amazon CloudFront": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCloudFront.svg",
  "Route 53": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonRoute53.svg",
  "Amazon Route 53": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonRoute53.svg",
  "ACM": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSCertificateManager.svg",
  "AWS Certificate Manager": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSCertificateManager.svg",
  "S3": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonS3.svg",
  "Amazon S3": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonS3.svg",
  "SNS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleNotificationService.svg",
  "Amazon SNS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleNotificationService.svg",
  "SQS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleQueueService.svg",
  "Amazon SQS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleQueueService.svg",
  "EventBridge": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonEventBridge.svg",
  "Amazon EventBridge": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonEventBridge.svg",
  "RDS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonRDS.svg",
  "Amazon RDS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonRDS.svg",
  "ECS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonElasticContainerService.svg",
  "Amazon ECS": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonElasticContainerService.svg",
  "Fargate": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSFargate.svg",
  "AWS Fargate": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSFargate.svg",
  "Bedrock": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonBedrock.svg",
  "Amazon Bedrock": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonBedrock.svg",
  "SageMaker": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSageMaker.svg",
  "Amazon SageMaker": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSageMaker.svg",
  "CloudWatch": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCloudWatch.svg",
  "Amazon CloudWatch": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonCloudWatch.svg",
  "IAM": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSIdentityandAccessManagement.svg",
  "AWS IAM": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSIdentityandAccessManagement.svg",
  "Step Functions": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSStepFunctions.svg",
  "AWS Step Functions": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSStepFunctions.svg",
  "Stripe": "https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/stripe.svg",
  "Amazon Location Service": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonLocationService.svg",
  "EC2": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonEC2.svg",
  "Amazon EC2": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonEC2.svg",
  "OpenSearch": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonOpenSearchService.svg",
  "Amazon OpenSearch": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonOpenSearchService.svg",
  "Secrets Manager": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSSecretsManager.svg",
  "AWS Secrets Manager": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AWSSecretsManager.svg",
  "SES": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleEmailService.svg",
  "Amazon SES": "https://unpkg.com/aws-icons@3.3.0/icons/architecture-service/AmazonSimpleEmailService.svg"
};


// Global state
let currentBlueprint = null;
let savedBlueprints = [...MOCK_ARCHITECTURES];
let liveApiUrl = "https://inqjr6y4ua.execute-api.us-east-1.amazonaws.com/Prod/"; // Deployed API gateway endpoint

async function fetchSavedBlueprints() {
  try {
    const response = await fetch(`${liveApiUrl}history`);
    if (!response.ok) throw new Error("Failed to fetch history");
    const data = await response.json();
    if (Array.isArray(data)) {
      savedBlueprints = data;
    }
  } catch (err) {
    console.warn("Could not load dynamic history, using mock fallback:", err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // Initialize icons
  lucide.createIcons();

  // Navigation Tabs Logic
  const tabGenerator = document.getElementById("tab-generator");
  const tabHistory = document.getElementById("tab-history");
  const generatorView = document.getElementById("generator-view");
  const historyView = document.getElementById("history-view");

  // Logo Homepage Redirect (Reset to Fresh State)
  const logo = document.querySelector(".logo");
  if (logo) {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => {
      tabGenerator.click();
      
      // Clear input and hide results for a true fresh homepage state
      const ideaInput = document.getElementById("idea-input");
      if (ideaInput) ideaInput.value = "";
      
      const resultContainer = document.getElementById("result-container");
      if (resultContainer) resultContainer.classList.add("hidden");
    });
  }

  // Model hint switcher
  const modelSelect = document.getElementById("model-select");
  const modelHint = document.getElementById("model-hint");
  const HINTS = {
    gemma: { cls: "model-hint--gemma", text: "⚡ Fast and reliable. Always works — powered by Gemma 3 27B." },
    bedrock: { cls: "model-hint--bedrock", text: "⚠️ Amazon Nova 2 Lite via Bedrock. May experience occasional latency or availability issues. Falls back automatically if unreachable." }
  };
  if (modelSelect && modelHint) {
    modelSelect.addEventListener("change", () => {
      const val = modelSelect.value;
      modelHint.className = `model-hint ${HINTS[val]?.cls || "model-hint--gemma"}`;
      modelHint.textContent = HINTS[val]?.text || HINTS.gemma.text;
    });
  }

  tabGenerator.addEventListener("click", () => {
    tabGenerator.classList.add("active");
    tabHistory.classList.remove("active");
    tabDocs.classList.remove("active");
    generatorView.classList.add("active");
    historyView.classList.remove("active");
    docsView.classList.remove("active");
  });

  tabHistory.addEventListener("click", async () => {
    tabHistory.classList.add("active");
    tabGenerator.classList.remove("active");
    tabDocs.classList.remove("active");
    historyView.classList.add("active");
    generatorView.classList.remove("active");
    docsView.classList.remove("active");
    
    // Fetch latest DynamoDB library
    await fetchSavedBlueprints();
    renderHistoryList();
  });

  const tabDocs = document.getElementById("tab-docs");
  const docsView = document.getElementById("docs-view");
  if (tabDocs && docsView) {
    tabDocs.addEventListener("click", () => {
      tabDocs.classList.add("active");
      tabGenerator.classList.remove("active");
      tabHistory.classList.remove("active");
      docsView.classList.add("active");
      generatorView.classList.remove("active");
      historyView.classList.remove("active");
    });
  }

  // Fullscreen toggle event listener
  const btnFullscreen = document.getElementById("btn-fullscreen");
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      const container = document.querySelector(".diagram-container");
      container.classList.toggle("fullscreen");
      document.body.classList.toggle("diagram-fullscreen-active");
      
      // Toggle fullscreen icon between maximize and minimize
      if (container.classList.contains("fullscreen")) {
        btnFullscreen.innerHTML = `<span class="material-symbols-rounded" style="font-size: 20px;">fullscreen_exit</span>`;
      } else {
        btnFullscreen.innerHTML = `<span class="material-symbols-rounded" style="font-size: 20px;">fullscreen</span>`;
      }
      
      // Re-trigger SVG connectors coordinates calculation
      if (currentBlueprint) {
        renderVisualDiagram(currentBlueprint.services);
      }
    });
  // Global Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ignore keyboard shortcuts if the user is typing in a textarea or input field
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === "TEXTAREA" || activeEl.tagName === "INPUT" || activeEl.tagName === "SELECT");

    // ESC key: always exits fullscreen or clears focus
    if (e.key === "Escape") {
      const container = document.querySelector(".diagram-container");
      if (container && container.classList.contains("fullscreen")) {
        btnFullscreen.click();
      }
      return;
    }

    if (isTyping) return; // Stop shortcut logic if typing

    // Navigation and Action Triggers
    const key = e.key.toLowerCase();
    
    // Alt + G: Go to Generator Tab
    if (e.altKey && key === "g") {
      e.preventDefault();
      tabGenerator.click();
    }
    // Alt + H: Go to Past Blueprints Tab
    else if (e.altKey && key === "h") {
      e.preventDefault();
      tabHistory.click();
    }
    // Alt + W: Go to How It Works Docs Tab
    else if (e.altKey && key === "w") {
      e.preventDefault();
      if (tabDocs) tabDocs.click();
    }
    // Alt + F: Toggle diagram Fullscreen
    else if (e.altKey && key === "f") {
      e.preventDefault();
      if (btnFullscreen) btnFullscreen.click();
    }
  });

  // Form Submission
  const form = document.getElementById("generator-form");
  const ideaInput = document.getElementById("idea-input");
  const generateBtn = document.getElementById("generate-btn");

  const btnRefine = document.getElementById("btn-refine");

  // AI Prompt Refine Click Listener
  if (btnRefine) {
    btnRefine.addEventListener("click", async () => {
      const idea = ideaInput.value.trim();
      if (!idea) {
        ideaInput.focus();
        ideaInput.style.borderColor = "var(--accent-cyan)";
        setTimeout(() => ideaInput.style.borderColor = "", 1500);
        return;
      }

      btnRefine.disabled = true;
      btnRefine.innerHTML = `
        <span class="material-symbols-rounded refine-icon" style="animation: spin 1s linear infinite;">refresh</span>
        <span>Refining...</span>
      `;

      try {
        const modelSelectEl = document.getElementById("model-select");
        const model = modelSelectEl ? modelSelectEl.value : "gemma";

        const response = await fetch(`${liveApiUrl}generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea, refine: true, model })
        });
        if (!response.ok) throw new Error("API Error refining prompt");
        const data = await response.json();
        if (data.refined_idea) {
          ideaInput.value = data.refined_idea;
          // Flash textarea green briefly to confirm success
          ideaInput.style.borderColor = "#4ade80";
          setTimeout(() => ideaInput.style.borderColor = "", 1500);
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        console.warn("Refine failed:", err.message);
      } finally {
        btnRefine.disabled = false;
        btnRefine.innerHTML = `
          <span class="material-symbols-rounded refine-icon">auto_fix_high</span>
          <span>AI Refine</span>
        `;
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const idea = ideaInput.value.trim();
    if (!idea) return;

    const loadingPhrases = [
      "Analyzing requirements...",
      "Selecting optimal AWS services...",
      "Mapping public and private subnets...",
      "Configuring DynamoDB indices...",
      "Generating build sequence steps...",
      "Assembling architecture diagram..."
    ];

    let phraseIndex = 0;
    generateBtn.disabled = true;
    generateBtn.style.minWidth = "220px";

    const updateLoadingText = () => {
      if (phraseIndex < loadingPhrases.length) {
        generateBtn.innerHTML = `
          <span>${loadingPhrases[phraseIndex]}</span>
          <div class="loading-dots">
            <span></span><span></span><span></span>
          </div>
        `;
        phraseIndex++;
      }
    };

    updateLoadingText();
    const loadingInterval = setInterval(updateLoadingText, 2500);

    try {
      const modelSelect = document.getElementById("model-select");
      const model = modelSelect ? modelSelect.value : "gemma";

      // Try real API, silently fall back to mock on failure
      try {
        const response = await fetch(`${liveApiUrl}generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea, model })
        });
        if (!response.ok) throw new Error("API Network error response");
        currentBlueprint = await response.json();
      } catch (apiErr) {
        console.warn("API request failed, silently falling back to mock blueprint:", apiErr);
        currentBlueprint = generateMockBlueprint(idea);
      }

      // Add to saved history and render
      savedBlueprints.unshift(currentBlueprint);
      renderBlueprintResult(currentBlueprint);
    } catch (err) {
      console.error("Error processing blueprint result:", err);
    } finally {
      clearInterval(loadingInterval);
      generateBtn.disabled = false;
      generateBtn.innerHTML = `<span>Generate Blueprint</span><i data-lucide="arrow-right"></i>`;
      lucide.createIcons();
    }
  });

  // Redraw diagram connectors on window resize to ensure lines match nodes perfectly
  window.addEventListener("resize", () => {
    if (currentBlueprint) {
      renderVisualDiagram(currentBlueprint.services);
    }
  });

  // Load initial DynamoDB history silently on start
  fetchSavedBlueprints();
});

// Render the detailed Blueprint outcome on screen
function renderBlueprintResult(blueprint) {
  const resultContainer = document.getElementById("result-container");
  resultContainer.classList.remove("hidden");

  // Title, Cost & Complexity Metrics
  document.getElementById("result-title").textContent = `Architecture Recommendation for "${blueprint.idea_text.substring(0, 30)}${blueprint.idea_text.length > 30 ? '...' : ''}"`;
  document.getElementById("badge-complexity").querySelector(".badge-text").textContent = blueprint.complexity;
  document.getElementById("badge-cost").querySelector(".badge-text").textContent = blueprint.estimated_monthly_cost || blueprint.estimated_cost;
  document.getElementById("architecture-summary").textContent = blueprint.architecture_summary;

  // Build Checklist Pane
  const checklistElement = document.getElementById("build-checklist");
  checklistElement.innerHTML = "";
  
  blueprint.build_steps.forEach((step, idx) => {
    const item = document.createElement("div");
    item.className = "checklist-item";
    item.innerHTML = `
      <div class="checklist-checkbox">
        <i data-lucide="check"></i>
      </div>
      <div class="checklist-content">${step}</div>
    `;
    item.addEventListener("click", () => {
      item.classList.toggle("checked");
    });
    checklistElement.appendChild(item);
  });

  // Render Visual Architecture Diagram Flow (SVG + nodes layer)
  renderVisualDiagram(blueprint.services);

  // Generate & display Agent Blueprint markdown
  const agentMd = generateAgentBlueprint(blueprint);
  const agentPre = document.getElementById("agent-blueprint-content");
  if (agentPre) agentPre.textContent = agentMd;

  // Copy button
  const btnCopy = document.getElementById("btn-copy-blueprint");
  if (btnCopy) {
    btnCopy.onclick = async () => {
      await navigator.clipboard.writeText(agentMd);
      btnCopy.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px;">check_circle</span><span>Copied!</span>`;
      btnCopy.style.color = "#4ade80";
      setTimeout(() => {
        btnCopy.innerHTML = `<span class="material-symbols-rounded" style="font-size:18px;">content_copy</span><span>Copy</span>`;
        btnCopy.style.color = "";
      }, 2000);
    };
  }

  // Download button
  const btnDownload = document.getElementById("btn-download-blueprint");
  if (btnDownload) {
    btnDownload.onclick = () => {
      const slug = blueprint.idea_text.substring(0, 30).toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      const filename = `cloudblueprint-${slug}.md`;
      const blob = new Blob([agentMd], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    };
  }

  // Re-run Lucide
  lucide.createIcons();
  
  // Scroll down smoothly to show results
  resultContainer.scrollIntoView({ behavior: "smooth" });
}

// ═══════════════════════════════════════════════════════════
//  AGENT BLUEPRINT GENERATOR
//  Produces a structured markdown manifest that AI agents
//  (Claude, Gemini, Copilot, etc.) can consume to autonomously
//  build the complete AWS infrastructure from scratch.
// ═══════════════════════════════════════════════════════════
function generateAgentBlueprint(blueprint) {
  const now = new Date().toISOString().split("T")[0];
  const services = blueprint.services || [];
  const steps = blueprint.build_steps || [];

  // Service → role mapping heuristic
  const roleMap = {
    "Lambda": "Serverless compute — runs business logic handlers",
    "AWS Lambda": "Serverless compute — runs business logic handlers",
    "API Gateway": "REST/WebSocket API entry point — routes requests to Lambda",
    "DynamoDB": "NoSQL database — stores and retrieves application data",
    "Amazon DynamoDB": "NoSQL database — stores and retrieves application data",
    "S3": "Object storage — hosts static assets, files, or frontend build",
    "Amazon S3": "Object storage — hosts static assets, files, or frontend build",
    "Cognito": "User authentication — sign-up, sign-in, JWT token management",
    "Amazon Cognito": "User authentication — sign-up, sign-in, JWT token management",
    "CloudFront": "CDN — serves frontend globally with low latency via edge locations",
    "Amplify": "Frontend hosting — CI/CD pipeline for static web apps",
    "Route 53": "DNS — routes custom domain to CloudFront or API Gateway",
    "SNS": "Pub/Sub notifications — fan-out events to multiple subscribers",
    "SQS": "Message queue — decouples producer/consumer workloads",
    "EventBridge": "Event bus — triggers serverless workflows on scheduled or custom events",
    "RDS": "Relational database — structured data with SQL queries",
    "ECS": "Container orchestration — runs Dockerized application services",
    "Fargate": "Serverless containers — no EC2 management required",
    "Bedrock": "Generative AI — invoke foundation models (Nova, Claude, Titan) via API",
    "SageMaker": "ML platform — train, deploy, and serve custom ML models",
    "IAM": "Identity & Access Management — define least-privilege roles and policies",
    "ACM": "SSL/TLS certificate management — HTTPS for custom domains",
    "CloudWatch": "Monitoring — logs, metrics, alarms and dashboards",
    "SES": "Email delivery — transactional and marketing emails",
    "Secrets Manager": "Secrets management — securely store API keys and credentials",
    "Step Functions": "Workflow orchestration — coordinate multi-step serverless pipelines",
  };

  const serviceTable = services.map(svc => {
    const role = roleMap[svc] || "Supporting AWS service";
    return `| ${svc} | ${role} |`;
  }).join("\n");

  const stepsMarkdown = steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

  // IaC hints per service
  const cdkHints = services.map(svc => {
    const s = svc.toLowerCase();
    if (s.includes("lambda")) return "  - `aws_lambda.Function` — Python 3.12 runtime, 256MB memory, 30s timeout";
    if (s.includes("api gateway")) return "  - `aws_apigateway.RestApi` — CORS enabled, Lambda proxy integration";
    if (s.includes("dynamo")) return "  - `aws_dynamodb.Table` — PAY_PER_REQUEST billing, point-in-time recovery enabled";
    if (s.includes(" s3") || s === "s3" || s.includes("amazon s3")) return "  - `aws_s3.Bucket` — versioning enabled, lifecycle rules for cost optimization";
    if (s.includes("cognito")) return "  - `aws_cognito.UserPool` — email verification, secure password policy";
    if (s.includes("cloudfront")) return "  - `aws_cloudfront.Distribution` — S3 origin with OAC, HTTPS only";
    if (s.includes("amplify")) return "  - `aws_amplify.App` — GitHub source, auto build on push";
    if (s.includes("sns")) return "  - `aws_sns.Topic` — standard type, email/Lambda subscriptions";
    if (s.includes("sqs")) return "  - `aws_sqs.Queue` — visibility timeout 300s, dead-letter queue attached";
    if (s.includes("rds")) return "  - `aws_rds.DatabaseInstance` — Aurora Serverless v2, auto-pause enabled";
    if (s.includes("bedrock")) return "  - Invoke via `boto3.client('bedrock-runtime').converse()` — model: `us.amazon.nova-2-lite-v1:0`";
    return `  - Configure **${svc}** via AWS CDK L2 construct`;
  }).join("\n");

  const agentPrompt = `You are an expert AWS Solutions Architect and DevOps Engineer.
Your task is to FULLY BUILD the following AWS architecture using AWS CDK (Python).
Do NOT ask for clarification. Make reasonable defaults for anything not specified.
Deploy everything to us-east-1. Use least-privilege IAM roles throughout.
After writing all CDK code, provide a single \`cdk deploy\` command to ship it all.`;

  return `# 🏗️ CloudBlueprint — Agent Manifest
> Generated by CloudBlueprint AI on ${now}
> **Project:** ${blueprint.idea_text}

---

## 🎯 Objective

${blueprint.architecture_summary}

**Complexity:** ${blueprint.complexity}
**Estimated Cost:** ${blueprint.estimated_monthly_cost || blueprint.estimated_cost || "Free Tier Eligible"}

---

## ☁️ AWS Services Required

| Service | Role |
|---------|------|
${serviceTable}

---

## 📋 Build Sequence

${stepsMarkdown}

---

## ⚙️ Infrastructure as Code (AWS CDK — Python)

Use the following CDK constructs to build this architecture:

\`\`\`
CDK Stack: ${blueprint.idea_text.substring(0, 24).replace(/\s+/g, "")}Stack
Region: us-east-1
Language: Python
\`\`\`

### Recommended CDK Constructs:
${cdkHints}

### Project Setup:
\`\`\`bash
mkdir my-aws-project && cd my-aws-project
cdk init app --language python
pip install aws-cdk-lib constructs boto3
\`\`\`

---

## 🤖 Agent Prompt (paste directly into any AI agent)

\`\`\`
${agentPrompt}

### Architecture to build:
Idea: ${blueprint.idea_text}

Services: ${services.join(", ")}

Summary: ${blueprint.architecture_summary}

Build steps:
${stepsMarkdown}

### Constraints:
- Use AWS CDK (Python) for all infrastructure
- Region: us-east-1
- Enforce least-privilege IAM on every resource
- Enable CloudWatch logging on all Lambda functions
- Add error handling and retries where applicable
- Output all important ARNs and URLs as CDK CfnOutput
\`\`\`

---

## 📁 Expected Project Structure

\`\`\`
my-aws-project/
├── app.py                    # CDK app entry point
├── cdk.json
├── requirements.txt
├── stacks/
│   └── main_stack.py         # Primary infrastructure stack
├── lambda/
│   └── handler.py            # Lambda function code
└── README.md
\`\`\`

---

## 🔐 IAM & Security Checklist

- [ ] All Lambda execution roles use least-privilege policies
- [ ] S3 buckets block public access (unless serving frontend)
- [ ] DynamoDB encryption at rest enabled
- [ ] API Gateway uses IAM or Cognito authorizer
- [ ] Secrets stored in Secrets Manager — never in env vars
- [ ] CloudWatch alarms set for Lambda errors and API 5xx rates

---

## 🚀 Deploy Command

\`\`\`bash
cdk synth   # Preview CloudFormation template
cdk deploy  # Deploy to AWS (us-east-1)
\`\`\`

---

*Built with [CloudBlueprint](https://cloudblueprint.ai) — AI-powered AWS Architecture Generator*
`;
}



// Helper to create element with attributes and text content
function createDOMNode(tag, classes = [], content = "", id = "") {
  const el = document.createElement(tag);
  if (classes.length) el.classList.add(...classes);
  if (id) el.id = id;
  if (content) el.innerHTML = content;
  return el;
}

// Interactive Real Architecture Flow Drawer (supporting VPC bounds, logical alignment)
function renderVisualDiagram(services) {
  const nodesLayer = document.getElementById("diagram-nodes-layer");
  const canvas = document.getElementById("diagram-canvas");
  nodesLayer.innerHTML = "";
  canvas.innerHTML = "";

  // --- Classify services into architecture layers ---
  const layers = {
    users:   [],   // always injected
    cdn:     [],   // CloudFront, Route 53, ACM, Amplify
    api:     [],   // API Gateway, ALB, ELB
    compute: [],   // Lambda, ECS, Fargate, EC2
    data:    [],   // DynamoDB, RDS, S3, Aurora, OpenSearch
    auth:    [],   // Cognito, IAM, Secrets Manager
    integration: [],// SNS, SQS, EventBridge, Step Functions
    ai:      [],   // Bedrock, SageMaker
    other:   [],   // Stripe, Location, CloudWatch, SES, etc.
  };

  const classify = (svc) => {
    const s = svc.toLowerCase();
    if (["cloudfront","route 53","route53","acm","amplify","aws amplify","amazon cloudfront","amazon route 53"].includes(s)) return "cdn";
    if (s.includes("api gateway") || s.includes("alb") || s.includes("load balancer")) return "api";
    if (s.includes("lambda") || s.includes("ecs") || s.includes("fargate") || s.includes("ec2")) return "compute";
    if (s.includes("dynamo") || s.includes("rds") || s.includes("aurora") || s.includes(" s3") || s === "s3" || s.includes("amazon s3") || s.includes("opensearch") || s.includes("elasticache")) return "data";
    if (s.includes("cognito") || s.includes("iam") || s.includes("secrets") || s.includes("acm")) return "auth";
    if (s.includes("sns") || s.includes("sqs") || s.includes("eventbridge") || s.includes("step function") || s.includes("ses")) return "integration";
    if (s.includes("bedrock") || s.includes("sagemaker") || s.includes("rekognition") || s.includes("comprehend") || s.includes("textract")) return "ai";
    return "other";
  };

  services.forEach(svc => {
    const layer = classify(svc);
    layers[layer].push(svc);
  });

  // Build DOM
  const wrapper = document.createElement("div");
  wrapper.className = "arch-diagram-wrapper";

  // Helper: make a labeled layer group
  const makeGroup = (labelText, colorClass, nodes) => {
    const group = document.createElement("div");
    group.className = `arch-layer-group arch-layer--${colorClass}`;
    const label = document.createElement("div");
    label.className = "arch-layer-label";
    label.textContent = labelText;
    group.appendChild(label);
    const row = document.createElement("div");
    row.className = "arch-nodes-row";
    nodes.forEach(svc => row.appendChild(createArchNodeElement(svc)));
    group.appendChild(row);
    return group;
  };

  // Helper: make an arrow connector div
  const makeArrow = (label = "") => {
    const arrow = document.createElement("div");
    arrow.className = "arch-arrow";
    arrow.innerHTML = `
      <div class="arch-arrow-line"></div>
      ${label ? `<span class="arch-arrow-label">${label}</span>` : ""}
      <div class="arch-arrow-head">▼</div>
    `;
    return arrow;
  };

  // ── Users ──
  const userNode = document.createElement("div");
  userNode.className = "user-node";
  userNode.innerHTML = `
    <svg width="48" height="48" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="20" r="13" fill="none" stroke="#a5b4fc" stroke-width="4"/>
      <path d="M8 56 Q8 38 32 38 Q56 38 56 56" fill="none" stroke="#a5b4fc" stroke-width="4" stroke-linecap="round"/>
      <circle cx="14" cy="28" r="9" fill="none" stroke="#a5b4fc" stroke-width="3" opacity=".55"/>
      <path d="M2 50 Q2 39 14 39 Q20 39 24 43" fill="none" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round" opacity=".55"/>
      <circle cx="50" cy="28" r="9" fill="none" stroke="#a5b4fc" stroke-width="3" opacity=".55"/>
      <path d="M62 50 Q62 39 50 39 Q44 39 40 43" fill="none" stroke="#a5b4fc" stroke-width="3" stroke-linecap="round" opacity=".55"/>
    </svg>
    <div class="user-label">End Users</div>
  `;
  wrapper.appendChild(userNode);

  // ── CDN / Hosting ──
  if (layers.cdn.length) {
    wrapper.appendChild(makeArrow("HTTPS"));
    wrapper.appendChild(makeGroup("Frontend / Hosting Layer", "cdn", layers.cdn));
  }

  // ── API Layer ──
  if (layers.api.length) {
    wrapper.appendChild(makeArrow("REST / WebSocket"));
    wrapper.appendChild(makeGroup("API Layer", "api", layers.api));
  }

  // ── Auth (side, shown inline before compute if both exist) ──
  const hasCompute = layers.compute.length > 0;
  const hasAuth = layers.auth.length > 0;
  const hasAI = layers.ai.length > 0;

  if (hasCompute || hasAuth || hasAI) {
    wrapper.appendChild(makeArrow("invokes"));

    // Multi-column row for Compute | Auth | AI
    const midRow = document.createElement("div");
    midRow.className = "arch-mid-columns";

    if (hasCompute) {
      const computeGroup = makeGroup("Compute Layer", "compute", layers.compute);
      midRow.appendChild(computeGroup);
    }
    if (hasAuth) {
      const authGroup = makeGroup("Auth & Security", "auth", layers.auth);
      midRow.appendChild(authGroup);
    }
    if (hasAI) {
      const aiGroup = makeGroup("AI / ML", "ai", layers.ai);
      midRow.appendChild(aiGroup);
    }
    wrapper.appendChild(midRow);
  }

  // ── Integration ──
  if (layers.integration.length) {
    wrapper.appendChild(makeArrow("events / messages"));
    wrapper.appendChild(makeGroup("Integration & Messaging", "integration", layers.integration));
  }

  // ── Data ──
  if (layers.data.length) {
    wrapper.appendChild(makeArrow("reads / writes"));
    wrapper.appendChild(makeGroup("Data & Storage Layer", "data", layers.data));
  }

  // ── Other ──
  if (layers.other.length) {
    wrapper.appendChild(makeGroup("Other Services", "other", layers.other));
  }

  nodesLayer.appendChild(wrapper);
}



function createArchNodeElement(serviceName) {
  const node = createDOMNode("div", ["arch-node"]);

  // Color fallback for unknown services
  const CATEGORY_COLOR = {
    "lambda": "#ED7100", "compute": "#ED7100", "ecs": "#ED7100", "fargate": "#ED7100", "ec2": "#ED7100",
    "s3": "#3F8624", "storage": "#3F8624", "amplify": "#6940D6",
    "dynamo": "#3B48CC", "rds": "#3B48CC", "database": "#3B48CC", "aurora": "#3B48CC",
    "api": "#8C4FFF", "cloudfront": "#8C4FFF", "route": "#8C4FFF",
    "cognito": "#DD344C", "iam": "#DD344C", "acm": "#DD344C", "secrets": "#DD344C",
    "sns": "#E7157B", "sqs": "#E7157B", "event": "#E7157B", "ses": "#E7157B",
    "bedrock": "#01A88D", "sagemaker": "#01A88D", "ai": "#01A88D",
    "cloudwatch": "#232F3E", "stripe": "#635BFF",
  };

  let iconUrl = SERVICE_ICONS[serviceName];
  let iconHtml;

  if (iconUrl) {
    iconHtml = `<img src="${iconUrl}" alt="${serviceName}" style="width:38px;height:38px;object-fit:contain;display:block;">`;
  } else {
    // Generate a color-coded fallback badge from service initials
    const lower = serviceName.toLowerCase();
    let bg = "#4a5568";
    for (const [key, col] of Object.entries(CATEGORY_COLOR)) {
      if (lower.includes(key)) { bg = col; break; }
    }
    const initials = serviceName.split(/\s+/).map(w => w[0]).join("").slice(0, 3).toUpperCase();
    iconHtml = `<div style="width:38px;height:38px;border-radius:10px;background:${bg};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:11px;color:white;font-family:monospace;letter-spacing:-0.5px;">${initials}</div>`;
  }

  node.innerHTML = `
    <div class="node-icon-wrapper">${iconHtml}</div>
    <div class="node-name">${serviceName}</div>
  `;
  return node;
}


// Generate high quality Mock Response
function generateMockBlueprint(idea) {
  // Categorize idea keywords dynamically
  const lowerIdea = idea.toLowerCase();
  let services = ["Amplify", "API Gateway", "Lambda", "DynamoDB"];
  let summary = `A custom-fit serverless application architecture that provides scalable storage and computing.`;
  let steps = [
    "Provision a custom AWS DynamoDB table to structure project assets.",
    "Write core application handlers in AWS Lambda (using Node or Python runtime).",
    "Hook Lambda handlers onto AWS API Gateway routes for backend API orchestration.",
    "Deploy client code files instantly to AWS Amplify static hosting."
  ];
  let complexity = "Beginner";
  let cost = "Free tier eligible";

  if (lowerIdea.includes("auth") || lowerIdea.includes("user") || lowerIdea.includes("login") || lowerIdea.includes("signup")) {
    services.push("Cognito");
    steps.push("Configure Cognito User Pool to securely handle user access/authentication.");
    summary += " Integrated with Amazon Cognito for securing user registration and login tokens.";
  }

  if (lowerIdea.includes("notification") || lowerIdea.includes("alert") || lowerIdea.includes("email") || lowerIdea.includes("sms")) {
    services.push("SNS");
    steps.push("Create SNS Topic routes to transmit real-time alerts/SMS/emails directly.");
    summary += " Features AWS SNS for automated notifications and pub/sub message dissemination.";
  }

  if (lowerIdea.includes("file") || lowerIdea.includes("image") || lowerIdea.includes("upload") || lowerIdea.includes("pdf")) {
    services.push("S3");
    steps.push("Create Amazon S3 Storage bucket for holding static assets/uploaded files.");
    summary += " Backed by highly durable Amazon S3 file storage.";
  }

  if (lowerIdea.includes("complex") || lowerIdea.includes("machine learning") || lowerIdea.includes("heavy") || lowerIdea.includes("ai")) {
    complexity = "Advanced";
    cost = "~$12/month";
  } else if (services.length > 4) {
    complexity = "Intermediate";
  }

  return {
    arch_id: "arch-" + Math.random().toString(36).substr(2, 9),
    idea_text: idea,
    services,
    architecture_summary: summary,
    build_steps: steps,
    complexity,
    estimated_monthly_cost: cost,
    created_at: new Date().toISOString()
  };
}

// History Grid displayer
function renderHistoryList() {
  const historyList = document.getElementById("history-list");
  const historyEmpty = document.getElementById("history-empty");
  
  historyList.innerHTML = "";
  
  if (savedBlueprints.length === 0) {
    historyEmpty.classList.remove("hidden");
    return;
  }
  
  historyEmpty.classList.add("hidden");
  
  savedBlueprints.forEach(bp => {
    const card = document.createElement("div");
    card.className = "history-card glass-panel";
    
    // Formatting date
    const dateStr = new Date(bp.created_at).toLocaleDateString(undefined, { 
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    card.innerHTML = `
      <div class="history-card-header">
        <span class="history-date">${dateStr}</span>
        <span class="badge" style="padding: 2px 8px; font-size: 0.75rem;">${bp.complexity}</span>
      </div>
      <div class="history-idea">${bp.idea_text}</div>
      <div class="history-summary">${bp.architecture_summary}</div>
      <div class="history-card-footer">
        <span class="history-services">${bp.services.join(" + ")}</span>
        <i data-lucide="chevron-right" style="width:16px; height: 16px;"></i>
      </div>
    `;
    
    card.addEventListener("click", () => {
      // Switch back to generator view showing this selected plan
      document.getElementById("tab-generator").click();
      renderBlueprintResult(bp);
    });

    historyList.appendChild(card);
  });
  
  lucide.createIcons();
}
