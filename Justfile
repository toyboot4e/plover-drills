# Just a task runner
# <https://github.com/casey/just>

# shows this help message
help:
    @just -l

# runs `plover-drills`
[positional-arguments]
run *args:
    uv run drill/main.py "$@"

[private]
alias r := run

# runs check with ruff
check:
    uvx ruff format drill/*.py
    uvx ruff check --fix drill/*.py
    uvx pyright

[private]
alias c := check
alias chk := check

# runs format with ruff
format:
    uvx ruff format drill/*.py
    uvx ruff check --fix drill/*.py

[private]
alias f := format
alias fmt := format

