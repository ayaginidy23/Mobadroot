# Mobadroot - AI-Powered Strategy Assistant

**Mobadroot** is an AI-powered strategy assistant designed to help startup founders, coaches, and incubators turn rough ideas into structured, actionable business strategies By leveraging the **LLaMA** language model, the system generates tailored business plans, visualizes workflows, and defines KPIs, significantly reducing the time required for strategic planning.

## Table of Contents

- [Introduction](#introduction)
- [Problem Statement](#problem-statement)
- [Project Objectives](#project-objectives)
- [System Design](#system-design)
- [Key Features](#key-features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Challenges](#challenges)
- [Evaluation and Expected Outcomes](#evaluation-and-expected-outcomes)
- [Future Work](#future-work)
- [Conclusion](#conclusion)
- [Contributing](#contributing)
- [Team Members](#team-members)

## Introduction

In today's fast-moving startup landscape, entrepreneurs are under constant pressure to turn their ideas into structured, actionable strategies. However, many lack the time, resources, or expertise to develop detailed plans that address market needs and scalability. 
**Mobadroot** solves this by offering an AI-driven platform that enables users to generate clear, interactive, and exportable business strategies.Utilizing **Meta AI's LLaMA**, it combines smart workflows and visualizations to transform concepts into executable roadmaps.

## Problem Statement

Early-stage startups often struggle to develop actionable strategies due to several factors:
* **Limited Expertise:** Founders may lack access to high-level consulting expertise.
* **Time Constraints:** Developing detailed plans manually is time-consuming.
* **Generic Tools:** Existing platforms provide static templates with no customization.
* **Lack of Visualization:** Current solutions often lack interactivity and visual clarity.

These barriers lead founders to spend too much time building subpar plans.Mobadroot eliminates these issues by offering AI-driven strategy generation that is fast, adaptive, and tailored to each startup's context.

## Project Objectives

The primary objectives of the **Mobadroot** project are:
* To develop an AI tool that produces business strategies customized to each startup's stage and sector.
* To enable real-time generation of strategic content, including workflows and KPIs.
* To visualize strategy steps in intuitive diagrams for better understanding.
* To allow exporting strategies to **PDF** or **Notion** formats.
* To reduce planning time and eliminate dependence on expensive business consultants.

## System Design

The system architecture facilitates a smooth flow from user input to AI generation and visualization.

### 1. Frontend (React)
An intuitive interface that collects user inputs (startup stage, industry) and displays outputs and diagrams interactively].

### 2. Backend (FastAPI)
Handles business logic, processes data, and manages connections to the language model and visualization components.

### 3. Prompt Template Engine
Generates LLaMA-compatible prompts based on user data to produce contextual, structured responses.

### 4. LLaMA Model (Meta AI)
The core of the content generation system. It creates strategy documents, workflow steps, and tailored recommendations.

### 5. Visualization Engine (Mermaid.js / diagrams.net)
Transforms strategy components into diagrams to make complex plans easier to follow and communicate.

### 6. Export Layer
Supports exporting final strategies and visuals to formats like PDF and Notion for sharing.

## Key Features

* **AI-Generated Strategy Plans:** Created in real-time based on user input.
* **Workflow Visualization:** Automatically builds diagrams showing process flows.
* **KPI Suggestions:** Context-aware and industry-specific performance metrics.
* **Interactive Editing:** Enables users to update and personalize the output.
* **Multi-Format Exporting:** Outputs can be saved as PDFs or Notion documents.

## Technologies Used

* **LLaMA (Meta AI):** Advanced open-source language model for text generation.
* **FastAPI:** Backend framework for managing API requests and logic.
* **React:** Frontend library for a fast, interactive User Interface.
* **Mermaid.js / diagrams.net:** Tools for generating visual workflow diagrams.
* **Prompt Engineering:** Modular prompts designed to support various industries.

## Installation

To run Mobadroot locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/ayaginidy23/Mobadroot.git](https://github.com/ayaginidy23/Mobadroot.git)
    cd Mobadroot
    ```

2.  **Backend Setup:**
    Navigate to the backend directory and install dependencies.
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
    *Ensure you have the LLaMA model weights or API keys configured as per the `env` file instructions.*

3.  **Frontend Setup:**
    Navigate to the frontend directory and install dependencies.
    ```bash
    cd ../frontend
    npm install
    ```

4.  **Run the Application:**
    Start the backend server:
    ```bash
    uvicorn main:app --reload
    ```
    Start the React frontend:
    ```bash
    npm start
    ```

5.  Open your browser and access the application (default: `http://localhost:3000`).

## Usage

* **Input Details:** Select your startup stage (e.g., Ideation, Growth) and Industry (e.g., Food, Tech).
* **Generate Strategy:** Click the "Generate" button.The AI will produce a text-based strategy and suggested KPIs.
* **Visualize:** The system will automatically render diagrams representing your business workflow.
* **Edit & Export:** Review the plan, make necessary edits, and export the final document to PDF or Notion.

## Challenges

* **Input Ambiguity:** Users often provide vague startup descriptions, requiring robust prompt handling.
* **Diverse KPI Requirements:** Metrics vary greatly between sectors, necessitating conditional output generation.
* **Diagram Generation:** Translating abstract business logic into visual workflows was technically complex.
* **Balancing Depth vs. Simplicity:** Ensuring outputs are actionable without overwhelming the user.

## Evaluation and Expected Outcomes

The system was validated with founders and startup mentors. Key outcomes include:
* **Efficiency:** Up to **70% reduction** in time required for strategic planning.
* **Speed:** Users can generate useful strategies in under 30 minutes.
* **Clarity:** Diagrams significantly helped in understanding strategy flow.
* **Relevance:** Generated content matched the specific startup stage and sector.

## Future Work

* **Expanded Dataset:** Fine-tuning the model on more niche industries.
* **Integration:** Connecting with other startup tools (e.g., CRM, Project Management).
* **Ecosystem Scale:** Developing Mobadroot into a scalable tool for startup hubs and incubators.

## Conclusion

**Mobadroot** represents a next-generation approach to startup strategy planning.By combining the power of LLaMA, an intuitive UI, and smart visualization tools, the platform enables founders to develop and communicate effective strategies in record time. Its use of open-source AI makes it scalable, cost-effective, and highly customizable.

## Contributing

We welcome contributions to improve Mobadroot. Please fork the repository, create a new branch, and submit a pull request with your improvements.

## Team Members

* Aya Tamer Ginidy 
* Abdulrahman Mohamed Eltahan 
* Ahmed Mohamed Dawood 
* George Nashaat Mesad
* Mohamed Talat Elslmawy 

