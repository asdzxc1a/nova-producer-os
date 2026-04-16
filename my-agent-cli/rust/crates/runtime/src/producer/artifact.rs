use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// A durable output produced by an agent or synthesis step.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ProducerArtifact {
    pub name: String,
    pub version: ArtifactVersion,
    pub artifact_type: ArtifactType,
    pub stage: super::workspace::ProducerStage,
    pub path: PathBuf,
    pub created_at: String,
    pub run_id: String,
    pub metadata: ArtifactMetadata,
}

impl ProducerArtifact {
    #[must_use]
    pub fn new(
        name: impl Into<String>,
        version: ArtifactVersion,
        artifact_type: ArtifactType,
        stage: super::workspace::ProducerStage,
        path: PathBuf,
        run_id: impl Into<String>,
    ) -> Self {
        Self {
            name: name.into(),
            version,
            artifact_type,
            stage,
            path,
            created_at: chrono::Utc::now().to_rfc3339(),
            run_id: run_id.into(),
            metadata: ArtifactMetadata::default(),
        }
    }

    #[must_use]
    pub fn file_name(&self) -> String {
        format!("{}-v{}.md", self.name, self.version.major)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub struct ArtifactVersion {
    pub major: u32,
    pub minor: u32,
}

impl ArtifactVersion {
    #[must_use]
    pub const fn new(major: u32, minor: u32) -> Self {
        Self { major, minor }
    }
}

impl Default for ArtifactVersion {
    fn default() -> Self {
        Self::new(1, 0)
    }
}

impl std::fmt::Display for ArtifactVersion {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}.{}", self.major, self.minor)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ArtifactType {
    Markdown,
    Json,
    Csv,
    Pdf,
    Image,
}

impl ArtifactType {
    #[must_use]
    pub fn extension(&self) -> &'static str {
        match self {
            Self::Markdown => "md",
            Self::Json => "json",
            Self::Csv => "csv",
            Self::Pdf => "pdf",
            Self::Image => "png",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Default, Serialize, Deserialize)]
pub struct ArtifactMetadata {
    pub tags: Vec<String>,
    pub author_agent: Option<String>,
    pub reviewed: bool,
    pub approved: bool,
}
