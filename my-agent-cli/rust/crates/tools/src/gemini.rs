use reqwest::blocking::Client;
use serde_json::json;
use std::env;
use std::thread;
use std::time::Duration;

/// Call the Google Gemini API directly via HTTP.
///
/// Requires `GEMINI_API_KEY` environment variable to be set.
/// Optionally respects `GEMINI_MODEL` (defaults to `gemini-2.5-pro`).
/// Retries automatically on 429 rate-limit errors with exponential backoff.
pub fn generate(prompt: &str) -> Result<String, String> {
    let api_key = env::var("GEMINI_API_KEY")
        .map_err(|_| "GEMINI_API_KEY environment variable not set".to_string())?;

    let model = env::var("GEMINI_MODEL").unwrap_or_else(|_| "gemini-2.5-pro".to_string());

    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
        model, api_key
    );

    let body = json!({
        "contents": [{
            "parts": [{"text": prompt}]
        }]
    });

    let client = Client::new();

    let mut last_error = String::new();
    for attempt in 0..5 {
        let response = client
            .post(&url)
            .json(&body)
            .send()
            .map_err(|e| format!("Failed to send Gemini API request: {}", e))?;

        let status = response.status();
        let json: serde_json::Value = response
            .json()
            .map_err(|e| format!("Failed to parse Gemini API response: {}", e))?;

        if status.is_success() {
            let text = json
                .get("candidates")
                .and_then(|c| c.as_array())
                .and_then(|arr| arr.first())
                .and_then(|c| c.get("content"))
                .and_then(|c| c.get("parts"))
                .and_then(|p| p.as_array())
                .and_then(|arr| arr.first())
                .and_then(|p| p.get("text"))
                .and_then(|t| t.as_str())
                .map(|s| s.to_string())
                .ok_or_else(|| format!("Unexpected Gemini API response format: {}", json))?;
            return Ok(text);
        }

        let err_msg = json["error"]["message"]
            .as_str()
            .unwrap_or("unknown error")
            .to_string();
        last_error = format!("Gemini API error ({}): {}", status, err_msg);

        if status.as_u16() == 429 {
            // Exponential backoff: 1s, 2s, 4s, 8s, then give up
            let delay = Duration::from_secs(1 << attempt);
            thread::sleep(delay);
            continue;
        }

        return Err(last_error);
    }

    Err(last_error)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn gemini_api_returns_text() {
        // Only run if GEMINI_API_KEY is set
        if env::var("GEMINI_API_KEY").is_err() {
            eprintln!("Skipping gemini_api_returns_text: GEMINI_API_KEY not set");
            return;
        }

        let result = generate("Say hello in exactly one word.");
        assert!(
            result.is_ok(),
            "Expected successful Gemini API response, got: {:?}",
            result
        );
        let text = result.unwrap();
        assert!(
            !text.trim().is_empty(),
            "Expected non-empty response, got: '{}'",
            text
        );
    }
}
