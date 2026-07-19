{
  description = "Plover Drills";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
  };

  outputs =
    { nixpkgs, ... }:
    let
      inherit (nixpkgs) lib;
      forAllSystems = lib.genAttrs lib.systems.flakeExposed;
      pkgsFor = system: import nixpkgs { inherit system; };
    in
    {
      packages = forAllSystems (
        system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.stdenv.mkDerivation (finalAttrs: {
            pname = "plover-drills";
            version = "0.0.0";
            src = ./.;

            pnpmDeps = pkgs.fetchPnpmDeps {
              inherit (finalAttrs) pname version src;
              fetcherVersion = 3;
              hash = "sha256-RSQkfbqI1ahsrj7AkzBtiY7JXwtQQfCCxxBQLyxZ7Yc=";
            };

            nativeBuildInputs = with pkgs; [
              nodejs_24
              pnpm
              pnpmConfigHook
              patchelf
            ];

            # `sass-embedded` ships a prebuilt `dart` binary whose ELF interpreter
            # (and libstdc++) are absent in the sandbox; point it at Nix's.
            preBuild = ''
              for dart in $(find node_modules/.pnpm -path '*/sass-embedded-linux-x64/dart-sass/src/dart'); do
                patchelf \
                  --set-interpreter "$(cat "$NIX_CC/nix-support/dynamic-linker")" \
                  --set-rpath "${lib.makeLibraryPath [ pkgs.stdenv.cc.cc.lib ]}" \
                  "$dart"
              done
            '';

            buildPhase = ''
              runHook preBuild
              pnpm run build
              runHook postBuild
            '';

            installPhase = ''
              runHook preInstall
              cp -r dist $out
              runHook postInstall
            '';
          });
        }
      );

      devShells = forAllSystems (
        system:
        let
          pkgs = pkgsFor system;
        in
        {
          default = pkgs.mkShell {
            packages = with pkgs; [
              nodejs_24
              pnpm
              just
              zizmor
            ];

            shellHook = ''
              export PATH="$PWD/node_modules/.bin:$PATH"
            '';
          };
        }
      );
    };
}
