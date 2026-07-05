# Architecture decision records

Short records of the non-obvious decisions in this project — the _why_ that
code alone can't show. Written for humans and AI agents alike (the entry point
for agents is [`AGENTS.md`](../../AGENTS.md)).

| #                                                 | Decision                                                     |
| ------------------------------------------------- | ------------------------------------------------------------ |
| [0001](0001-single-monorepo.md)                   | Single monorepo; packages not published to npm               |
| [0002](0002-wordpress-compatible-data-model.md)   | WordPress-compatible data model (clean room)                 |
| [0003](0003-password-hashing-and-roles.md)        | Peppered password hashing; roles via `capabilities` usermeta |
| [0004](0004-elementor-compatible-element-tree.md) | Elementor-compatible element tree in `_builder_data`         |
| [0005](0005-turbo-strict-env.md)                  | All runtime env vars declared in turbo `globalEnv`           |

## Adding one

Copy an existing file, number it sequentially, keep it under ~40 lines:
**Context** (what forced a choice), **Decision** (what we picked),
**Consequences** (what it costs and constrains). Update the table above.
