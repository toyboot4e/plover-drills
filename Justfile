# Just a task runner
# <https://github.com/casey/just>

# shows this help message
help:
    @just -l

# runs `plover-drills`
[positional-arguments]
run *args:
    uv run src/main.py "$@"

[private]
alias r := run

# runs check with ruff
check:
    uvx ruff format src/*.py
    uvx ruff check --fix src/*.py
    uvx pyright

[private]
alias c := check
alias chk := check

# runs format with ruff
format:
    uvx ruff format src/*.py
    uvx ruff check --fix src/*.py

[private]
alias f := format
alias fmt := format

