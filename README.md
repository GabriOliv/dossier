# @gabrioliv/dossier

Design system Dossier para React: componentes, tokens e CSS pronto, num único pacote. Usado pelo portfólio, pelo QA Garden e por qualquer outro projeto React, sem recriar estilo em cada repo.

**Galeria com todos os componentes, nos três temas: https://gabrioliv.github.io/dossier/**

- ESM, tipos TypeScript e CSS já montado (sem `@import` e sem PostCSS).
- React 18 ou 19 como `peerDependency`. Não depende de `react-dom`.
- Fontes IBM Plex locais (`woff2`): nenhum request ao Google Fonts.
- Funciona em SSR (build estático do Docusaurus incluído).

## Instalação

O pacote é instalado pelo GitHub, a partir do tarball anexado a cada release (o mesmo arquivo que `npm pack` gera):

```bash
npm install https://github.com/GabriOliv/dossier/releases/download/v0.1.0/gabrioliv-dossier-0.1.0.tgz
```

O `package.json` do projeto fica com a versão fixa na URL. Para atualizar, troque a versão nos dois lugares da URL e rode os testes do projeto.

## Uso

### Vite (ou outro bundler)

```tsx
import "@gabrioliv/dossier/styles.css";
import "@gabrioliv/dossier/base.css"; // opcional: só em app feito inteiro em Dossier
import { DataHeader, Readout } from "@gabrioliv/dossier";

export function Page() {
  return (
    <>
      <DataHeader title="Run 0427" code="File 0427 · Rev B" kicker="Section 01" />
      <Readout label="Pass rate" value="98.6" unit="%" tone="signal" />
    </>
  );
}
```

Tema: `data-theme="paper"` (padrão), `"void"` ou `"blueprint"` no `<html>` ou em qualquer bloco.

### Docusaurus

```ts
// docusaurus.config.ts, no preset classic
theme: {
  customCss: [require.resolve("@gabrioliv/dossier/docusaurus.css"), "./src/css/custom.css"],
},
```

```mdx
import { Readout } from "@gabrioliv/dossier";

<Readout label="Pass rate" value="98.6" unit="%" />
```

Paper e Void seguem o seletor claro/escuro do Docusaurus, e as variáveis do Infima (`--ifm-*`) passam a vir dos tokens. Blueprint fica disponível por trecho: `<div data-theme="blueprint">`.

## Entradas

| Import                                             | Conteúdo                                           | Quem usa                    |
| -------------------------------------------------- | -------------------------------------------------- | --------------------------- |
| `@gabrioliv/dossier`                               | Componentes e tipos                                | Todos                       |
| `@gabrioliv/dossier/styles.css`                    | Fontes, tokens e componentes, sem regra global     | Vite e outros               |
| `@gabrioliv/dossier/base.css`                      | `body`, `:focus-visible`, `color-scheme`           | Só app dedicado ao Dossier  |
| `@gabrioliv/dossier/docusaurus.css`                | `styles.css` + escuro → Void + variáveis do Infima | Docusaurus                  |
| `@gabrioliv/dossier/tokens.css`, `.../tokens.json` | Só os tokens                                       | Slides e outras ferramentas |
| `@gabrioliv/dossier/assets/*`                      | SVGs (estágios, banners, diagramas, animações)     | Quem precisar               |

As classes tipográficas têm prefixo: `.ds-t-display`, `.ds-t-title`, `.ds-t-figure`, `.ds-t-figure-xl`, `.ds-t-heading`, `.ds-t-body`, `.ds-t-caption`, `.ds-t-label` e `.ds-t-datum`. Para citar uma nota de rodapé, use `<sup class="ds-t-label ds-ref">01</sup>`.

## Componentes

`DataHeader`, `SectionTitle`, `Readout`, `Tag`, `DataTable`, `FieldList`, `Schematic`, `Hierarchy`, `Quote`, `Footnotes`, `StatusFlag`, `CheckLog` e `StageIcon`. As props e os exemplos estão na [galeria](https://gabrioliv.github.io/dossier/) e nos tipos do pacote. Os estágios de maturidade do QA Garden estão em [docs/maturity-stages.md](docs/maturity-stages.md).

## Desenvolvimento

Tudo roda no container `node` do [compose.yaml](compose.yaml) (imagem `mcr.microsoft.com/playwright:v1.64.1-noble`). Nada é instalado na máquina.

```bash
docker compose run --rm node npm ci                  # instalar
docker compose run --rm node npm test                # build, depois testes unitários (paridade, SSR em React 18 e 19, CSS, tokens)
docker compose run --rm node npm run test:consumer   # empacota e testa nos fixtures Vite e Docusaurus
docker compose run --rm node npm run build:gallery   # build da biblioteca e da galeria
docker compose run --rm node npm run test:gallery    # testes da galeria, desktop e celular
docker compose run --rm node npm run format          # checagem do Prettier
docker compose run --rm node npm pack --dry-run      # o que vai no pacote
```

- `source/` guarda a versão `1793668292-91b3` do artifact Dossier, só como referência (`cd source && sha256sum -c SHA256SUMS`). O `bundle.js` original, em `tests/fixtures/`, é o oráculo dos testes de paridade.
- Cada push na `main` publica a galeria no GitHub Pages ([gallery.yml](.github/workflows/gallery.yml)). Um teste falhando bloqueia o deploy.
- O plano completo da biblioteca está em [PLANO.md](PLANO.md).

## Release

Para cortar uma release:

1. Suba a `version` no `package.json` e na URL de instalação deste README.
2. Faça o commit na `main`.
3. Envie a `main`: `git push origin main`. O workflow só aceita uma tag cujo commit já está na `main` do GitHub.
4. Crie a tag: `git tag v<versão>`.
5. Envie a tag: `git push origin v<versão>`.

O workflow `.github/workflows/release.yml` confere se a tag bate com o `package.json` e se o commit está na `main`. Depois roda Prettier, build, testes unitários, publint e os testes de consumidor. Então anexa o tarball testado à GitHub Release e instala a URL pública para confirmar.

Uma execução manual (`workflow_dispatch`) roda build e testes e guarda o tarball como artifact. Ela não confere tag nem `main` e não cria release.

## Licenças

O código está sob a licença MIT (veja [LICENSE](LICENSE)).

As fontes IBM Plex são distribuídas sob a SIL Open Font License 1.1 (`dist/fonts/LICENSE-*.txt`).
