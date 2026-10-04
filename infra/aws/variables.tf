variable "project_name" {
  type        = string
  description = "Resource prefix for the Carewell AWS deployment."
  default     = "carewell"
}

variable "environment" {
  type        = string
  description = "Deployment environment name."
  default     = "production"
}

variable "aws_region" {
  type        = string
  description = "AWS region with at least three available Availability Zones."
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  type        = string
  description = "Non-overlapping CIDR for the isolated three-tier VPC."
  default     = "10.20.0.0/16"
}

variable "postgres_engine_version" {
  type        = string
  description = "Supported PostgreSQL major version for the target AWS region."
  default     = "16"
}

variable "postgres_instance_class" {
  type        = string
  description = "Production database instance class; size for reviewed workload requirements."
  default     = "db.r6g.large"
}

variable "postgres_username" {
  type        = string
  description = "RDS master username; store generated database credentials in AWS Secrets Manager."
  default     = "carewell_admin"
  sensitive   = true
}

variable "waf_rate_limit" {
  type        = number
  description = "Maximum requests per IP in the AWS WAF rolling five-minute window."
  default     = 2000
}
