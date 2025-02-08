terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = "asia-northeast1"
}

resource "google_artifact_registry_repository" "server" {
  location = "asia-northeast1"
  repository_id = "server"
  format = "DOCKER"
  project = var.project_id
}

resource "google_cloud_run_v2_service" "this" {
  name     = "transion-app-server"
  location = "asia-northeast1"
  ingress = "INGRESS_TRAFFIC_ALL"

  template {
    containers {
      image = "asia-northeast1-docker.pkg.dev/${var.project_id}/server/server"
    }
  }
}

resource "google_storage_bucket" "tfstate" {
  name     = "${var.project_id}-tfstate"
  location = "asia-northeast1"
}

resource "google_storage_bucket_object" "tfstate" {
  name   = "terraform.tfstate"
  bucket = google_storage_bucket.tfstate.name
  content_type = "text/plain"
  content = "terraform.tfstate"
}

resource "google_storage_bucket_iam_member" "tfstate_admin" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.admin"
  member = "user:hirockysan1983@gmail.com"
}

resource "google_storage_bucket" "audio" {
  name     = "${var.project_id}-audio"
  location = "asia-northeast1"
}

resource "google_storage_bucket_iam_member" "audio_admin" {
  bucket = google_storage_bucket.audio.name
  role   = "roles/storage.admin"
  member = "user:hirockysan1983@gmail.com"
}

variable "project_id" {
  description = "The ID of the project in Google Cloud"
  type        = string
}
