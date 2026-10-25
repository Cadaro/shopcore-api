# Contributing Guidelines

This document describes branch, commit, and pull request conventions for the `shopcore-api` repository.

## One Issue = One Task

Each issue should describe one task that can be completed independently. Work on it in a dedicated branch and keep the pull request within its scope. If an unrelated task comes up, create a separate issue rather than expanding the current one. Link the pull request to its issue and close it with `Closes #<number>`.

## Branch Naming

Use one of the following prefixes, followed by a short, descriptive topic:

- `feature/<topic>` — a new feature
- `bug/<topic>` — a bug fix
- `chore/<topic>` — maintenance and housekeeping
- `refactor/<topic>` — refactoring without behavior changes
- `test/<topic>` — adding or changing tests

Use lowercase and hyphens instead of spaces in the topic. Example: `feature/order-history`.

## Commit Messages

Use the Conventional Commits format with a required scope:

```text
<type>(<scope>): <short description>
```

The type indicates the purpose of the change, such as `feat`, `fix`, `chore`, `refactor`, `test`, or `docs`. The scope identifies the area of the repository, such as `orders`, `api`, or `contributing`. Keep the description concise, start it with a lowercase letter, and use the imperative mood. Examples:

```text
feat(orders): add order history endpoint
fix(api): handle missing customer id
docs(contributing): document branch conventions
```

Mark a breaking change according to Conventional Commits by adding `!` after the scope (for example, `feat(api)!: change response format`) and describe its impact in a `BREAKING CHANGE:` footer.

## Pull Requests and Definition of Done

Use the `.github/pull_request_template.md` template. A pull request is ready for review when:

- it addresses the scope of the related issue, referenced with `Closes #<number>`;
- the change is implemented and tested, and required quality checks pass;
- the documentation is updated if the change affects it;
- any breaking changes are explicitly described, or their absence is confirmed;
- the pull request checklist is complete and the change contains no unrelated work.
