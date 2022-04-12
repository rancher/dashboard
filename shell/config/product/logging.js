import { LOGGING } from '@shell/config/types';
import { DSL } from '@shell/store/type-map';
import {
  LOGGING_OUTPUT_PROVIDERS, STATE, NAME as NAME_COL, NAMESPACE as NAMESPACE_COL, AGE, OUTPUT, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS
} from '@shell/config/table-headers';

export const NAME = 'logging';
export const CHART_NAME = 'rancher-logging';

export function init(store) {
  const {
    headers,
    product,
    basicType,
    spoofedType,
    virtualType,
  } = DSL(store, NAME);

  product({
    ifHaveGroup:         /^(.*\.)?logging\.banzaicloud\.io$/,
    icon:                'logging',
    showNamespaceFilter: true,
    weight:              89,
  });

  basicType([
    'logging-overview',
    'logging.banzaicloud.io.common',
    LOGGING.CLUSTER_FLOW,
    LOGGING.CLUSTER_OUTPUT,
    LOGGING.FLOW,
    LOGGING.OUTPUT,
  ]);

  virtualType({
    label:      'Overview',
    namespaced: false,
    name:       'logging-overview',
    route:      { name: 'c-cluster-logging' },
    exact:       true,
    overview:    true,
  });

  spoofedType({
    label:      'Filters',
    type:       LOGGING.SPOOFED.FILTERS,
    schemas: [
      {
        id:                LOGGING.SPOOFED.FILTERS,
        type:              'schema',
        resourceFields:    { filters: { type: `array[${ LOGGING.SPOOFED.FILTER }]` } },
      },
      {
        id:                LOGGING.SPOOFED.FILTER,
        type:              'schema',
        resourceFields:    {
          concat:             { type: LOGGING.SPOOFED.CONCAT },
          dedot:              { type: LOGGING.SPOOFED.DEDOT },
          detectExceptions:   { type: LOGGING.SPOOFED.DETECTEXCEPTIONS },
          geoip:              { type: LOGGING.SPOOFED.GEOIP },
          grep:               { type: LOGGING.SPOOFED.GREP },
          parser:             { type: LOGGING.SPOOFED.PARSER },
          prometheus:         { type: LOGGING.SPOOFED.PROMETHEUS },
          record_modifier:    { type: LOGGING.SPOOFED.RECORD_MODIFIER },
          record_transformer: { type: LOGGING.SPOOFED.RECORD_TRANSFORMER },
          stdout:             { type: LOGGING.SPOOFED.STDOUT },
          sumologic:          { type: LOGGING.SPOOFED.SUMOLOGIC },
          tag_normaliser:     { type: LOGGING.SPOOFED.TAG_NORMALISER },
          throttle:           { type: LOGGING.SPOOFED.THROTTLE },
        },
      },
      {
        id:                LOGGING.SPOOFED.CONCAT,
        type:              'schema',
        resourceFields:    {
          key:                    { type: 'string' },
          separator:              { type: 'string' },
          n_lines:                { type: 'int' },
          multiline_start_regexp: { type: 'string' },
          multiline_end_regexp:   { type: 'string' },
          continuous_line_regexp: { type: 'string' },
          stream_identity_key:    { type: 'string' },
          flush_interval:         { type: 'int' },
          timeout_label:          { type: 'string' },
          use_first_timestamp:    { type: 'boolean' },
          partial_key:            { type: 'string' },
          partial_value:          { type: 'string' },
          keep_partial_key:       { type: 'boolean' },
          use_partial_metadata:   { type: 'string' },
          keep_partial_metadata:  { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.DEDOT,
        type:              'schema',
        resourceFields:    {
          de_dot_nested:    { type: 'boolean' },
          de_dot_separator: { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.DETECTEXCEPTIONS,
        type:              'schema',
        resourceFields:    {
          message:                  { type: 'string' },
          remove_tag_prefix:        { type: 'string' },
          multiline_flush_interval: { type: 'string' },
          languages:                { type: 'array[string]' },
          max_lines:                { type: 'int' },
          max_bytes:                { type: 'int' },
          stream:                   { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.GEOIP,
        type:              'schema',
        resourceFields:    {
          geoip_lookup_keys:       { type: 'string' },
          geoip_database:          { type: 'string' },
          geoip_2_database:        { type: 'string' },
          backend_library:         { type: 'string' },
          skip_adding_null_record: { type: 'boolean' },
          records:                 { type: `array[${ LOGGING.SPOOFED.RECORD }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.GREP,
        type:              'schema',
        resourceFields:    {
          regexp:  { type: `array[${ LOGGING.SPOOFED.REGEXPSECTION }]` },
          exclude: { type: `array[${ LOGGING.SPOOFED.EXCLUDESECTION }]` },
          or:      { type: `array[${ LOGGING.SPOOFED.ORSECTION }]` },
          and:     { type: `array[${ LOGGING.SPOOFED.ANDSECTION }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.PARSER,
        type:              'schema',
        resourceFields:    {
          key_name:                     { type: 'string' },
          reserve_time:                 { type: 'boolean' },
          reserve_data:                 { type: 'boolean' },
          remove_key_name_field:        { type: 'boolean' },
          replace_invalid_sequence:     { type: 'boolean' },
          inject_key_prefix:            { type: 'string' },
          hash_value_field:             { type: 'string' },
          emit_invalid_record_to_error: { type: 'boolean' },
          parse:                        { type: 'ParseSection' },
          parsers:                      { type: `array[${ LOGGING.SPOOFED.PARSESECTION }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.PROMETHEUS,
        type:              'schema',
        resourceFields:    {
          metrics: { type: `array[${ LOGGING.SPOOFED.METRICSECTION }]` },
          labels:  { type: 'Label' },
        },
      },
      {
        id:                LOGGING.SPOOFED.RECORD_MODIFIER,
        type:              'schema',
        resourceFields:    {
          prepare_value:  { type: 'string' },
          char_encoding:  { type: 'string' },
          remove_keys:    { type: 'string' },
          whitelist_keys: { type: 'string' },
          replaces:       { type: `array[${ LOGGING.SPOOFED.REPLACE }]` },
          records:        { type: `array[${ LOGGING.SPOOFED.RECORD }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.RECORD_TRANSFORMER,
        type:              'schema',
        resourceFields:    {
          remove_keys:    { type: 'string' },
          keep_keys:      { type: 'string' },
          renew_record:   { type: 'boolean' },
          renew_time_key: { type: 'string' },
          enable_ruby:    { type: 'boolean' },
          auto_typecast:  { type: 'boolean' },
          records:        { type: `array[${ LOGGING.SPOOFED.RECORD }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.STDOUT,
        type:              'schema',
        resourceFields:    { output_type: { type: 'string' } },
      },
      {
        id:                LOGGING.SPOOFED.SUMOLOGIC,
        type:              'schema',
        resourceFields:    {
          source_category:              { type: 'string' },
          source_category_replace_dash: { type: 'string' },
          source_category_prefix:       { type: 'string' },
          source_name:                  { type: 'string' },
          log_format:                   { type: 'string' },
          source_host:                  { type: 'string' },
          exclude_container_regex:      { type: 'string' },
          exclude_facility_regex:       { type: 'string' },
          exclude_host_regex:           { type: 'string' },
          exclude_namespace_regex:      { type: 'string' },
          exclude_pod_regex:            { type: 'string' },
          exclude_priority_regex:       { type: 'string' },
          exclude_unit_regex:           { type: 'string' },
          tracing_format:               { type: 'boolean' },
          tracing_namespace:            { type: 'string' },
          tracing_pod:                  { type: 'string' },
          tracing_pod_id:               { type: 'string' },
          tracing_container_name:       { type: 'string' },
          tracing_host:                 { type: 'string' },
          tracing_label_prefix:         { type: 'string' },
          tracing_annotation_prefix:    { type: 'string' },
          source_host_key_name:         { type: 'string' },
          source_category_key_name:     { type: 'string' },
          source_name_key_name:         { type: 'string' },
          collector_key_name:           { type: 'string' },
          collector_value:              { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.TAG_NORMALISER,
        type:              'schema',
        resourceFields:    { format: { type: 'string' } },
      },
      {
        id:                LOGGING.SPOOFED.THROTTLE,
        type:              'schema',
        resourceFields:    {
          group_key:                 { type: 'string' },
          group_bucket_period_s:     { type: 'int' },
          group_bucket_limit:        { type: 'int' },
          group_drop_logs:           { type: 'boolean' },
          group_reset_rate_s:        { type: 'int' },
          group_warning_delay_s:     { type: 'int' },
          exclude_container_regex:   { type: 'string' },
          exclude_facility_regex:    { type: 'string' },
          exclude_host_regex:        { type: 'string' },
          exclude_namespace_regex:   { type: 'string' },
          exclude_pod_regex:         { type: 'string' },
          exclude_priority_regex:    { type: 'string' },
          exclude_unit_regex:        { type: 'string' },
          tracing_format:            { type: 'boolean' },
          tracing_namespace:         { type: 'string' },
          tracing_pod:               { type: 'string' },
          tracing_pod_id:            { type: 'string' },
          tracing_container_name:    { type: 'string' },
          tracing_host:              { type: 'string' },
          tracing_label_prefix:      { type: 'string' },
          tracing_annotation_prefix: { type: 'string' },
          source_host_key_name:      { type: 'string' },
          source_category_key_name:  { type: 'string' },
          source_name_key_name:      { type: 'string' },
          collector_key_name:        { type: 'string' },
          collector_value:           { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.RECORD,
        type:              'schema',
        resourceFields:    { key: { type: 'value' } },
      },
      {
        id:                LOGGING.SPOOFED.REGEXPSECTION,
        type:              'schema',
        resourceFields:    {
          key:     { type: 'string' },
          pattern: { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.EXCLUDESECTION,
        type:              'schema',
        resourceFields:    {
          key:     { type: 'string' },
          pattern: { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.ORSECTION,
        type:              'schema',
        resourceFields:    {
          regexp:  { type: `array[${ LOGGING.SPOOFED.REGEXPSECTION }]` },
          exclude: { type: `array[${ LOGGING.SPOOFED.EXCLUDESECTION }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.ANDSECTION,
        type:              'schema',
        resourceFields:    {
          regexp:  { type: `array[${ LOGGING.SPOOFED.REGEXPSECTION }]` },
          exclude: { type: `array[${ LOGGING.SPOOFED.EXCLUDESECTION }]` },
        },
      },
      {
        id:                LOGGING.SPOOFED.PARSESECTION,
        type:              'schema',
        resourceFields:    {
          type:                      { type: 'string' },
          expression:                { type: 'string' },
          time_key:                  { type: 'string' },
          null_value_pattern:        { type: 'string' },
          null_empty_string:         { type: 'boolean' },
          estimate_current_event:    { type: 'boolean' },
          keep_time_key:             { type: 'boolean' },
          types:                     { type: 'string' },
          time_format:               { type: 'string' },
          time_type:                 { type: 'string' },
          local_time:                { type: 'boolean' },
          utc:                       { type: 'boolean' },
          timezone:                  { type: 'string' },
          format:                    { type: 'string' },
          format_firstline:          { type: 'string' },
          delimiter:                 { type: 'string' },
          delimiter_pattern:         { type: 'string' },
          label_delimiter:           { type: 'string' },
          multiline:                 { type: 'array[string]' },
          patterns:                  { type: `array[${ LOGGING.SPOOFED.SINGLEPARSESECTION }]` },
          tracing_annotation_prefix: { type: 'string' },
          source_host_key_name:      { type: 'string' },
          source_category_key_name:  { type: 'string' },
          source_name_key_name:      { type: 'string' },
          collector_key_name:        { type: 'string' },
          collector_value:           { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.SINGLEPARSESECTION,
        type:              'schema',
        resourceFields:    {
          type:                      { type: 'string' },
          expression:                { type: 'string' },
          time_key:                  { type: 'string' },
          null_value_pattern:        { type: 'string' },
          null_empty_string:         { type: 'boolean' },
          estimate_current_event:    { type: 'boolean' },
          keep_time_key:             { type: 'boolean' },
          types:                     { type: 'string' },
          time_format:               { type: 'string' },
          time_type:                 { type: 'string' },
          local_time:                { type: 'boolean' },
          utc:                       { type: 'boolean' },
          timezone:                  { type: 'string' },
          format:                    { type: 'string' },
        },
      },
      {
        id:                LOGGING.SPOOFED.METRICSECTION,
        type:              'schema',
        resourceFields:    {
          name:    { type: 'string' },
          type:    { type: 'string' },
          desc:    { type: 'string' },
          key:     { type: 'string' },
          buckets: { type: 'string' },
          labels:  { type: LOGGING.SPOOFED.RECORD },
        },
      },
      {
        id:                LOGGING.SPOOFED.REPLACE,
        type:              'schema',
        resourceFields:    {
          key:        { type: 'string' },
          expression: { type: 'string' },
          replace:    { type: 'string' },
        },
      },
    ],
    getInstances: () => []
  });

  headers(LOGGING.FLOW, [STATE, NAME_COL, NAMESPACE_COL, OUTPUT, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS, AGE]);
  headers(LOGGING.OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);
  headers(LOGGING.CLUSTER_FLOW, [STATE, NAME_COL, NAMESPACE_COL, CLUSTER_OUTPUT, CONFIGURED_PROVIDERS, AGE]);
  headers(LOGGING.CLUSTER_OUTPUT, [STATE, NAME_COL, NAMESPACE_COL, LOGGING_OUTPUT_PROVIDERS, AGE]);
}
