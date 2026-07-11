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

// Map AWS Service names to specific icons
const SERVICE_ICONS = {
  "Amplify": "globe", // Use 'globe' for hosting/amplify
  "API Gateway": "route",
  "Lambda": "zap",
  "DynamoDB": "database",
  "Cognito": "users",
  "SNS": "bell",
  "S3": "hard-drive",
  "CloudFront": "globe",
  "Route 53": "server",
  "ACM": "shield-check",
  "SQS": "mail",
  "EventBridge": "calendar",
  "RDS": "database",
  "ECS": "layers",
  "Fargate": "cpu"
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

  tabGenerator.addEventListener("click", () => {
    tabGenerator.classList.add("active");
    tabHistory.classList.remove("active");
    generatorView.classList.add("active");
    historyView.classList.remove("active");
  });

  tabHistory.addEventListener("click", async () => {
    tabHistory.classList.add("active");
    tabGenerator.classList.remove("active");
    historyView.classList.add("active");
    generatorView.classList.remove("active");
    
    // Fetch latest DynamoDB library
    await fetchSavedBlueprints();
    renderHistoryList();
  });

  // Fullscreen toggle event listener
  const btnFullscreen = document.getElementById("btn-fullscreen");
  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", () => {
      const container = document.querySelector(".diagram-container");
      container.classList.toggle("fullscreen");
      document.body.classList.toggle("diagram-fullscreen-active");
      
      // Toggle fullscreen icon between maximize and minimize
      const icon = btnFullscreen.querySelector("i");
      if (container.classList.contains("fullscreen")) {
        icon.setAttribute("data-lucide", "minimize-2");
      } else {
        icon.setAttribute("data-lucide", "maximize-2");
      }
      lucide.createIcons();
      
      // Re-trigger SVG connectors coordinates calculation
      if (currentBlueprint) {
        renderVisualDiagram(currentBlueprint.services);
      }
    });
  }

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
        alert("Please enter a brief idea first to refine it.");
        return;
      }
      
      btnRefine.disabled = true;
      const spanEl = btnRefine.querySelector("span");
      const originalText = spanEl.textContent;
      spanEl.textContent = "Refining...";
      
      try {
        const response = await fetch(`${liveApiUrl}generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ idea, refine: true })
        });
        if (!response.ok) throw new Error("API Error refining prompt");
        const data = await response.json();
        if (data.refined_idea) {
          ideaInput.value = data.refined_idea;
        } else if (data.error) {
          throw new Error(data.error);
        }
      } catch (err) {
        alert("Could not refine prompt: " + err.message);
      } finally {
        btnRefine.disabled = false;
        spanEl.textContent = originalText;
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
      try {
        // Call Real API gateway endpoint
        const response = await fetch(`${liveApiUrl}generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ idea })
        });
        if (!response.ok) throw new Error("API Network error response");
        currentBlueprint = await response.json();
      } catch (apiErr) {
        console.warn("API request failed, silently falling back to mock blueprint:", apiErr);
        currentBlueprint = generateMockBlueprint(idea);
      }

      // Add to saved history
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
  
  // Re-run Lucide
  lucide.createIcons();
  
  // Scroll down smoothly to show results
  resultContainer.scrollIntoView({ behavior: "smooth" });
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

  // Structure layout container (flex column)
  const mainFlow = createDOMNode("div", ["main-flow-wrapper"]);
  mainFlow.style.display = "flex";
  mainFlow.style.flexDirection = "column";
  mainFlow.style.alignItems = "center";
  mainFlow.style.width = "100%";
  mainFlow.style.gap = "20px";
  
  // 1. Users Node at top
  const userNode = createDOMNode("div", ["user-node"]);
  userNode.innerHTML = `
    <div class="user-icon"><i data-lucide="users"></i></div>
    <div class="user-label">End Users</div>
  `;
  mainFlow.appendChild(userNode);

  // Classify services into tiers
  const ingressServices = []; // CDN/Hosting, DNS, ACM
  const publicSubnetServices = []; // API Gateway, Load Balancer
  const privateSubnetServices = []; // Lambdas, Compute
  const databaseServices = []; // DynamoDB, RDS, S3 buckets
  const utilityServices = []; // SNS, EventBridge, Cognito

  services.forEach(svc => {
    if (["CloudFront", "Route 53", "ACM", "Amplify"].includes(svc)) {
      ingressServices.push(svc);
    } else if (["API Gateway", "ALB", "Application Load Balancer"].includes(svc)) {
      publicSubnetServices.push(svc);
    } else if (["Lambda", "ECS", "Fargate", "Compute"].includes(svc)) {
      privateSubnetServices.push(svc);
    } else if (["DynamoDB", "RDS", "S3"].includes(svc)) {
      databaseServices.push(svc);
    } else {
      utilityServices.push(svc);
    }
  });

  // 2. Ingress Tier (External to VPC/Direct web entry)
  if (ingressServices.length > 0) {
    const ingressRow = createDOMNode("div", ["subnet-row"]);
    ingressServices.forEach(svc => {
      ingressRow.appendChild(createArchNodeElement(svc));
    });
    mainFlow.appendChild(ingressRow);
  }

  // 3. VPC Container
  const needsVpc = publicSubnetServices.length > 0 || privateSubnetServices.length > 0;
  if (needsVpc) {
    const vpc = createDOMNode("div", ["vpc-container"]);
    vpc.innerHTML = `<div class="vpc-label"><i data-lucide="shield"></i> Amazon VPC Region Stack</div>`;
    
    // Public Subnet
    if (publicSubnetServices.length > 0) {
      const pubSubnet = createDOMNode("div", ["subnet-box", "public"]);
      pubSubnet.innerHTML = `<div class="subnet-label">Public Subnet (DMZ)</div>`;
      publicSubnetServices.forEach(svc => {
        pubSubnet.appendChild(createArchNodeElement(svc));
      });
      vpc.appendChild(pubSubnet);
    }

    // Private Subnet
    if (privateSubnetServices.length > 0) {
      const privSubnet = createDOMNode("div", ["subnet-box", "private"]);
      privSubnet.innerHTML = `<div class="subnet-label">Private Subnet (Isolated Compute)</div>`;
      privateSubnetServices.forEach(svc => {
        privSubnet.appendChild(createArchNodeElement(svc));
      });
      vpc.appendChild(privSubnet);
    }

    mainFlow.appendChild(vpc);
  } else {
    // If pure serverless non-VPC stack, stack them cleanly
    if (publicSubnetServices.length > 0) {
      const row = createDOMNode("div", ["subnet-row"]);
      publicSubnetServices.forEach(svc => row.appendChild(createArchNodeElement(svc)));
      mainFlow.appendChild(row);
    }
    if (privateSubnetServices.length > 0) {
      const row = createDOMNode("div", ["subnet-row"]);
      privateSubnetServices.forEach(svc => row.appendChild(createArchNodeElement(svc)));
      mainFlow.appendChild(row);
    }
  }

  // 4. Storage & Persistence Tier
  if (databaseServices.length > 0) {
    const dbRow = createDOMNode("div", ["subnet-row"]);
    dbRow.style.marginTop = "10px";
    databaseServices.forEach(svc => {
      dbRow.appendChild(createArchNodeElement(svc));
    });
    mainFlow.appendChild(dbRow);
  }

  // 5. Shared Utility Services (Floating on side)
  if (utilityServices.length > 0) {
    const utilityRow = createDOMNode("div", ["subnet-row"]);
    utilityRow.style.marginTop = "10px";
    utilityServices.forEach(svc => {
      utilityRow.appendChild(createArchNodeElement(svc));
    });
    mainFlow.appendChild(utilityRow);
  }

  nodesLayer.appendChild(mainFlow);

  // Setup SVG dimensions based on fully computed heights
  setTimeout(() => {
    const width = nodesLayer.clientWidth || 550;
    const height = nodesLayer.clientHeight || 450;
    canvas.setAttribute("viewBox", `0 0 ${width} ${height}`);
    
    // Find absolute coordinates relative to the nodesLayer bounding rect
    const parentRect = nodesLayer.getBoundingClientRect();
    const nodeElements = Array.from(nodesLayer.querySelectorAll(".arch-node, .user-node"));
    
    const positions = nodeElements.map(el => {
      const rect = el.getBoundingClientRect();
      return {
        id: el.querySelector(".node-name")?.textContent || "users",
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top + rect.height / 2
      };
    });

    let pathD = "";
    // Line connectors flow top down chronologically matching actual offsets
    for (let i = 0; i < positions.length - 1; i++) {
      const p1 = positions[i];
      const p2 = positions[i+1];
      
      // Calculate curve
      pathD += ` M ${p1.x} ${p1.y} C ${p1.x} ${(p1.y + p2.y)/2}, ${p2.x} ${(p1.y + p2.y)/2}, ${p2.x} ${p2.y}`;
    }

    canvas.innerHTML = `
      <defs>
        <linearGradient id="glow-line" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#06b6d4" />
          <stop offset="100%" stop-color="#8b5cf6" />
        </linearGradient>
      </defs>
      <path d="${pathD}" fill="none" stroke="url(#glow-line)" stroke-width="2" stroke-dasharray="5,5" opacity="0.5" />
    `;
  }, 150);
}

function createArchNodeElement(serviceName) {
  const node = createDOMNode("div", ["arch-node"]);
  const cleanIcon = SERVICE_ICONS[serviceName] || "cpu";
  node.innerHTML = `
    <div class="node-icon-wrapper">
      <i data-lucide="${cleanIcon}"></i>
    </div>
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
