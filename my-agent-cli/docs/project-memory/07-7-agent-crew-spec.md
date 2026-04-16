# 7-Agent Crew Specification

## Agent Overview

| # | Agent Name | Primary Stage | Output File | Core Function |
|---|---|---|---|---|
| 1 | **Script Analyst** | Slate | `SCRIPT_COVERAGE.md` | Evaluate scripts for structure, character, market fit |
| 2 | **Pre-Viz Director** | Package | `PITCH_DECK.md` | Generate visual pitch materials and lookbooks |
| 3 | **Casting Scout** | Package | `CASTING_MATRIX.md` | Suggest talent with bankability analysis |
| 4 | **Location Scout** | Package | `LOCATION_REPORT.md` | Identify locations and logistics |
| 5 | **Budget Oracle** | Finance | `BUDGET_MODEL.json`, `BURN_REPORT.md` | Model budgets, track burn, predict overruns |
| 6 | **Compliance Officer** | Comply | `COMPLIANCE_REPORT.md` | Scan for EU AI Act, union, and legal risks |
| 7 | **Distribution Analyst** | Launch | `FESTIVAL_STRATEGY.md`, `PLATFORM_FIT.md` | Map festival strategy and platform fit |
| 8 | **Synthesis Agent** | All | Stage-specific final artifact | Merge all agent outputs into unified report |

## Agent 1: Script Analyst

### Role
Expert script reader and development executive. Evaluates narrative structure, character arcs, dialogue quality, marketability, and genre fit.

### Input
- `slate.csv` or individual script PDF
- Workspace preferences (genre focus, budget tier, target rating)

### Output: `SCRIPT_COVERAGE.md`

```markdown
# Script Coverage: [Project Title]

## Logline
[One-sentence summary]

## Premise (1-10): [score]
[Why this score]

## Structure (1-10): [score]
[Three-act analysis]

## Character (1-10): [score]
[Protagonist arc, supporting roles]

## Dialogue (1-10): [score]
[Voice, authenticity, exposition handling]

## Marketability (1-10): [score]
[Genre trend alignment, comparable titles]

## Overall Verdict
[RECOMMEND / CONSIDER / PASS]

## Notes
[Specific strengths and weaknesses]
```

### System Prompt Core
> "You are a veteran Head of Development who has read 10,000+ scripts. Your job is to give brutally honest, commercially informed coverage. Score each dimension 1-10. Always explain the score with specific evidence from the script. End with a clear RECOMMEND, CONSIDER, or PASS verdict."

## Agent 2: Pre-Viz Director

### Role
Visual storyteller who translates scripts into investor-ready visual concepts. Generates mood boards, scene visualizations, and tone references.

### Input
- Selected script or treatment
- Creative brief (tone, references, visual style)
- Prior stage artifacts (SLATE_REPORT.md)

### Output: `PITCH_DECK.md`

```markdown
# Pitch Deck: [Project Title]

## Visual Thesis
[2-3 sentences on the film's visual identity]

## Mood Boards
### [Sequence 1]
- Description: [...]
- Visual References: [...]
- Color Palette: [...]

### [Sequence 2]
...

## Key Scene Visualizations
[Scene descriptions with AI image prompts]

## Tone References
[3 comparable films with visual notes]

## Director's Statement
[1 paragraph vision statement]
```

### MCP Tools Used
- `image-gen` — for concept art generation

## Agent 3: Casting Scout

### Role
Casting director with deep knowledge of talent bankability, availability windows, and package dynamics.

### Input
- Script (character breakdown)
- Budget tier from workspace
- Target market/territory

### Output: `CASTING_MATRIX.md`

```markdown
# Casting Matrix: [Project Title]

## Lead Role: [Character Name]
| Option | Actor | Bankability | Availability | Estimated Quote | Fit Score |
|---|---|---|---|---|---|
| A | ... | ... | ... | ... | ... |
| B | ... | ... | ... | ... | ... |
| C | ... | ... | ... | ... | ... |

## Supporting Role: [Character Name]
...

## Casting Strategy
[Priority order, package dynamics, festival angle]
```

### System Prompt Core
> "You are a top-tier casting director. For each lead role, suggest 3 realistic casting options with bankability scores (1-10), availability estimates, and budget fit. Be realistic about quote ranges. Explain the packaging strategy."

## Agent 4: Location Scout

### Role
Location manager who identifies filming locations, estimates logistics costs, and flags permitting or travel issues.

### Input
- Script (scene breakdown with locations)
- Budget tier
- Preferred shooting regions

### Output: `LOCATION_REPORT.md`

```markdown
# Location Report: [Project Title]

## Primary Locations

### [Location Name from Script]
- **Real-World Match**: [City/Country or Studio]
- **Logistics Rating**: [Easy / Moderate / Complex]
- **Estimated Daily Cost**: [$X]
- **Permitting Notes**: [...]
- **Weather/Season Considerations**: [...]
- **Alternatives**: [2 backup options]

## Location Budget Summary
- Total estimated location costs: [$X]
- Travel/housing estimate: [$X]
- Permitting estimate: [$X]

## Risk Factors
[Political, environmental, or logistical risks]
```

## Agent 5: Budget Oracle

### Role
Line producer and financial analyst who builds detailed budgets, tracks burn rates, and models scenarios.

### Input
- Script (page count, locations, cast size, VFX notes)
- Location report
- Casting matrix
- Workspace budget tier

### Output: `BUDGET_MODEL.json` + `BURN_REPORT.md`

**BUDGET_MODEL.json:**
```json
{
  "project_title": "...",
  "total_budget": 2500000,
  "currency": "USD",
  "categories": {
    "above_the_line": 450000,
    "production": 1200000,
    "post_production": 350000,
    "miscellaneous": 500000
  },
  "contingency": 0.15,
  "burn_rate_per_week": 125000,
  "shooting_days": 28,
  "risk_flags": ["vfx_heavy", "international_travel"]
}
```

**BURN_REPORT.md:**
```markdown
# Burn Report: [Project Title]

## Total Budget: $X
## Weekly Burn: $X
## Estimated Shoot Duration: X days

## Highest-Risk Categories
1. [Category] — [explanation]
2. [Category] — [explanation]

## Cost Overrun Scenarios
- 10% overrun: $X
- 20% overrun: $X

## Recommendations
[Where to cut, where to add contingency]
```

## Agent 6: Compliance Officer

### Role
Entertainment lawyer and compliance expert who scans projects for EU AI Act exposure, union issues, and legal risks.

### Input
- All prior artifacts (script, pitch deck, budget, locations)
- Workspace settings (jurisdictions, union status)

### Output: `COMPLIANCE_REPORT.md`

```markdown
# Compliance Report: [Project Title]

## EU AI Act Assessment
- **AI Usage Detected**: [Yes/No]
- **Generative AI in Production**: [None / Pre-Viz / VFX / Audio / Other]
- **Disclosure Requirements**: [...]
- **Human Contribution Documentation**: [Required / Recommended / N/A]
- **Risk Level**: [Low / Medium / High]

## Union & Labor
- **SAG-AFTRA Considerations**: [...]
- **WGA Considerations**: [...]
- **Local Guild Requirements**: [...]

## IP & Chain of Title
- [Flags or confirmations]

## Required Actions
1. [Action with deadline if applicable]
2. [Action]

## Approval Required
[Yes/No — if Yes, explains why]
```

### Approval Trigger
If `Risk Level == High`, the run step sets `approval_required = true` and pauses for human review.

## Agent 7: Distribution Analyst

### Role
Sales agent and festival strategist who maps the best path to market for a project.

### Input
- SLATE_REPORT.md (marketability scores)
- PITCH_DECK.md (visual identity)
- BUDGET_MODEL.json (budget tier)
- COMPLIANCE_REPORT.md (any red flags)

### Output: `FESTIVAL_STRATEGY.md` + `PLATFORM_FIT.md`

**FESTIVAL_STRATEGY.md:**
```markdown
# Festival Strategy: [Project Title]

## Tier 1 Targets
1. [Festival] — [Why, timing, submission deadline]
2. [Festival] — [Why]

## Tier 2 Targets
...

## Market Premieres
- [Best market for premiere: Cannes, Berlin, TIFF, etc.]

## Timeline
[Optimal festival circuit sequence]
```

**PLATFORM_FIT.md:**
```markdown
# Platform Fit: [Project Title]

## Best Fit: [Platform Name]
- **Match Score**: X/10
- **Audience Alignment**: [...]
- **Acquisition History**: [Comparable titles]
- **Estimated Deal Range**: [$X - $Y]

## Secondary Fits
...

## Territory Heat Map
- North America: [High/Medium/Low]
- Europe: [High/Medium/Low]
- Asia: [High/Medium/Low]
- Latin America: [High/Medium/Low]
```

## Agent 8: Synthesis Agent

### Role
Executive producer who reads all agent outputs and writes the unified stage artifact.

### Input
- All agent outputs from the current stage
- Workspace context
- Prior stage artifacts (if any)

### Output: Stage-specific final artifact

**For Slate stage:** `SLATE_REPORT.md`
```markdown
# Slate Analysis Report

## Slate Health Score: [0-100]
## Projects Analyzed: [N]

## Alive Projects
[...]

## Life Support Projects
[...]

## Dead Projects
[... with eulogies]

## Reallocation Playbook
[Where to move freed capital]

## What Would I Do
[3 conversations the producer needs to have this week]
```

**For Package stage:** `PITCH_DECK.md` (enhanced with casting/location integration)
**For Finance stage:** `BUDGET_MODEL.json` + `FINANCE_SUMMARY.md`
**For Comply stage:** `COMPLIANCE_REPORT.md` (final)
**For Launch stage:** `LAUNCH_PLAYBOOK.md`

### System Prompt Core
> "You are an executive producer reading reports from your department heads. Your job is to synthesize their findings into one decisive, board-ready document. Be concise. Lead with conclusions. Highlight conflicts between departments. End with specific next actions."

## Agent Prompt Engineering Rules

1. **Always return structured markdown** with clear sections and headers.
2. **Score when possible** (1-10, High/Medium/Low) to create quantifiable anchors.
3. **Cite evidence** — agent opinions must connect to input data.
4. **End with actionable next steps** — never leave the producer wondering what to do.
5. **Respect workspace preferences** — genre, budget tier, and risk tolerance from `workspace.json` must flavor all prompts.
6. **Use MCP tools when needed** — Pre-Viz Director uses `image-gen`, Distribution Analyst uses `web-search`.

## Agent Orchestration by Stage

### Slate Stage
```
Parallel: Script Analyst + Market Intel + Budget Oracle + Eulogist
↓
Synthesis Agent → SLATE_REPORT.md
```

### Package Stage
```
Parallel: Pre-Viz Director + Casting Scout + Location Scout
↓
Synthesis Agent → PITCH_DECK.md
```

### Finance Stage
```
Parallel: Budget Oracle (consolidated from prior artifacts)
↓
Synthesis Agent → BUDGET_MODEL.json + FINANCE_SUMMARY.md
```

### Comply Stage
```
Parallel: Compliance Officer (reads all prior artifacts)
↓
Synthesis Agent → COMPLIANCE_REPORT.md
```

### Launch Stage
```
Parallel: Distribution Analyst (reads all prior artifacts)
↓
Synthesis Agent → LAUNCH_PLAYBOOK.md
```
