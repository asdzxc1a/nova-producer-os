use serde::{Deserialize, Serialize};

/// The 7 specialist AI agents + synthesizer that make up the virtual production crew.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AgentArchetype {
    ScriptAnalyst,
    PreVizDirector,
    CastingScout,
    LocationScout,
    BudgetOracle,
    ComplianceOfficer,
    DistributionAnalyst,
    SynthesisAgent,
}

impl AgentArchetype {
    #[must_use]
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::ScriptAnalyst => "script_analyst",
            Self::PreVizDirector => "pre_viz_director",
            Self::CastingScout => "casting_scout",
            Self::LocationScout => "location_scout",
            Self::BudgetOracle => "budget_oracle",
            Self::ComplianceOfficer => "compliance_officer",
            Self::DistributionAnalyst => "distribution_analyst",
            Self::SynthesisAgent => "synthesis_agent",
        }
    }

    #[must_use]
    pub fn display_name(&self) -> &'static str {
        match self {
            Self::ScriptAnalyst => "Script Analyst",
            Self::PreVizDirector => "Pre-Viz Director",
            Self::CastingScout => "Casting Scout",
            Self::LocationScout => "Location Scout",
            Self::BudgetOracle => "Budget Oracle",
            Self::ComplianceOfficer => "Compliance Officer",
            Self::DistributionAnalyst => "Distribution Analyst",
            Self::SynthesisAgent => "Synthesis Agent",
        }
    }

    #[must_use]
    pub fn system_prompt(&self) -> &'static str {
        match self {
            Self::ScriptAnalyst => {
                "You are a veteran Head of Development who has read 10,000+ scripts. \
Your job is to give brutally honest, commercially informed coverage. \
Score each dimension 1-10. Always explain the score with specific evidence \
from the script. End with a clear RECOMMEND, CONSIDER, or PASS verdict."
            }
            Self::PreVizDirector => {
                "You are a visual storyteller who translates scripts into investor-ready \
visual concepts. Generate mood boards, scene visualizations, and tone references. \
Be specific about color palettes, camera angles, and visual motifs."
            }
            Self::CastingScout => {
                "You are a top-tier casting director. For each lead role, suggest 3 realistic \
casting options with bankability scores (1-10), availability estimates, and budget fit. \
Be realistic about quote ranges. Explain the packaging strategy."
            }
            Self::LocationScout => {
                "You are a location manager who identifies filming locations, estimates logistics \
costs, and flags permitting or travel issues. Provide real-world matches with alternatives."
            }
            Self::BudgetOracle => {
                "You are a line producer and financial analyst. Build detailed budgets, track burn \
rates, and model scenarios. Flag cost overruns and recommend contingency placement."
            }
            Self::ComplianceOfficer => {
                "You are an entertainment lawyer and compliance expert. Scan projects for EU AI Act \
exposure, union issues, and legal risks. Be conservative. If risk is high, say so clearly."
            }
            Self::DistributionAnalyst => {
                "You are a sales agent and festival strategist. Map the best path to market. \
Be specific about festival tiers, platform fit, and territory heat maps."
            }
            Self::SynthesisAgent => {
                "You are an executive producer reading reports from your department heads. \
Your job is to synthesize their findings into one decisive, board-ready document. \
Be concise. Lead with conclusions. Highlight conflicts between departments. \
End with specific next actions."
            }
        }
    }

    #[must_use]
    pub fn artifact_name(&self) -> Option<&'static str> {
        match self {
            Self::ScriptAnalyst => Some("SCRIPT_COVERAGE"),
            Self::PreVizDirector => Some("PITCH_DECK"),
            Self::CastingScout => Some("CASTING_MATRIX"),
            Self::LocationScout => Some("LOCATION_REPORT"),
            Self::BudgetOracle => Some("BUDGET_MODEL"),
            Self::ComplianceOfficer => Some("COMPLIANCE_REPORT"),
            Self::DistributionAnalyst => Some("FESTIVAL_STRATEGY"),
            Self::SynthesisAgent => None,
        }
    }

    /// Returns the agent archetypes that run in parallel for a given stage.
    #[must_use]
    pub fn stage_agents(stage: super::workspace::ProducerStage) -> Vec<Self> {
        use super::workspace::ProducerStage;
        match stage {
            ProducerStage::Slate => vec![
                Self::ScriptAnalyst,
                Self::BudgetOracle,
                Self::SynthesisAgent,
            ],
            ProducerStage::Package => vec![
                Self::PreVizDirector,
                Self::CastingScout,
                Self::LocationScout,
                Self::SynthesisAgent,
            ],
            ProducerStage::Finance => vec![
                Self::BudgetOracle,
                Self::SynthesisAgent,
            ],
            ProducerStage::Comply => vec![
                Self::ComplianceOfficer,
                Self::SynthesisAgent,
            ],
            ProducerStage::Launch => vec![
                Self::DistributionAnalyst,
                Self::SynthesisAgent,
            ],
        }
    }
}
