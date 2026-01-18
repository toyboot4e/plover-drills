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
          pkgs.mkShell {
            buildInputs = with pkgs; [
              pkg-config
            ] ++ pkgs.lib.optional pkgs.stdenv.isLinux [
              linuxHeaders
	    ];

            packages = with pkgs; [
              python3
              python3Packages.uv
              python3Packages.hid
            ];
	  } // pkgs.lib.mkIf pkgs.stdenv.isLinux {
            C_INCLUDE_PATH = "${pkgs.linuxHeaders}/include";
	  };
      }
    );
}
