{
  # Tested on NixOS only. Would not work on macOS.
  description = "A basic flake with a shell";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { nixpkgs, flake-utils, ... }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs {
          inherit system;
        };
      in
      {
        devShells.default =
          pkgs.mkShell rec {
            nativeBuildInputs = with pkgs; [
              zstd.dev
              glib.dev
              libGL
              fontconfig
              xorg.libX11
              libxkbcommon
              freetype
              dbus.lib
            ];

            buildInputs =
              with pkgs;
              [
                pkg-config
                # qt6.qtbase
                # qt6.wrapQtAppsHook
                # qt6.qtsvg # required for rendering icons
              ]
              ++ pkgs.lib.optional pkgs.stdenv.isLinux [
                linuxHeaders
                # qt6.qtwayland
              ];

            packages = with pkgs; [
              python3
              python3Packages.uv
              python3Packages.hid
            ];

            # FIXME: libgcc is better?
            shellHook = ''
              export LD_LIBRARY_PATH="${pkgs.stdenv.cc.cc.lib.outPath}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.zstd.dev.out}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.glib.dev.out}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.libGL}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.fontconfig.lib}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.xorg.libX11}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.libxkbcommon}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.freetype}/lib:$LD_LIBRARY_PATH"
              export LD_LIBRARY_PATH="${pkgs.dbus.lib}/lib:$LD_LIBRARY_PATH"
            '';
          }
          // pkgs.lib.mkIf pkgs.stdenv.isLinux {
            C_INCLUDE_PATH = "${pkgs.linuxHeaders}/include";
          };
      }
    );
}
