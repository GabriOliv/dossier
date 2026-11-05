# Release 0.1.0 Specification

**Approved**: 2026-11-05 - user: "Pode implementar, sem push"

## Problem Statement

A biblioteca está pronta e testada, mas não há como instalá-la. O README manda instalar de `https://github.com/GabriOliv/dossier/releases/download/v0.1.0/gabrioliv-dossier-0.1.0.tgz`, e nada gera essa URL. O repositório também não tem licença, então ninguém pode reutilizar o código legalmente. Pela AD-001, a release é um tarball anexado a uma GitHub Release, sem npm.

## Goals

- [ ] Ao enviar a tag `v0.1.0`, o usuário recebe uma GitHub Release com o tarball que os testes de consumidor instalaram, sem nenhum passo manual além do push.
- [ ] A URL do README instala o pacote.
- [ ] O pacote e o repo saem com licença.

## Out of Scope

| Feature                                                | Reason                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| `npm publish`, trusted publishing, provenance          | AD-001: distribuição só pelo GitHub                                             |
| Dependabot e atualização automática nos consumidores   | Não atualiza dependência por URL (AD-001); fica para a F4                       |
| Push, criação do repo, ativação do Pages, envio da tag | Ação do usuário ("não precisa fazer push, eu faço")                             |
| `CHANGELOG.md`                                         | A página da release leva o comando de instalação e as notas geradas pelo GitHub |
| Novos componentes, testes visuais, axe                 | F6                                                                              |
| Mudança de visual ou de API dos 13 componentes         | A 0.1.0 sai com o que a F1 e a F2 entregaram                                    |

---

## Assumptions & Open Questions

| Assumption / decision                                                | Chosen default                                                                        | Rationale                                                                                          | Confirmed?                                                                                   |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Conteúdo da 0.1.0                                                    | Os 13 componentes atuais                                                              | Pedido: "o que falta para eu rodar a primeira release"                                             | y - user: "vamos fazer a spec para implementar o que falta para eu rodar a primeira release" |
| Licença                                                              | MIT                                                                                   | A mesma do Garden e a sugerida no PLANO.md F0; compatível com as fontes OFL                        | y - user: "MIT (Recommended)" (2026-11-05)                                                   |
| Titular do copyright no `LICENSE`                                    | `GabriOliv`                                                                           | É o autor dos commits; o nome civil não aparece no repo                                            | y - user: "GabriOliv (Recommended)" (2026-11-05)                                             |
| Prop `decorative` e classe `ds-stage` no `StageIcon`                 | Manter                                                                                | O swizzle de `Tag` no Garden precisa de ícone sem nome acessível ao lado do texto                  | y - user: "Manter (Recommended)" (2026-11-05)                                                |
| Seletores com especificidade maior (`.ds-tag.ds-tag-solid` e outros) | Manter; ajustar o portfólio na F4                                                     | Sem isso, o minificador do Docusaurus inverte overrides (CONS-08)                                  | y - user: "Manter e ajustar na F4 (Recommended)" (2026-11-05)                                |
| Título no celular `clamp(48px, 16vw, 96px)`                          | Manter como no portfólio                                                              | Fidelidade ao `page.css` de origem; revisar na F4 contra as capturas                               | y - user: "Manter e revisar na F4 (Recommended)" (2026-11-05)                                |
| Testes que bloqueiam a release                                       | Prettier, build, unitários (paridade, SSR 18/19, CSS, tokens), publint e consumidores | São os que validam o tarball. A galeria já é testada a cada push na `main`                         | y - padrão do agente, ajustável                                                              |
| Execução manual sem release                                          | `workflow_dispatch` roda tudo e guarda o tarball como artifact do workflow            | Permite testar o workflow no GitHub antes da primeira tag                                          | y - padrão do agente, ajustável                                                              |
| PLANO.md                                                             | Nota curta na F3 e na seção 6 apontando a AD-001, sem reescrever o plano              | O plano é do usuário; a nota evita que alguém siga a F3 antiga                                     | y - padrão do agente, ajustável                                                              |
| Worktree e branch antigos do subagente da galeria                    | Remover (`git worktree remove` e `git branch -d`)                                     | Já mesclados em `abd2fb0`; `-d` recusa se não estiverem                                            | y - padrão do agente, ajustável                                                              |
| Teste de instalação depois da release                                | Job que instala pela URL pública num projeto vazio e compara o hash                   | Pega repo privado, nome de arquivo errado e redirect, que os testes locais não veem                | y - user: "Sim, adicionar (Recommended)" (2026-11-05)                                        |
| Texto da página da release                                           | Comando de instalação da versão no topo, notas geradas pelo GitHub abaixo             | Na primeira release as notas geradas ficam quase vazias                                            | y - user: "Comando de instalação + notas geradas (Recommended)" (2026-11-05)                 |
| Tag fora da `main`                                                   | Recusar                                                                               | A release não pode divergir da galeria, que sai da `main`                                          | y - user: "Exigir commit na main (Recommended)" (2026-11-05)                                 |
| Visibilidade do repo                                                 | Público                                                                               | PLANO.md F0 ("Criar o repo público"); a URL de download exige repo público para instalar sem token | y - PLANO.md F0                                                                              |

**Open questions:** none - all resolved or logged above.

---

## User Stories

### P1: Release pela tag ⭐ MVP

**User Story**: Como mantenedor, quero enviar a tag `vX.Y.Z` e receber a release com o tarball, para instalar o pacote nos meus sites pela URL do README.

**Why P1**: Sem isso, a URL do README não existe e nada pode ser instalado.

**Acceptance Criteria**:

1. WHEN uma tag `v*` é enviada THEN o workflow `release.yml` SHALL rodar Prettier, build, testes unitários, publint e testes de consumidor, nessa ordem. <!-- event-driven -->
2. WHEN todos os passos passam THEN o workflow SHALL criar a GitHub Release com o nome da tag e anexar `gabrioliv-dossier-<versão>.tgz`. <!-- event-driven -->
3. The workflow SHALL anexar o mesmo arquivo `.tgz` que os testes de consumidor instalaram, sem rodar `npm pack` de novo. <!-- ubiquitous -->
4. IF a tag sem o `v` difere de `version` no `package.json` THEN o workflow SHALL falhar antes do build, com uma mensagem que mostra as duas versões. <!-- unwanted-behavior -->
5. IF qualquer passo falha THEN o workflow SHALL terminar sem criar release. <!-- unwanted-behavior -->
6. The workflow SHALL usar apenas o `GITHUB_TOKEN`, dar `contents: write` só ao job que cria a release (os demais com `contents: read`) e não rodar `npm publish` nem `npm login`. <!-- ubiquitous -->
7. WHEN o workflow é disparado manualmente THEN ele SHALL rodar os mesmos passos e guardar o `.tgz` como artifact do workflow, sem criar release e sem nenhum job com `contents: write`. <!-- event-driven -->
8. IF o upload do `.tgz` falha THEN o workflow SHALL deixar a release como rascunho, nunca publicada sem o arquivo. <!-- unwanted-behavior -->
9. IF o commit da tag não está na `main` THEN o workflow SHALL falhar antes do build, com uma mensagem que diz isso. <!-- unwanted-behavior -->
10. WHEN a release é criada THEN o texto dela SHALL começar com `npm install` seguido da URL daquela versão, e trazer abaixo as notas geradas pelo GitHub. <!-- event-driven -->
11. WHEN a release é publicada THEN o workflow SHALL instalar o pacote pela URL pública num projeto vazio e falhar se o sha512 do arquivo baixado diferir do tarball testado. <!-- event-driven -->

**Independent Test**: Rodar os scripts de checagem localmente: tag `v0.1.0` passa, `v9.9.9` falha; commit fora da `main` falha. Depois, no GitHub, disparar o workflow manualmente e baixar o artifact.

---

### P1: URL de instalação certa ⭐ MVP

**User Story**: Como consumidor, quero que a URL do README aponte para o arquivo que a release anexa, para que a instalação funcione na primeira tentativa.

**Why P1**: Uma URL errada quebra a instalação nos dois sites.

**Acceptance Criteria**:

1. The README SHALL conter a URL `https://github.com/GabriOliv/dossier/releases/download/v<versão>/gabrioliv-dossier-<versão>.tgz` com a `version` do `package.json`. <!-- ubiquitous -->
2. The README SHALL descrever como cortar uma release: subir `version`, fazer commit na `main`, criar a tag `v<versão>` e enviá-la. <!-- ubiquitous -->
3. The PLANO.md SHALL ter, na F3 e na seção 6, uma nota que aponta a AD-001 e diz que a publicação no npm e o Dependabot não valem mais. <!-- ubiquitous -->
4. The README SHALL mandar enviar a `main` (`git push origin main`) depois do commit e antes de criar a tag. <!-- ubiquitous -->

**Independent Test**: Teste unitário que lê o README e o `package.json` e compara a URL; subir a versão sem tocar o README faz o teste falhar.

---

### P1: Licença ⭐ MVP

**User Story**: Como qualquer pessoa que encontra o repo público, quero saber sob que licença posso usar o código.

**Why P1**: Repo público sem licença não autoriza reuso.

**Acceptance Criteria**:

1. The repositório SHALL ter um arquivo `LICENSE` com o texto da licença escolhida e o titular do copyright. <!-- ubiquitous -->
2. The `package.json` SHALL declarar a licença no campo `license` com o identificador SPDX. <!-- ubiquitous -->
3. WHEN o pacote é empacotado THEN o tarball SHALL conter `LICENSE` e as licenças OFL das fontes. <!-- event-driven -->
4. The seção "Licenças" do README SHALL dizer que o código é MIT e que as fontes são OFL 1.1. <!-- ubiquitous -->

**Independent Test**: `npm pack --dry-run` lista `LICENSE` e `dist/fonts/LICENSE-*.txt`; publint não reclama.

---

### P2: Testes de consumidor no PR

**User Story**: Como mantenedor, quero que o PR rode os testes de consumidor, para que uma quebra no tarball apareça antes da tag.

**Why P2**: Sem isso, a quebra só aparece no workflow de release.

**Acceptance Criteria**:

1. WHEN um pull request é aberto ou atualizado THEN o workflow `pr.yml` SHALL rodar também os testes de consumidor. <!-- event-driven -->

**Independent Test**: Ler `pr.yml`; o primeiro PR no GitHub mostra o passo.

---

## Edge Cases

- IF a tag já tem release THEN o workflow SHALL falhar no passo de criação, sem substituir o arquivo anexado.
- IF a tag não segue `v<semver>` (por exemplo `vteste`) THEN a checagem SHALL falhar, porque a versão não bate com o `package.json`.

---

## Requirement Traceability

| Requirement ID | Story                              | Phase | Status   |
| -------------- | ---------------------------------- | ----- | -------- |
| REL-01         | P1: Release pela tag (AC 1)        | Tasks | Verified |
| REL-02         | P1: Release pela tag (AC 2)        | Tasks | Verified |
| REL-03         | P1: Release pela tag (AC 3)        | Tasks | Verified |
| REL-04         | P1: Release pela tag (AC 4)        | Tasks | Verified |
| REL-05         | P1: Release pela tag (AC 5)        | Tasks | Verified |
| REL-06         | P1: Release pela tag (AC 6)        | Tasks | Verified |
| REL-07         | P1: Release pela tag (AC 7)        | Tasks | Verified |
| REL-08         | Edge: release já existente         | Tasks | Verified |
| REL-09         | P1: Release pela tag (AC 8)        | Tasks | Verified |
| REL-10         | P1: Release pela tag (AC 9)        | Tasks | Verified |
| REL-11         | P1: Release pela tag (AC 10)       | Tasks | Verified |
| REL-12         | P1: Release pela tag (AC 11)       | Tasks | Verified |
| DOC-01         | P1: URL de instalação certa (AC 1) | Tasks | Verified |
| DOC-02         | P1: URL de instalação certa (AC 2) | Tasks | Verified |
| DOC-03         | P1: URL de instalação certa (AC 3) | Tasks | Verified |
| DOC-04         | P1: URL de instalação certa (AC 4) | Tasks | Verified |
| LIC-01         | P1: Licença (AC 1)                 | Tasks | Verified |
| LIC-02         | P1: Licença (AC 2)                 | Tasks | Verified |
| LIC-03         | P1: Licença (AC 3)                 | Tasks | Verified |
| LIC-04         | P1: Licença (AC 4)                 | Tasks | Verified |
| CI-01          | P2: Testes de consumidor no PR     | Tasks | Verified |

**Coverage:** 21 total, 21 mapped to tasks, 21 verified.

---

## Sources

- [PLANO.md](../../../PLANO.md) F3 e seção 6 - substituídos pela AD-001
- [.specs/STATE.md](../../STATE.md) AD-001 - distribuição pelo GitHub Release
- [README.md](../../../README.md) - URL de instalação já documentada

---

## Success Criteria

- [ ] Depois do push da tag `v0.1.0`, `npm install <URL do README>` instala o pacote num projeto novo.
- [ ] Nenhum passo da release usa token além do `GITHUB_TOKEN`.
