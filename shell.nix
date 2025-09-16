let
  pkgs = import <nixpkgs> { };
  libraries = with pkgs; [
          webkitgtk
          gtk3
          cairo
          gdk-pixbuf
          glib
          dbus
          openssl
          librsvg
        ];
in
pkgs.mkShell {
  nativeBuildInputs = with pkgs; [
    pkg-config
    gobject-introspection
    glib.dev
    glib.bin
    cargo
    cargo-tauri
    nodejs
  ];

  buildInputs = with pkgs;[
    at-spi2-atk
    atkmm
    cairo
    gdk-pixbuf
    glib
    gtk3
    harfbuzz
    librsvg
    libsoup_3
    pango
    webkitgtk_4_1
    openssl
  ];
  shellHook = with pkgs; ''
            export LD_LIBRARY_PATH="${
              lib.makeLibraryPath libraries
            }:$LD_LIBRARY_PATH"
    '';
}
