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
    mv .tmp-lapwing/src/practice lessons
    rm -rf .tmp-lapwing

[private]
alias dl := download

# runs `plover-drills`
[positional-arguments]
run *args:
    uv run main.py "$@"

[private]
alias r := run

# runs check with ruff
check:
    uvx ruff format
    uvx ruff check --fix
    uvx pyright

[private]
alias c := check
alias chk := check

# runs format with ruff
format:
    uvx ruff format
    uvx ruff check --fix

[private]
alias f := format
alias fmt := format

