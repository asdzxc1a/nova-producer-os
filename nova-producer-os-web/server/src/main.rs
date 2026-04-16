use axum::{
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::{Any, CorsLayer};

mod handlers;
mod state;

use handlers::{
    approvals::{list_approvals, resolve_approval},
    artifacts::{list_artifacts, read_artifact},
    dashboard::{create_workspace, get_dashboard, list_workspaces, open_workspace, set_project_root},
    runs::{get_run_status, run_stage},
};
use state::AppState;

#[tokio::main]
async fn main() {
    let workspace_root = match std::env::var("WORKSPACE_ROOT") {
        Ok(path) => std::path::PathBuf::from(path),
        Err(_) => {
            let cwd = std::env::current_dir().unwrap_or_else(|_| std::path::PathBuf::from("."));
            // Resolve project root: if inside nova-producer-os-web/server, use parent
            if cwd.file_name().map(|n| n == "server").unwrap_or(false) {
                cwd.parent().unwrap_or(&cwd).to_path_buf()
            } else {
                cwd
            }
        }
    };
    let env_path = workspace_root.join(".env");
    if env_path.exists() {
        let _ = dotenvy::from_path(&env_path);
    }

    let cors = if let Ok(frontend_url) = std::env::var("FRONTEND_URL") {
        CorsLayer::new()
            .allow_origin(tower_http::cors::AllowOrigin::exact(
                frontend_url.parse().expect("Invalid FRONTEND_URL")
            ))
            .allow_methods(Any)
            .allow_headers(Any)
    } else {
        CorsLayer::new()
            .allow_origin(Any)
            .allow_methods(Any)
            .allow_headers(Any)
    };

    let app_state = Arc::new(AppState::new("cannes-demo", workspace_root));

    let app = Router::new()
        .route("/health", get(health))
        .route("/api/dashboard", get(get_dashboard))
        .route("/api/workspaces", get(list_workspaces))
        .route("/api/workspace/open", post(open_workspace))
        .route("/api/workspace/create", post(create_workspace))
        .route("/api/project-root", post(set_project_root))
        .route("/api/run", post(run_stage))
        .route("/api/run/:id", get(get_run_status))
        .route("/api/artifacts", get(list_artifacts))
        .route("/api/artifacts/:name", get(read_artifact))
        .route("/api/approvals", get(list_approvals))
        .route("/api/approvals/resolve", post(resolve_approval))
        .layer(cors)
        .with_state(app_state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3001);
    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    println!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health() -> &'static str {
    "ok"
}
