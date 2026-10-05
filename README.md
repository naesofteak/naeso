# Naeso

**Naeso** is a package manager for macOS developed and maintained by **Naesofteak Private Limited**.

Naeso provides a simple command-line interface for discovering, installing, verifying, managing, and running software packages on macOS.

The project is designed to support both **Intel (x86_64)** and **Apple Silicon (arm64)** Macs.

---

## Features

- Package search
- Package information
- Package compatibility detection
- Automatic architecture detection
- Version-aware package resolution
- Download progress display
- SHA-256 verification where official checksums are available
- Multi-artifact package installation
- Automatic installation directory management
- Automatic PATH configuration
- Package uninstall
- macOS `launchd` service management
- Package status management
- Intel and Apple Silicon support
- Local package cache

---

## Requirements

- macOS
- Node.js 18 or newer
- Intel (x86_64) or Apple Silicon (arm64)
- Internet connection for downloading packages

---

## Installation

Install Naeso globally using npm:

```bash
npm install -g @naesofteak/naeso


