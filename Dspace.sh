#!/usr/bin/env bash
set -e

TARGET_USER="${SUDO_USER:-$(whoami)}"

sudo mkdir -p /var/www/localhost/
sudo chown "$TARGET_USER:$TARGET_USER" /var/www/localhost/

read -r -p "Do you want install programs? [y/N] " answer
case "$answer" in
y|Y|yes|Yes)
    echo "Downloading"
        sudo apt update
        sudo apt install -y docker.io docker-compose-plugin git curl wget build-essential
        sudo systemctl enable --now docker
        sudo usermod -aG docker "$TARGET_USER"
    echo "Done. Re-login required for docker group changes."
    ;;
    *)
    echo "Ending"
    ;;
esac


