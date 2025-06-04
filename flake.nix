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
          with pkgs;
          mkShell {
            buildInputs = [
              pkg-config
              linuxHeaders
            ];

            packages = [
              python312
              python312Packages.uv
            ];

            C_INCLUDE_PATH = "${linuxHeaders}/include";
          };
      }
    );
}
