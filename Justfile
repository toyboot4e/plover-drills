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
    mv .tmp-lapwing/src/practice drills/Lapwing
    rm -rf .tmp-lapwing

[private]
alias dl := download

# generates `drills-gen.json`
generate-drills-json:
    cd gen && uv run gen.py > ../public/drills-gen/Lapwing.json

# runs the app on dev srever at localhost:5173
dev:
    npm run dev "$@"

# runs biome check --fix
check:
    npm run check:fix

[private]
alias c := check
