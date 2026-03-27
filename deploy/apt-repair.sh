#!/usr/bin/env bash
# Run as root when apt is broken (unmet deps for curl, nginx, powershell, libicu).
# Usage: bash deploy/apt-repair.sh
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive

apt-get update -y
apt-get -y -o Dpkg::Options::="--force-confdef" -o Dpkg::Options::="--force-confold" --fix-broken install

# Microsoft PowerShell often breaks apt on Ubuntu (libicu* not installable).
apt-get remove -y powershell 2>/dev/null || true

apt-get -y --fix-broken install
apt-get upgrade -y
apt-get install -y git nginx curl ca-certificates
echo "apt-repair done. Run deploy/server-setup.sh or apt-get install as needed."
