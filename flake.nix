{
  description = "Minimal Tauri development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.11";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Rust dependencies
            rustc
            cargo
            rustfmt
            clippy
            rust-analyzer

            # Tauri dependencies
            pkg-config
            glib
            glib-networking
            gobject-introspection
            gtk3
            webkitgtk_4_1
            libsoup_3
            openssl
            atk
            pango
            gdk-pixbuf
            cairo

            # Graphics dependencies
            libGL
            mesa
            xorg.libX11
            xorg.libXcursor
            xorg.libXrandr
            xorg.libXi

            # Build tools
            gcc 

            # Node.js dependencies
            nodejs
            nodePackages.npm
            nodePackages.pnpm
            nodePackages.yarn
          ];

          shellHook = ''
            export RUST_BACKTRACE=1
            export WEBKIT_DISABLE_COMPOSITING_MODE=1
            export WEBKIT_USE_SINGLE_PROCESS=1
            export DISPLAY=:0
            export SHELL=/usr/bin/bash
          '';
        };
      }
    );
}
