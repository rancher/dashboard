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
        return 0
    fi
    
    # Prepare the JSON payload
    local payload=$(cat <<EOF
{
    "channel": "$channel",
    "text": "$message",
    "username": "Jenkins E2E Tests"
}
EOF
)
    
    # Send the notification using Slack Web API
    # Try-catch block to handle any errors when communicating with Slack API
    set +e  # Disable exit on error for try block
    curl -X POST \
        -H "Content-type: application/json; charset=utf-8" \
        -H "Authorization: Bearer $bot_token" \
        --data "$payload" \
        "https://slack.com/api/chat.postMessage" > /dev/null 2>&1
    local curl_exit_code=$?
    set -e  # Re-enable exit on error
    
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
read_notification_value() {
    local key="$1"
    local file_path="${WORKSPACE}/notification_values.txt"
    
    if [ -f "$file_path" ]; then
        grep "^${key}=" "$file_path" | cut -d'=' -f2- | tr -d '[:space:]'
    fi
}

# Main execution
send_jenkins_e2e_failure_notification() {
    local build_status="$1"
    local job_name="${JOB_NAME:-Unknown Job}"
    local build_number="${BUILD_NUMBER:-Unknown}"
    local build_url="${BUILD_URL:-}"
    
    # Job-specific variables from init.sh
    local rancher_version=$(read_notification_value "RANCHER_VERSION")
    local rancher_image_tag=$(read_notification_value "RANCHER_IMAGE_TAG")
    local rancher_chart_url=$(read_notification_value "RANCHER_CHART_URL")
    local rancher_helm_repo=$(read_notification_value "RANCHER_HELM_REPO")
    local cypress_tags=$(read_notification_value "CYPRESS_TAGS")
    
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
    
    if [ -n "$rancher_version" ] && [ "$rancher_version" != "Unknown" ]; then
        message+="• *Rancher Version:* $rancher_version\n"
    fi
    
    if [ -n "$rancher_image_tag" ] && [ "$rancher_image_tag" != "Unknown" ]; then
        message+="• *Rancher Image:* $rancher_image_tag\n"
    fi
    
    if [ -n "$rancher_chart_url" ] && [ "$rancher_chart_url" != "Unknown" ]; then
        message+="• *Chart URL:* $rancher_chart_url\n"
    fi
    
    if [ -n "$rancher_helm_repo" ] && [ "$rancher_helm_repo" != "Unknown" ]; then
        message+="• *Helm Repo:* $rancher_helm_repo\n"
    fi

    if [ -n "$cypress_tags" ] && [ "$cypress_tags" != "Unknown" ]; then
        message+="• *Cypress Tags:* $cypress_tags\n"
    fi
    
    message+="• *Timestamp:* $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
    
    echo "Sending Slack notification for $build_status build..."
    send_slack_notification "$build_status" "$message" "$slack_bot_token" "$slack_channel"
    
    if [ $? -eq 0 ]; then
        echo "Slack notification sent successfully"
    else
        echo "Failed to send Slack notification"
        return 1
    fi
}

# Execute main function with build status
send_jenkins_e2e_failure_notification "$1" 