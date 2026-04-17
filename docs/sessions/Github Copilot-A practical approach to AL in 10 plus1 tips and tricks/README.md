# GitHub Copilot — Practical approach to AL: 10+1 Tips & Tricks

This short guide summarizes the key insights from the presentation "GitHub Copilot — A practical approach to AL in 10 +1 tips and tricks" by Javier Armesto.

Overview
--------
The presentation delivers practical guidance for using GitHub Copilot with AL (the language for Microsoft Dynamics 365 Business Central). It focuses on actionable tips to improve developer productivity, reduce errors, and establish robust AI-assisted workflows.

How to use this document
------------------------
- Read the attached PDF for the full slides and examples.
- Use this README as a quick reference for the principal takeaways and suggested actions.
- Implement tips progressively — start with setup, then move into advanced prompt engineering and agents.

Key Points (10 + 1)
--------------------
1) Choosing the Right License
- Compare Copilot Free, Pro, and Business.
- Free is fine for trials/hobby projects; Pro for individuals; Business for teams and organizational controls.
- Consider data privacy and organizational policies when choosing.

2) Pay Attention to the Model
- Choose the AI model that best fits the task (e.g., GPT-5, Claude Sonnet, Grok).
- Model selection affects response style, speed, and code quality.

3) Workspace and Tool Setup
- Keep a clean, configured workspace (VS Code settings, Copilot enabled, AL extensions).
- Set AL-specific settings to improve context and cueing.

4) Managing MCP Servers
- Avoid overloading your workflow with too many MCP servers; they can cause decision fatigue.
- Use only those that deliver clear value.

5) Custom Instructions for Copilot
- Add custom AL rules and a modular set of instructions to guide Copilot.
- Consider repo-level guidelines (for example, alguidelines.dev) to standardize behavior.

6) Agents and Cognitive Focus
- Use agents (role-specific domains) to keep Copilot focused and reduce context switching.
- Each agent should have a clearly defined scope and prompts.

7) Context Injection
- Provide Copilot with editor context: active files, recent chats, memory/spec files.
- Use `spec.md`/`memory.md` and context files to improve results and coherence.

8) Prompt Engineering
- Use reusable prompt templates. Be explicit about goals, outputs, and constraints.
- Include sample inputs/outputs when applicable.

9) Agent CLI Runtimes
- Apply agent CLI runtimes to scale the development workflows and integrate agentic automation into your pipeline.

10) Leverage Coding Agent
- Delegate repetitive or boilerplate tasks to Copilot’s coding agent to save time.
- Use it with careful validation (tests, QA) to avoid subtle regressions.

+1) Adopt Spec-Kit
- Use spec-driven development where the spec is the source of truth.
- This reduces ambiguity and improves predictability when AI generates code.

Final Takeaways
---------------
- Select the right license & AI model based on your needs.
- Keep your environment focused and avoid tool overload.
- Structure prompts and templates for reproducible results.
- Build a personal AI framework with custom instructions and agents.
- Use spec-driven development before coding.
- Automate repetitive tasks using Copilot’s coding agent while validating outcomes with tests.

Files
-----
- Source PDF: `Github Copilot-A practical approach to AL in 10 plus1 tips and tricks.pdf`
- This README: `README.md` in the same folder

Author & References
-------------------
- Author: Javier Armesto
- Presentation: Provided PDF in this folder
- Further reading: alguidelines.dev, GitHub Copilot docs

License
-------
This summary is provided under the same licensing terms as the project; adapt or reuse as you see fit.
