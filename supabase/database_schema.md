## Table `users`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `full_name` | `text` |  Nullable |
| `avatar_url` | `text` |  Nullable |
| `locale` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `email` | `text` |  Nullable |
| `mobile_number` | `text` |  Nullable |
| `whatsapp_number` | `text` |  Nullable |

## Table `organizations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `name` | `text` |  |
| `slug` | `text` |  Nullable Unique |
| `plan` | `text` |  |
| `owner_user_id` | `uuid` |  Nullable |
| `timezone` | `text` |  Nullable |
| `settings` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `organization_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `user_id` | `uuid` |  |
| `full_name` | `text` |  |
| `initials` | `text` |  Nullable |
| `role` | `member_role` |  |
| `title` | `text` |  Nullable |
| `manager_id` | `uuid` |  Nullable |
| `reports_to` | `uuid` |  Nullable |
| `rank` | `member_rank` |  |
| `gender` | `member_gender` |  Nullable |
| `employee_code` | `text` |  Nullable |
| `mobile_number` | `text` |  Nullable |
| `whatsapp_number` | `text` |  Nullable |
| `permissions` | `jsonb` |  Nullable |
| `status` | `member_status` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `projects`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `description` | `text` |  Nullable |
| `status` | `project_status` |  |
| `visibility` | `project_visibility` |  |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `project_members`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `project_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `role` | `project_member_role` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_statuses`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  Nullable |
| `key` | `task_status_key` |  |
| `label` | `text` |  |
| `order_index` | `int4` |  |
| `color` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `tasks`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  |
| `status_id` | `uuid` |  Nullable |
| `title` | `text` |  |
| `description` | `text` |  Nullable |
| `priority` | `task_priority` |  |
| `assignee_id` | `uuid` |  Nullable |
| `due_date` | `date` |  Nullable |
| `start_date` | `date` |  Nullable |
| `estimate_hours` | `numeric` |  Nullable |
| `labels` | `_text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `task_comments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `author_id` | `uuid` |  |
| `body` | `text` |  |
| `mentions` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_attachments`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `uploader_id` | `uuid` |  Nullable |
| `storage_path` | `text` |  |
| `mime_type` | `text` |  Nullable |
| `file_size` | `int8` |  Nullable |
| `source` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_activity`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `task_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `org_chart_nodes`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `parent_node_id` | `uuid` |  Nullable |
| `position_title` | `text` |  Nullable |
| `department` | `text` |  Nullable |
| `order_index` | `int4` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `effective_from` | `date` |  Nullable |
| `effective_to` | `date` |  Nullable |

## Table `org_chart_versions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `created_by` | `uuid` |  Nullable |
| `published_at` | `timestamptz` |  Nullable |
| `snapshot` | `jsonb` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `locations`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `name` | `text` |  |
| `address` | `text` |  Nullable |
| `geo_lat` | `float8` |  Nullable |
| `geo_lng` | `float8` |  Nullable |
| `radius_meters` | `int4` |  Nullable |
| `allowed_roles` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `attendance_rules`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `workday` | `jsonb` |  Nullable |
| `grace_period_min` | `int4` |  Nullable |
| `geo_required` | `bool` |  Nullable |
| `auto_approve` | `bool` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `attendance_logs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `event` | `attendance_event` |  |
| `captured_at` | `timestamptz` |  Nullable |
| `location_id` | `uuid` |  Nullable |
| `geo_lat` | `float8` |  Nullable |
| `geo_lng` | `float8` |  Nullable |
| `status` | `attendance_status` |  |
| `notes` | `text` |  Nullable |
| `approved_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `attendance_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `check_in_log_id` | `uuid` |  Nullable |
| `check_out_log_id` | `uuid` |  Nullable |
| `duration_min` | `int4` |  Nullable |
| `summary` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notification_channels`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `notification_channel` |  |
| `config` | `jsonb` |  Nullable |
| `status` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `notifications`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  Nullable |
| `channel` | `notification_channel` |  |
| `title` | `text` |  Nullable |
| `body` | `text` |  Nullable |
| `payload` | `jsonb` |  Nullable |
| `status` | `notification_status` |  |
| `read_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `automation_jobs`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `scheduled_at` | `timestamptz` |  |
| `status` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `whatsapp_triggers`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `type` | `text` |  |
| `payload` | `jsonb` |  Nullable |
| `status` | `text` |  |
| `error` | `text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `processed_at` | `timestamptz` |  Nullable |

## Table `analytics_snapshots`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `project_id` | `uuid` |  Nullable |
| `metric_date` | `date` |  |
| `metrics` | `jsonb` |  |
| `source` | `text` |  |
| `created_at` | `timestamptz` |  Nullable |

## Table `knowledge_documents`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `entity_type` | `text` |  |
| `entity_id` | `uuid` |  Nullable |
| `title` | `text` |  Nullable |
| `content` | `text` |  Nullable |
| `metadata` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

## Table `task_files`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `uploader_id` | `uuid` |  Nullable |
| `storage_path` | `text` |  |
| `file_name` | `text` |  |
| `mime_type` | `text` |  Nullable |
| `file_size` | `int8` |  Nullable |
| `sha256` | `text` |  Nullable |
| `status` | `text` |  |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |

## Table `file_acl`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `file_id` | `uuid` |  |
| `principal_type` | `text` |  |
| `principal_id` | `uuid` |  Nullable |
| `can_view` | `bool` |  |
| `can_comment` | `bool` |  |
| `can_share` | `bool` |  |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |

## Table `outbox_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `aggregate` | `text` |  |
| `event_type` | `text` |  |
| `payload` | `jsonb` |  |
| `partition_key` | `text` |  Nullable |
| `published` | `bool` |  |
| `publish_attempts` | `int4` |  |
| `last_error` | `text` |  Nullable |
| `published_at` | `timestamptz` |  Nullable |
| `created_at` | `timestamptz` |  |

## Table `idempotency_keys`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `org_id` | `uuid` | Primary |
| `key` | `text` | Primary |
| `method` | `text` |  |
| `route` | `text` |  |
| `request_hash` | `text` |  Nullable |
| `status_code` | `int4` |  Nullable |
| `response` | `jsonb` |  Nullable |
| `created_by` | `uuid` |  Nullable |
| `created_at` | `timestamptz` |  |
| `expires_at` | `timestamptz` |  |

## Table `audit_log`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_default`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_2026_03`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `audit_log_2026_04`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `int8` | Primary |
| `org_id` | `uuid` |  |
| `actor_id` | `uuid` |  Nullable |
| `action` | `text` |  |
| `resource` | `text` |  |
| `resource_id` | `uuid` |  Nullable |
| `old_data` | `jsonb` |  Nullable |
| `new_data` | `jsonb` |  Nullable |
| `metadata` | `jsonb` |  |
| `ip_address` | `inet` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `created_at` | `timestamptz` | Primary |

## Table `face_profiles`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `template_hash` | `text` |  |
| `template_version` | `text` |  |
| `status` | `text` |  |
| `metadata` | `jsonb` |  |
| `enrolled_by` | `uuid` |  Nullable |
| `enrolled_at` | `timestamptz` |  |
| `updated_at` | `timestamptz` |  |
| `deleted_at` | `timestamptz` |  Nullable |
| `template_vectors` | `jsonb` |  Nullable |
| `template_angles` | `_text` |  Nullable |
| `template_quality` | `numeric` |  Nullable |
| `attention_threshold` | `numeric` |  Nullable |
| `enrollment_resolution` | `int4` |  Nullable |
| `vector_count` | `int4` |  Nullable |

## Table `face_enrollment_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `requested_by` | `uuid` |  Nullable |
| `challenge_nonce` | `text` |  |
| `status` | `text` |  |
| `quality_score` | `numeric` |  Nullable |
| `metadata` | `jsonb` |  |
| `created_at` | `timestamptz` |  |
| `completed_at` | `timestamptz` |  Nullable |
| `expires_at` | `timestamptz` |  |

## Table `face_verification_events`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `attendance_log_id` | `uuid` |  Nullable |
| `challenge_nonce` | `text` |  Nullable |
| `action` | `text` |  |
| `liveness_score` | `numeric` |  Nullable |
| `match_score` | `numeric` |  Nullable |
| `confidence` | `numeric` |  Nullable |
| `decision` | `text` |  |
| `reason` | `text` |  Nullable |
| `metadata` | `jsonb` |  |
| `device_info` | `jsonb` |  |
| `created_at` | `timestamptz` |  |

## Table `face_verification_performance`

Tracks verification performance metrics over time for optimization and fraud detection

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `verification_date` | `date` |  |
| `attempts_count` | `int4` |  Nullable |
| `success_count` | `int4` |  Nullable |
| `avg_duration_ms` | `numeric` |  Nullable |
| `avg_confidence` | `numeric` |  Nullable |
| `failed_reasons` | `_text` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |
| `updated_at` | `timestamptz` |  Nullable |

## Table `user_sessions`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `user_id` | `uuid` |  |
| `session_id` | `text` |  Unique |
| `device_name` | `text` |  Nullable |
| `device_type` | `text` |  Nullable |
| `user_agent` | `text` |  Nullable |
| `ip_address` | `text` |  Nullable |
| `last_active_at` | `timestamptz` |  |
| `created_at` | `timestamptz` |  |
| `expires_at` | `timestamptz` |  Nullable |
| `is_active` | `bool` |  |

## Table `task_location_checkins`

### Columns

| Name | Type | Constraints |
|------|------|-------------|
| `id` | `uuid` | Primary |
| `task_id` | `uuid` |  |
| `org_id` | `uuid` |  |
| `member_id` | `uuid` |  |
| `latitude` | `numeric` |  |
| `longitude` | `numeric` |  |
| `accuracy_meters` | `numeric` |  Nullable |
| `place_name` | `text` |  Nullable |
| `notes` | `text` |  Nullable |
| `device_info` | `jsonb` |  Nullable |
| `created_at` | `timestamptz` |  Nullable |

