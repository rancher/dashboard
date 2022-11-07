export const NOTIFICATIONTMPLVALUE = `{{- define "title.text.list" -}}
*[GROUP - Details]*
One or more alarms in this group have triggered a notification.

{{- if gt (len .GroupLabels.Values) 0 }}
*Group Labels:*
  {{- range .GroupLabels.SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- if .ExternalURL }}
*Link to AlertManager:* {{ .ExternalURL }}
{{- end }}

{{- range .Alerts }}
{{ template "rancher.text_single" . }}
{{- end }}
{{- end -}}

{{- define "rancher.text_single" -}}
{{- if .Labels.alertname }}
*[ALERT - {{ .Labels.alertname }}]*
{{- else }}
*[ALERT]*
{{- end }}
{{- if .Labels.severity }}
*Severity:* \`{{ .Labels.severity }}\`
{{- end }}
{{- if .Labels.cluster }}
*Cluster:*  {{ .Labels.cluster }}
{{- end }}
{{- if .Annotations.summary }}
*Summary:* {{ .Annotations.summary }}
{{- end }}
{{- if .Annotations.message }}
*Message:* {{ .Annotations.message }}
{{- end }}
{{- if .Annotations.description }}
*Description:* {{ .Annotations.description }}
{{- end }}
{{- if .Annotations.runbook_url }}
*Runbook URL:* <{{ .Annotations.runbook_url }}|:spiral_note_pad:>
{{- end }}
{{- with .Labels }}
{{- with .Remove (stringSlice "alertname" "severity" "cluster") }}
{{- if gt (len .) 0 }}
*Additional Labels:*
  {{- range .SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
{{- with .Annotations }}
{{- with .Remove (stringSlice "summary" "message" "description" "runbook_url") }}
{{- if gt (len .) 0 }}
*Additional Annotations:*
  {{- range .SortedPairs }}
  • *{{ .Name }}:* \`{{ .Value }}\`
  {{- end }}
{{- end }}
{{- end }}
{{- end }}
{{- end -}}`;
