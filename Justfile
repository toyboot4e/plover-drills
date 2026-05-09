# Just a task runner
# <https://github.com/casey/just>

# shows this help message
help:
    @just -l

# downloads lesson files
download:
    git clone --no-checkout --depth=1 --filter=blob:none https://github.com/aerickt/lapwing-for-beginners.git .tmp-lapwing
    # TODO: Write it in multiple lines
    cd .tmp-lapwing && git sparse-checkout init --cone && git sparse-checkout set src/practice && git checkout main
    mv .tmp-lapwing/src/practice/* drills/Lapwing
    rm -rf .tmp-lapwing

[private]
alias dl := download

# generates `src/generated`
generate-drills-json:
    # be sure that direnv is loaded in gen/
    cd gen && uv run gen.py > ../src/generated/Lapwing.json

[private]
alias gen := generate-drills-json

# runs the app on dev srever at localhost:5173
dev:
    npm run dev "$@"

[private]
alias d := dev

# runs biome check --fix
# runs npm run build
build:
    npm run build

[private]
alias b := build

# runs biome check --fix
check:
    npm run check:fix

[private]
alias c := check

# updates dependencies aggressively
update:
    npx npm-check-updates -u && npm install
