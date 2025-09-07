# Copilot Instructions for This Repository

These rules guide GitHub Copilot (Chat, PRs, and editor) when proposing, changing, or refactoring code in this repository. The primary requirement is: every functional change must include corresponding tests that cover the change.

## Test-First Expectations
- Always add or update tests with any code change.
- Prefer writing/adjusting tests before implementation when feasible.
- If refactoring without behavior change, keep tests passing and add tests for uncovered behavior that could regress.

## Tooling and Conventions
- Runner: `jest` with `jsdom` environment.
- Language: TypeScript (`ts-jest`), React 19, RTL.
- Setup: `src/setupTests.ts` loaded via `jest.config.js`.
- Test locations:
  - Co-locate in `__tests__` directories (e.g., `src/components/__tests__/X.test.tsx`).
  - Or `*.test.ts[x]` next to sources per existing patterns.
- Naming: Use `.test.ts` for non-React, `.test.tsx` for React components.
- Coverage collection: Defined in `jest.config.js`. New code paths should be covered; don’t regress coverage.

## When You Change Code, Also Change Tests
- Components (`src/components`, `src/renderer`):
  - Use React Testing Library + `@testing-library/jest-dom` assertions.
  - Test observable behavior and accessibility output; avoid testing implementation details.
  - Prefer `screen` queries by role/name/label; avoid test IDs unless necessary.
- Contexts (`src/contexts`):
  - Add minimal test wrappers using `<Provider>` and verify provided values and interactions.
- Redux store/slices (`src/store`):
  - Add unit tests for reducers, actions, and selectors under `src/store/__tests__`.
  - Test edge cases and persisted state behavior when applicable.
- Services/Utilities (`src/services`, `src/utils`):
  - Unit test pure logic thoroughly; mock timers and external boundaries.
  - For time or interval logic, use `jest.useFakeTimers()` and advance timers.
- Themes (`src/themes`, `src/theme`):
  - Ensure exported theme objects and defaults remain stable; add tests for shape and key tokens.

## Electron and Environment Boundaries
- Do not require actual Electron at test time. Mock Electron APIs and preload bridges.
- Stub network, filesystem, and update mechanisms in tests (`updateService`, reminders, etc.).

## Patterns to Prefer
- Arrange-Act-Assert with clear, small tests.
- Meaningful test names; one behavior per `it()` when possible.
- Use `user-event` for realistic interaction.
- Keep snapshots targeted and stable; prefer semantic assertions over large snapshots.

## PR and Change Guidelines
- Include tests in the same PR as the implementation.
- If changing public interfaces or behavior, update existing tests and add new ones demonstrating the new contract.
- If adding new modules, add new `*.test.ts[x]` files alongside them or in the appropriate `__tests__` folder.
- Run `npm test` locally and ensure all tests pass.

## Examples
- Component behavior:
  - When adding a new prop, add tests covering default and explicit prop values.
  - When changing visual states on interaction, assert role/state changes via RTL.
- Slice changes:
  - When adding a reducer case, add tests for happy path and edge cases.
- Service changes:
  - When modifying timer logic, add fake-timer tests to prove scheduling and cleanup.

## When to Decline Changes
- If a change cannot be reasonably tested, call it out explicitly and propose a minimal seam (e.g., factoring pure logic to a function) to enable testing.
- Avoid merging behavior changes without tests.

---

Cheat sheet:
- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
