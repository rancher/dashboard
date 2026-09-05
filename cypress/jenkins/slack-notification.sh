#!/bin/bash

# Slack notification script for Jenkins e2e test failures
# This script sends notifications to Slack when e2e tests fail in Jenkins

set -e

# Function to send Slack notification
send_slack_notification() {
	local status="$1"
	local message="$2"
	local bot_token="$3"
	local channel="$4"

	if [ -z "$bot_token" ]; then
		echo "Warning: UI_SLACK_BOT_TOKEN not set, skipping Slack notification"
		return 1
	fi

	# Prepare the JSON payload
	local payload=$(
		cat <<EOF
{
    "channel": "$channel",
    "text": "$message",
    "username": "Jenkins E2E Tests"
}
EOF
	)

	# Send the notification using Slack Web API
	# Try-catch block to handle any errors when communicating with Slack API
	set +e # Disable exit on error for try block
	# Bounded: this runs in the post block, so a stalled Slack call would hold
	# the build open against the outer timeout rather than the few seconds a
	# notification is worth.
	curl -X POST \
		--connect-timeout 10 --max-time 30 --retry 2 --retry-delay 3 \
		-H "Content-type: application/json; charset=utf-8" \
		-H "Authorization: Bearer $bot_token" \
		--data "$payload" \
		"https://slack.com/api/chat.postMessage" >/dev/null 2>&1
	local curl_exit_code=$?
	set -e # Re-enable exit on error

	# Catch block - handle any errors
	if [ $curl_exit_code -ne 0 ]; then
		echo "Error: Failed to send Slack notification"
		return 1
	fi

	return 0
}

# Function to read value from file
read_from_file() {
	local file_path="$1"

	if [ -f "$file_path" ]; then
		cat "$file_path" | tr -d '[:space:]'
	fi
}

# Function to read value from notification_values.txt
# Trims surrounding whitespace only — values such as build dates contain spaces.
# Double quotes and backslashes are dropped because the value is interpolated into
# the JSON payload, where they would otherwise produce a malformed request.
read_notification_value() {
	local key="$1"
	local file_path="${WORKSPACE}/notification_values.txt"

	if [ -f "$file_path" ]; then
		grep "^${key}=" "$file_path" | head -1 | cut -d'=' -f2- |
			sed 's/[\\"]//g; s/^[[:space:]]*//; s/[[:space:]]*$//'
	fi
}

# Emit a "• *Label:* value" message line, or nothing when the value is unavailable.
# Fields are skipped gracefully so the message stays correct as the playbook gains
# or drops keys in notification_values.txt.
append_field() {
	local label="$1"
	local value="$2"

	if [ -n "$value" ] && [ "$value" != "Unknown" ]; then
		printf '• *%s:* %s\\n' "$label" "$value"
	fi
}

# Main execution
send_jenkins_e2e_failure_notification() {
	local build_status="$1"
	local job_name="${JOB_NAME:-Unknown Job}"
	local build_number="${BUILD_NUMBER:-Unknown}"
	local build_url="${BUILD_URL:-}"

	# Job-specific variables from the playbook's notification_values.txt
	local rancher_version=$(read_notification_value "RANCHER_VERSION")
	local rancher_image_tag=$(read_notification_value "RANCHER_IMAGE_TAG")
	local rancher_chart_url=$(read_notification_value "RANCHER_CHART_URL")
	local rancher_helm_repo=$(read_notification_value "RANCHER_HELM_REPO")
	local rancher_build_type=$(read_notification_value "RANCHER_BUILD_TYPE")
	local ui_build=$(read_notification_value "UI_BUILD")
	local ui_source=$(read_notification_value "UI_SOURCE")
	local cypress_tags=$(read_notification_value "CYPRESS_TAGS")
	local kubernetes_version=$(read_notification_value "KUBERNETES_VERSION")
	local dashboard_branch=$(read_notification_value "DASHBOARD_BRANCH")

	# Get Slack bot token and channel from Secrets Manager
	local slack_bot_token="${UI_SLACK_BOT_TOKEN:-}"
	local slack_channel="${UI_SLACK_CHANNEL:-}"

	# Only send notifications for failures
	if [ "$build_status" != "FAILURE" ] && [ "$build_status" != "UNSTABLE" ]; then
		echo "Build status is $build_status, no notification needed"
		return 0
	fi

	# Prepare the message
	local emoji="❌"
	local status_text="FAILED"

	if [ "$build_status" = "UNSTABLE" ]; then
		emoji="⚠️"
		status_text="UNSTABLE"
	fi

	local message="*E2E Tests $status_text* $emoji\n"
	message+="• *Job:* $job_name\n"

	# Add build number with link
	if [ -n "$build_url" ] && [ "$build_number" != "Unknown" ]; then
		message+="• *Build:* <$build_url|#$build_number>\n"
	elif [ "$build_number" != "Unknown" ]; then
		message+="• *Build:* #$build_number\n"
	fi

	# Test totals, published by the Jenkinsfile from the junit step's own summary
	local test_summary=""

	if [ -n "${TESTS_TOTAL:-}" ] && [ "${TESTS_TOTAL}" -gt 0 ] 2>/dev/null; then
		test_summary="${TESTS_TOTAL} run, ${TESTS_FAILED:-0} failed"
	fi

	message+=$(append_field "Tests" "$test_summary")
	message+=$(append_field "Rancher Version" "$rancher_version")
	message+=$(append_field "Rancher Image" "$rancher_image_tag")
	message+=$(append_field "Build Type" "$rancher_build_type")
	# A run tests a backend and a UI, and on a head build the default serves the
	# UI from the CDN rather than the image, so the pair is worth naming.
	message+=$(append_field "UI Build" "${ui_build:+${ui_build}${ui_source:+ (from the ${ui_source})}}")
	message+=$(append_field "K8s Version" "$kubernetes_version")
	message+=$(append_field "Chart URL" "$rancher_chart_url")
	message+=$(append_field "Helm Repo" "$rancher_helm_repo")
	message+=$(append_field "Dashboard Branch" "$dashboard_branch")
	message+=$(append_field "Cypress Tags" "$cypress_tags")

	message+="• *Timestamp:* $(date -u '+%Y-%m-%d %H:%M:%S UTC')"

	echo "Sending Slack notification for $build_status build..."
	if send_slack_notification "$build_status" "$message" "$slack_bot_token" "$slack_channel"; then
		echo "Slack notification sent successfully"
		return 0
	else
		echo "Failed to send Slack notification"
		return 1
	fi
}

# Execute main function with build status
send_jenkins_e2e_failure_notification "$1"
