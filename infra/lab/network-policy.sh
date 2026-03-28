#!/bin/bash
# PurpleOps Arena — Lab Network Isolation Script
# Creates an isolated Docker network for the cyber lab.
# NO traffic is allowed to leave the lab subnet.

set -euo pipefail

NETWORK_NAME="purpleops-lab"
SUBNET="10.0.0.0/24"
GATEWAY="10.0.0.1"

echo "[*] Creating isolated lab network: $NETWORK_NAME"

docker network create \
  --driver bridge \
  --subnet "$SUBNET" \
  --gateway "$GATEWAY" \
  --opt "com.docker.network.bridge.enable_icc=true" \
  --opt "com.docker.network.bridge.enable_ip_masquerade=false" \
  --internal \
  "$NETWORK_NAME" 2>/dev/null || echo "[!] Network already exists"

# Apply iptables rules to block all outbound from lab
echo "[*] Applying egress firewall rules..."
BRIDGE_IF=$(docker network inspect "$NETWORK_NAME" --format '{{.Options}}' | grep -oP 'bridge_name:\K[^,}]+' || echo "br-lab")

# Drop all forwarded traffic leaving the lab subnet to external
iptables -I FORWARD -i "$BRIDGE_IF" ! -o "$BRIDGE_IF" -j DROP 2>/dev/null || true
iptables -I FORWARD -o "$BRIDGE_IF" ! -i "$BRIDGE_IF" -j DROP 2>/dev/null || true

echo "[+] Lab network isolation complete."
echo "    Subnet : $SUBNET"
echo "    Gateway: $GATEWAY"
echo "    Egress : BLOCKED"
echo ""
echo "[*] Assign lab containers to network: --network $NETWORK_NAME"
