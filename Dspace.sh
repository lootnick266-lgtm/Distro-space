#!/usr/bin/env bash
set -e

TARGET_USER="${SUDO_USER:-$(whoami)}"
sudo chown "$TARGET_USER:$TARGET_USER" /var/www/Distro-space

read -r -p "Do you want install programs? [y/N] " answer
case "$answer" in
y|Y|yes|Yes)
    echo "Downloading"
        sudo apt update
        sudo usermod -aG docker "$TARGET_USER"
        sudo apt install -y docker.io 
        sudo apt install -y git curl wget build-essential
        if ! sudo apt install -y docker-compose-plugin; then
            echo "docker-compose-plugin not installed, install it manually"
        fi

    sudo systemctl enable --now docker
    echo "Done. Re-login required for docker group changes."
    ;;  
    *)
    echo "Ending"
    ;;
esac


