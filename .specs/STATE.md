# STATE

## Decisions

### AD-001

- **Decision**: O pacote é distribuído pelo tarball do `npm pack` anexado a cada GitHub Release, instalado por URL. Não há publicação no npm.
- **Reason**: Pedido do usuário em 2026-11-05 ("não precisa publicar no npm, vou instalar por github"). Instalar direto do git não traria `dist/`: ele não é versionado, e o npm 11.20 bloqueia por padrão o script `prepare` de dependências (`allow-scripts = [""]`).
- **Trade-off**: O Dependabot não atualiza dependências por URL, então atualizar é manual. A F3 do PLANO.md (npm publish, trusted publishing e provenance) deixa de valer, e o fluxo de versionamento da seção 6 perde o PR automático.
- **Scope**: Release, README, F3 a F6 e os consumidores (portfólio e Garden).
- **Date**: 2026-11-05
- **Status**: active

## Handoff
