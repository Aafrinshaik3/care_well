terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.40, < 7.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "carewell_kms" {
  statement {
    sid       = "AccountAdministration"
    actions   = ["kms:*"]
    resources = ["*"]
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
  }

  statement {
    sid       = "CloudTrailEncryption"
    actions   = ["kms:GenerateDataKey*", "kms:DescribeKey"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid       = "CloudWatchLogsEncryption"
    actions   = ["kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"]
    resources = ["*"]
    principals {
      type        = "Service"
      identifiers = ["logs.${var.aws_region}.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "cloudtrail_bucket" {
  statement {
    sid       = "AWSCloudTrailAclCheck"
    actions   = ["s3:GetBucketAcl", "s3:GetBucketLocation"]
    resources = [aws_s3_bucket.cloudtrail.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
  }

  statement {
    sid       = "AWSCloudTrailWrite"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*"]
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }
}

locals {
  azs            = slice(data.aws_availability_zones.available.names, 0, 3)
  public_cidrs   = ["10.20.0.0/20", "10.20.16.0/20", "10.20.32.0/20"]
  app_cidrs      = ["10.20.64.0/20", "10.20.80.0/20", "10.20.96.0/20"]
  database_cidrs = ["10.20.128.0/20", "10.20.144.0/20", "10.20.160.0/20"]
  subnet_map     = { for index, az in local.azs : az => index }
  name           = "${var.project_name}-${var.environment}"
}

resource "aws_kms_key" "carewell" {
  description             = "Carewell ${var.environment} data encryption key"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.carewell_kms.json
  tags                    = { Name = "${local.name}-cmk" }
}

resource "aws_kms_alias" "carewell" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.carewell.key_id
}

resource "aws_vpc" "carewell" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "${local.name}-vpc" }
}

resource "aws_internet_gateway" "carewell" {
  vpc_id = aws_vpc.carewell.id
  tags   = { Name = "${local.name}-igw" }
}

resource "aws_subnet" "public_alb" {
  for_each                = local.subnet_map
  vpc_id                  = aws_vpc.carewell.id
  availability_zone       = each.key
  cidr_block              = local.public_cidrs[each.value]
  map_public_ip_on_launch = false
  tags                    = { Name = "${local.name}-public-alb-${each.key}", Tier = "public-alb" }
}

resource "aws_subnet" "private_app" {
  for_each                = local.subnet_map
  vpc_id                  = aws_vpc.carewell.id
  availability_zone       = each.key
  cidr_block              = local.app_cidrs[each.value]
  map_public_ip_on_launch = false
  tags                    = { Name = "${local.name}-private-app-${each.key}", Tier = "private-app-eks" }
}

resource "aws_subnet" "isolated_database" {
  for_each                = local.subnet_map
  vpc_id                  = aws_vpc.carewell.id
  availability_zone       = each.key
  cidr_block              = local.database_cidrs[each.value]
  map_public_ip_on_launch = false
  tags                    = { Name = "${local.name}-isolated-db-${each.key}", Tier = "isolated-database" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.carewell.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.carewell.id
  }
  tags = { Name = "${local.name}-public-rt" }
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public_alb
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  for_each = local.subnet_map
  domain   = "vpc"
  tags     = { Name = "${local.name}-nat-eip-${each.key}" }
}

resource "aws_nat_gateway" "app" {
  for_each      = local.subnet_map
  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = aws_subnet.public_alb[each.key].id
  depends_on    = [aws_internet_gateway.carewell]
  tags          = { Name = "${local.name}-nat-${each.key}" }
}

resource "aws_route_table" "app" {
  for_each = local.subnet_map
  vpc_id   = aws_vpc.carewell.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.app[each.key].id
  }
  tags = { Name = "${local.name}-private-app-rt-${each.key}" }
}

resource "aws_route_table_association" "app" {
  for_each       = aws_subnet.private_app
  subnet_id      = each.value.id
  route_table_id = aws_route_table.app[each.key].id
}

resource "aws_route_table" "database" {
  for_each = local.subnet_map
  vpc_id   = aws_vpc.carewell.id
  tags     = { Name = "${local.name}-isolated-db-rt-${each.key}" }
}

resource "aws_route_table_association" "database" {
  for_each       = aws_subnet.isolated_database
  subnet_id      = each.value.id
  route_table_id = aws_route_table.database[each.key].id
}

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "HTTPS ingress for the public application load balancer"
  vpc_id      = aws_vpc.carewell.id
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name}-alb-sg" }
}

resource "aws_security_group" "app" {
  name        = "${local.name}-app"
  description = "Private app/EKS tasks accept traffic only from the ALB tier"
  vpc_id      = aws_vpc.carewell.id
  ingress {
    description     = "App from ALB"
    from_port       = 3000
    to_port         = 3000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name}-app-sg" }
}

resource "aws_security_group" "database" {
  name        = "${local.name}-database"
  description = "PostgreSQL ingress only from the private application security group"
  vpc_id      = aws_vpc.carewell.id
  ingress {
    description     = "PostgreSQL from application tier"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = { Name = "${local.name}-database-sg" }
}

resource "aws_db_subnet_group" "carewell" {
  name       = "${local.name}-db-subnets"
  subnet_ids = [for subnet in aws_subnet.isolated_database : subnet.id]
  tags       = { Name = "${local.name}-db-subnets" }
}

resource "aws_db_instance" "postgres" {
  identifier                        = "${local.name}-postgres"
  engine                            = "postgres"
  engine_version                    = var.postgres_engine_version
  instance_class                    = var.postgres_instance_class
  allocated_storage                 = 100
  max_allocated_storage             = 500
  storage_encrypted                 = true
  kms_key_id                        = aws_kms_key.carewell.arn
  db_name                           = "carewell"
  username                          = var.postgres_username
  manage_master_user_password       = true
  multi_az                          = true
  publicly_accessible               = false
  db_subnet_group_name              = aws_db_subnet_group.carewell.name
  vpc_security_group_ids            = [aws_security_group.database.id]
  backup_retention_period           = 35
  deletion_protection               = true
  auto_minor_version_upgrade        = true
  copy_tags_to_snapshot             = true
  enabled_cloudwatch_logs_exports   = ["postgresql", "upgrade"]
  tags                              = { Name = "${local.name}-postgres", DataClass = "sensitive" }
}

resource "aws_s3_bucket" "carewell" {
  bucket_prefix = "${local.name}-records-"
  force_destroy = false
  tags          = { Name = "${local.name}-records", DataClass = "sensitive" }
}

resource "aws_s3_bucket_public_access_block" "carewell" {
  bucket                  = aws_s3_bucket.carewell.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "carewell" {
  bucket = aws_s3_bucket.carewell.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "carewell" {
  bucket = aws_s3_bucket.carewell.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.carewell.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_ebs_encryption_by_default" "carewell" {
  enabled = true
}

resource "aws_ebs_default_kms_key" "carewell" {
  key_arn = aws_kms_key.carewell.arn
}

resource "aws_cloudwatch_log_group" "audit" {
  name              = "/aws/${local.name}/audit"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.carewell.arn
  tags              = { DataClass = "audit" }
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket_prefix = "${local.name}-trail-"
  force_destroy = false
  tags          = { Name = "${local.name}-cloudtrail", DataClass = "audit" }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.carewell.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket.json
}

resource "aws_cloudtrail" "carewell" {
  name                          = "${local.name}-trail"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  kms_key_id                    = aws_kms_key.carewell.arn
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  depends_on                    = [aws_s3_bucket_policy.cloudtrail]
  tags                          = { Name = "${local.name}-trail" }
}

resource "aws_wafv2_web_acl" "carewell" {
  name        = "${local.name}-waf"
  description = "Baseline rate limiting for Carewell public HTTP entry points"
  scope       = "REGIONAL"
  default_action {
    allow {}
  }
  rule {
    name     = "ip-rate-limit"
    priority = 1
    action {
      block {}
    }
    statement {
      rate_based_statement {
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-waf"
    sampled_requests_enabled   = true
  }
  tags = { Name = "${local.name}-waf" }
}

output "vpc_id" {
  value = aws_vpc.carewell.id
}
output "public_alb_subnet_ids" {
  value = [for subnet in aws_subnet.public_alb : subnet.id]
}
output "private_app_subnet_ids" {
  value = [for subnet in aws_subnet.private_app : subnet.id]
}
output "isolated_database_subnet_ids" {
  value = [for subnet in aws_subnet.isolated_database : subnet.id]
}
output "database_endpoint" {
  value = aws_db_instance.postgres.address
}
output "data_bucket_name" {
  value = aws_s3_bucket.carewell.bucket
}
output "kms_key_arn" {
  value = aws_kms_key.carewell.arn
}
output "waf_web_acl_arn" {
  value = aws_wafv2_web_acl.carewell.arn
}
