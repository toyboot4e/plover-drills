# Just a task runner
# <https://github.com/casey/just>

# shows this help message
help:
    @just -l

# runs `plover-drills`
run:
    uv run src/main.py

[private]
alias r := run

# runs check with ruff
check:
    uvx ruff check src/*.py

[private]
alias c := check
alias chk := check

# runs format with ruff
format:
    uvx ruff format src/*.py

[private]
alias f := format
alias fmt := format

