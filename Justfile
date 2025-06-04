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

