## Skills

### Available skills
- systematic-debugging: Follow a structured, hypothesis-driven debugging workflow for root-cause analysis and verification. (file: /Users/a2333/IDE/tgbot-Ultra-v1/.agents/skills/systematic-debugging/SKILL.md)
- self-improving-agent: Continuously improve task execution quality using reflection, checkpoints, and correction loops. (file: /Users/a2333/IDE/tgbot-Ultra-v1/.agents/skills/self-improving-agent/SKILL.md)

### Default trigger rules
- On every conversation turn, trigger both `systematic-debugging` and `self-improving-agent` first.
- If task type clearly does not require debugging, keep `systematic-debugging` lightweight (quick checklist only), but still trigger it.
- Apply both skills before code edits, command execution, and final response.

### How to use skills
- Read only the minimum required sections of each SKILL.md for the current task.
- If both skills apply, execute in this order: `systematic-debugging` -> `self-improving-agent`.
- If a skill file is missing, continue with best-effort fallback and report it briefly.
