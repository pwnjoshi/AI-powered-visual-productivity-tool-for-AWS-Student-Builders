# AI-Powered Visual Productivity Tool for AWS Student Builders (CloudBlueprint)

CloudBlueprint is a premium single-page application that takes plain-English project descriptions and instantly generates a recommended AWS serverless architecture stack, visual diagram flow, ordered build sequences, and cost/complexity meters. It is designed to help AWS Student Builders overcome the "blank-page" architectural bottleneck.

---

## 🚀 Key Features

* **AI Architecture Recommendations:** Uses the state-of-the-art **Gemma 3 27B** model via Nebius Studio to analyze project descriptions and select the optimal AWS serverless services.
* **AI Prompt Refiner:** An integrated tool next to the input field that automatically expands and optimizes user ideas into descriptive, professional architectural prompts.
* **Interactive System Flow Canvas:** Renders a clean, flat-styled AWS diagram flow showing data pathways, public DMZ subnets, private isolated compute subnets, and database layouts.
* **Responsive Layout:** Responsive coordinates-based canvas rendering that recalculates arrow positions on viewport resize. Fullscreen mode allows clean, uninterrupted presentation.
* **Ordered Build Sequence Checklist:** Generates a step-by-step progress tracking task board to guide developers chronologically through their hackathon configuration.
* **Shared History Library:** Persists generated blueprints globally to a shared community library.

---

## 🛠️ Architecture Stack

* **Frontend:** HTML5, CSS3 (AWS Builder Center Obsidian Dark Theme, custom Inter typography, flat layouts), Vanilla Javascript (SVG line connector canvas & state engine).
* **Backend APIs:** API Gateway (`POST /generate`, `GET /history`), AWS Lambda (Python 3.12).
* **Database & Storage:** Amazon DynamoDB (`SavedArchitectures` Table) & S3 static hosting.

---

## 🚀 Local Setup & Deploy

### Run Frontend Locally

1. Navigate to the `cloudblueprint` directory:
   ```bash
   cd cloudblueprint
   ```
2. Start a local HTTP server:
   ```bash
   python -m http.server 8080 --directory frontend
   ```
3. Navigate to `http://localhost:8080` in your web browser.

### Deploy to AWS

1. Ensure your AWS credentials are configured under the named profile `cloudblueprint`:
   ```bash
   aws sts get-caller-identity --profile cloudblueprint
   ```
2. Navigate to the `cloudblueprint` folder and execute the Python deployment script:
   ```bash
   python deploy.py
   ```
   This packages your Lambdas, deploys resources to IAM, Lambda, API Gateway, DynamoDB, S3, and updates public/CORS endpoints automatically.

---

## 🔗 Project Links

* **Live Deployed S3 URL:** [http://cloudblueprint-frontend-013131247228.s3-website-us-east-1.amazonaws.com](http://cloudblueprint-frontend-013131247228.s3-website-us-east-1.amazonaws.com)
* **GitHub Repository:** [https://github.com/pwnjoshi/AI-powered-visual-productivity-tool-for-AWS-Student-Builders](https://github.com/pwnjoshi/AI-powered-visual-productivity-tool-for-AWS-Student-Builders)
