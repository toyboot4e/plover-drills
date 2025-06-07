# Just a task runner
# <https://github.com/casey/just>

# shows this help message
help:
    @just -l

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

