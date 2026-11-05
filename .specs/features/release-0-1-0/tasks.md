# Release 0.1.0 Tasks

## Execution Protocol (MANDATORY -- do not skip)

Implement these tasks with the `tlc-spec-driven` skill: **activate it by name and follow its Execute flow and Critical Rules.** Do not search for skill files by filesystem path. The skill is the source of truth for the full flow (per-task cycle, sub-agent delegation, the walk, check_proofs, the Verifier and the screens sub-agent).

**If the skill cannot be activated, STOP and tell the user - do not proceed without it.**

---

**Design**: inline (sem design.md: um workflow e três scripts, sem padrão novo)
**Status**: Done
**Approved**: 2026-11-05 - user: "continue and implement the spec"
**Build**: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run build; docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run format; docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run lint:package; docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -color`
**Run release**: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npx playwright test tests/unit/release --project unit --reporter=list`

### Design inline

- `release.yml`, quatro jobs em cadeia (`needs`), com `permissions: contents: read` no topo:
  1. `preflight` (ubuntu-latest): numa tag, roda `scripts/release/preflight.mjs` (versão da tag = `package.json`; commit da tag é ancestral de `origin/main`). No disparo manual, não checa nada.
  2. `verify` (container Playwright 1.64.1): `npm ci`, `format`, `npm test` (build + unitários), `lint:package`, `test:consumer`. Envia `.pack/*.tgz` (o tarball que os consumidores instalaram) como artifact.
  3. `release` (só em tag, único job com `contents: write`): baixa o artifact, gera o texto com `scripts/release/notes.mjs`, roda `gh release create --draft --notes-file … --generate-notes` com o `.tgz` e então `gh release edit --draft=false`. Sem `--clobber`: release ou arquivo já existente faz o passo falhar.
  4. `smoke` (só em tag): `scripts/release/verify-install.mjs <URL> <tgz>` instala a URL pública num projeto vazio e compara o `integrity` do lockfile com o sha512 do tarball testado.
- Os scripts são Node ESM sem dependências, para rodar tanto no runner quanto no container.
- Novo devDependency `yaml` 2.9.1 (exato), só para os testes lerem os workflows.

---

## Test Coverage Matrix

> Generated from codebase, project guidelines, and spec - confirm before Execute. Guidelines found: none (sem AGENTS.md ou CONTRIBUTING.md); estilo tirado de `tests/unit/*.spec.ts` e `playwright.config.ts`.

| Code Layer                                             | Required Test Type                         | Coverage Expectation                                       | Location Pattern                       | Run Command                                             |
| ------------------------------------------------------ | ------------------------------------------ | ---------------------------------------------------------- | -------------------------------------- | ------------------------------------------------------- |
| Scripts de release (`scripts/release/*.mjs`)           | unit (processo filho)                      | Todos os ramos; 1:1 com os ACs; cada edge case listado     | `tests/unit/release/*.spec.ts`         | `npx playwright test tests/unit/release --project unit` |
| Workflows (`.github/workflows/*.yml`)                  | unit (lê o YAML) + actionlint              | Cada AC estrutural (gatilho, permissões, ordem, condições) | `tests/unit/release/workflows.spec.ts` | idem + `rhysd/actionlint:1.7.12`                        |
| Documentos (README, PLANO.md, LICENSE, `package.json`) | unit (lê o arquivo / `npm pack --dry-run`) | Cada AC de texto ou de conteúdo do pacote                  | `tests/unit/release/docs.spec.ts`      | idem                                                    |

## Gate Check Commands

> Generated from codebase - confirm before Execute.

| Gate Level | When to Use             | Command                                                                                                  |
| ---------- | ----------------------- | -------------------------------------------------------------------------------------------------------- |
| Quick      | Depois de cada tarefa   | `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test` (build + todos os unitários) |
| Full       | Depois da última tarefa | Quick + `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm run test:consumer`         |
| Build      | Depois de cada fase     | a linha `**Build**` acima                                                                                |

---

## Execution Plan

### Phase 1: Scripts de release

```
T1 → T2 → T3
```

### Phase 2: Workflows

```
T4 → T5
```

### Phase 3: Documentos

```
T6 → T7 → T8
```

---

## Task Breakdown

### T1: Checagem da tag

**What**: `scripts/release/preflight.mjs <tag> <main-ref>` sai com 0 quando `<tag>` é `v` + `version` do `package.json` e o `HEAD` é ancestral de `<main-ref>`; senão sai com 1 e uma mensagem que mostra as duas versões, ou que o commit não está na `main`.
**Where**: `scripts/release/preflight.mjs`
**Depends on**: None
**Reuses**: estilo de `scripts/fixtures.mjs` (`execSync`, mensagens em inglês)
**Requirement**: REL-04, REL-10

**Done when**:

- [x] `tests/unit/release/preflight.spec.ts` cobre: tag certa na `main` passa; `v9.9.9` falha citando `9.9.9` e `0.1.0`; `vteste` falha; commit fora da `main` falha com a mensagem própria (repositórios git temporários)
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 4 novos testes passam, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(release): check the tag against package.json and main`

---

### T2: Texto da release

**What**: `scripts/release/notes.mjs <version>` imprime um bloco `bash` com `npm install https://github.com/GabriOliv/dossier/releases/download/v<version>/gabrioliv-dossier-<version>.tgz`.
**Where**: `scripts/release/notes.mjs`
**Depends on**: T1
**Reuses**: nada
**Requirement**: REL-11

**Done when**:

- [x] `tests/unit/release/notes.spec.ts` confere que a saída começa com o bloco e a URL exata de `0.1.0` e de outra versão
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 1 novo teste passa, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(release): write the release text with the install command`

---

### T3: Teste de instalação pela URL

**What**: `scripts/release/verify-install.mjs <url> <tgz>` instala `<url>` num diretório temporário vazio e sai com 1 se o `integrity` do `package-lock.json` diferir do sha512 de `<tgz>`, ou se a instalação falhar.
**Where**: `scripts/release/verify-install.mjs`
**Depends on**: T2
**Reuses**: `npm pack` do build, como em `scripts/fixtures.mjs`
**Requirement**: REL-12

**Done when**:

- [x] `tests/unit/release/verify-install.spec.ts`, com um servidor HTTP local servindo o tarball: mesmo arquivo passa; tarball diferente falha; URL com 404 falha
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 3 novos testes passam, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `feat(release): verify that the public URL installs the tested tarball`

---

### T4: Workflow de release

**What**: `.github/workflows/release.yml` com os jobs `preflight`, `verify`, `release` e `smoke`, como no design inline; `yaml` 2.9.1 entra como devDependency exato.
**Where**: `.github/workflows/release.yml`
**Depends on**: None (a Fase 1 inteira vem antes)
**Reuses**: container, `npm ci` e passos de `.github/workflows/gallery.yml`
**Requirement**: REL-01, REL-02, REL-03, REL-05, REL-06, REL-07, REL-08, REL-09

**Done when**:

- [x] `tests/unit/release/workflows.spec.ts` confere: gatilhos `push: tags: [v*]` e `workflow_dispatch`; a ordem dos passos do `verify`; o artifact vem de `.pack/` e nenhum job depois do `verify` roda `npm pack`; a cadeia `needs`; `release` e `smoke` só em tag; só `release` tem `contents: write`; nenhum `npm publish`, `npm login` ou `NPM_TOKEN`; `gh release create` com `--draft`, sem `--clobber`, seguido de `gh release edit --draft=false`; `preflight.mjs`, `notes.mjs` e `verify-install.mjs` chamados
- [x] actionlint 1.7.12 sem erros
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 11 novos testes passam (8 previstos + 3 que conferem a chamada de `preflight.mjs`, `notes.mjs` e `verify-install.mjs`), nenhum removido

**Tests**: unit
**Gate**: build

**Commit**: `ci: add the tag-driven release workflow`

---

### T5: Testes de consumidor no PR

**What**: `pr.yml` ganha o passo `npm run test:consumer` depois dos testes da galeria.
**Where**: `.github/workflows/pr.yml`
**Depends on**: T4
**Reuses**: `tests/unit/release/workflows.spec.ts`
**Requirement**: CI-01

**Done when**:

- [x] Teste em `workflows.spec.ts` confere o passo no job do PR
- [x] actionlint sem erros
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 1 novo teste passa, nenhum removido

**Tests**: unit
**Gate**: build

**Commit**: `ci: run the consumer tests on pull requests`

---

### T6: Licença MIT

**What**: `LICENSE` com o texto MIT e `Copyright (c) 2026 GabriOliv`; `"license": "MIT"` no `package.json`.
**Where**: `LICENSE`
**Depends on**: None (a Fase 2 inteira vem antes)
**Reuses**: nada
**Requirement**: LIC-01, LIC-02, LIC-03

**Done when**:

- [x] `tests/unit/release/docs.spec.ts` confere: `LICENSE` começa com `MIT License` e traz o titular; `package.json` tem `license: "MIT"`; `npm pack --dry-run --json` lista `LICENSE` e os 3 `dist/fonts/LICENSE-*.txt`
- [x] publint sem avisos
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 3 novos testes passam, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `chore: license the package under MIT`

---

### T7: README da release

**What**: O README ganha a seção "Release" (subir `version`, commit na `main`, `git tag v<versão>`, `git push origin v<versão>`) e a seção "Licenças" passa a citar MIT e OFL 1.1.
**Where**: `README.md`
**Depends on**: T6
**Reuses**: README atual
**Requirement**: DOC-01, DOC-02, LIC-04

**Done when**:

- [x] Testes em `docs.spec.ts`: a URL do README é montada da `version` do `package.json` (o teste monta a URL por conta própria, sem importar o script); a seção "Release" traz os quatro passos; a seção "Licenças" cita MIT e OFL 1.1
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 3 novos testes passam, nenhum removido

**Tests**: unit
**Gate**: quick

**Commit**: `docs: document cutting a release and the MIT license`

---

### T8: Nota no PLANO.md

**What**: Uma nota no início da F3 e da seção 6 do PLANO.md apontando a AD-001: sem npm e sem Dependabot.
**Where**: `PLANO.md`
**Depends on**: T7
**Reuses**: nada
**Requirement**: DOC-03

**Done when**:

- [x] Teste em `docs.spec.ts` confere a nota com `AD-001` logo abaixo dos dois títulos
- [x] Gate check passes: `docker compose run --rm -e NPM_CONFIG_UPDATE_NOTIFIER=false node npm test`
- [x] Test count: 1 novo teste passa, nenhum removido

**Tests**: unit
**Gate**: build

**Commit**: `docs(plan): point F3 and versioning at AD-001`

---

## Checks

**C1** - Na tag `v*`, o `verify` roda Prettier, build e unitários, publint e consumidores, nessa ordem (REL-01, AC 1)
Proof: run release | ✓ REL-01 a version tag runs format, unit tests, publint and consumer tests in order

**C2** - O job `release` cria a release com o nome da tag e anexa o `.tgz` (REL-02, AC 2)
Proof: run release | ✓ REL-02 the release job creates the tag's release with the tarball

**C3** - O arquivo anexado é o de `.pack/`, que os consumidores instalaram, e nenhum job depois do `verify` roda `npm pack` (REL-03, AC 3)
Proof: run release | ✓ REL-03 the attached tarball is the one the consumer tests installed

**C4** - `v9.9.9` com `package.json` em `0.1.0` falha antes do build e a mensagem traz as duas versões (REL-04, AC 4)
Proof: run release | ✓ REL-04 a tag that differs from package.json fails with both versions

**C5** - `release` só roda depois de `preflight` e `verify` passarem (REL-05, AC 5)
Proof: run release | ✓ REL-05 no release job runs unless preflight and verify passed

**C6** - Só o job `release` tem `contents: write`, e nenhum passo usa npm publish, npm login ou `NPM_TOKEN` (REL-06, AC 6)
Proof: run release | ✓ REL-06 only the release job can write, and nothing talks to npm

**C7** - No disparo manual, o tarball vira artifact e os jobs `release` e `smoke` não rodam (REL-07, AC 7)
Proof: run release | ✓ REL-07 a manual run keeps the tarball as an artifact and creates no release

**C8** - Uma release ou arquivo já existente faz o passo falhar, sem `--clobber` (REL-08, edge)
Proof: run release | ✓ REL-08 an existing release fails instead of being replaced

**C9** - A release é criada como rascunho e só é publicada depois do upload (REL-09, AC 8)
Proof: run release | ✓ REL-09 the release stays a draft until the tarball is uploaded

**C10** - Um commit fora da `main` falha antes do build, com mensagem própria (REL-10, AC 9)
Proof: run release | ✓ REL-10 a tag on a commit outside main fails

**C11** - O texto da release começa com o `npm install` da URL da versão (REL-11, AC 10)
Proof: run release | ✓ REL-11 the release text starts with the install command for the version

**C12** - A instalação pela URL passa com o tarball testado e falha com um tarball diferente ou um 404 (REL-12, AC 11)
Proof: run release | ✓ REL-12 a different tarball behind the URL fails the install check

**C13** - O README traz a URL montada da `version` do `package.json` (DOC-01, AC 1)
Proof: run release | ✓ DOC-01 the README install URL matches package.json's version

**C14** - O README descreve os quatro passos para cortar uma release (DOC-02, AC 2)
Proof: run release | ✓ DOC-02 the README explains how to cut a release

**C15** - O PLANO.md traz a nota da AD-001 na F3 e na seção 6 (DOC-03, AC 3)
Proof: run release | ✓ DOC-03 PLANO.md points F3 and versioning at AD-001

**C21** - Os passos do README enviam a `main` depois do commit e antes da tag (DOC-04, AC 4; achado do Verifier, rodada 1)
Proof: run release | ✓ DOC-04 the README pushes main before the tag

**C16** - `LICENSE` é MIT com o titular `GabriOliv` (LIC-01, AC 1)
Proof: run release | ✓ LIC-01 LICENSE is MIT for GabriOliv

**C17** - O `package.json` declara `license: "MIT"` (LIC-02, AC 2)
Proof: run release | ✓ LIC-02 package.json declares MIT

**C18** - O tarball contém `LICENSE` e as licenças OFL das fontes (LIC-03, AC 3)
Proof: run release | ✓ LIC-03 the tarball carries LICENSE and the font licenses

**C19** - A seção "Licenças" do README cita MIT e OFL 1.1 (LIC-04, AC 4)
Proof: run release | ✓ LIC-04 the README names MIT and OFL 1.1

**C20** - O `pr.yml` roda os testes de consumidor (CI-01, AC 1)
Proof: run release | ✓ CI-01 pull requests run the consumer tests

---

## Handoff

**Settled mid-build:** 2026-11-05 - a `main` foi avançada (fast-forward local) até o `f1-f2`, e a implementação segue na `main`. User: "Avançar a main até o f1-f2 (Recommended)".
**Dispatched:** 2026-11-05 - batch worker (Sonnet, worktree) para a Fase 3 (T6, T7, T8), a partir de `f2fd23f`; a Fase 2 (T5) segue em paralelo no checkout principal. Returned: commits `8c4c47a`, `16f5813` e `73f7e7e`, trazidos para a `main` por cherry-pick; o título do LIC-04 saiu sem espaço e foi corrigido à parte. Verifier (fresh, round 1) at `615f6c4`. Returned: FAIL com 7 achados, fechados em `88cbc87`, `7b772be` e `aeba200`; o mesmo Verifier julgou a nova C21 (DOC-04) em `13505ad`. Round 2: `check_proofs.py`.
**Walked:** none - sem tela; o Independent Test do workflow só roda no GitHub (disparo manual e primeira tag), feito pelo usuário

---

## Phase Execution Map

```
Phase 1 → Phase 2 → Phase 3

Phase 1:  T1 ------→ T2 ------→ T3
Phase 2:  T4 ------→ T5
Phase 3:  T6 ------→ T7 ------→ T8
```

Depois da T8, fora das tarefas: remover o worktree e o branch antigos do subagente da galeria (suposição aceita na spec).
