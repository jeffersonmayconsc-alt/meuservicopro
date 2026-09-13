import { expect, test } from '@playwright/test'

const routes = ['/', '/loja/clinica-vida-plena-p1', '/agendar/clinica-vida-plena-p1']
const viewports = [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 },
]

test.describe('layout spacing and alignment', () => {
  for (const route of routes) {
    for (const viewport of viewports) {
      test(`${route} has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
        await page.setViewportSize(viewport)
        await page.goto(route)
        await expect(page.locator('body')).toBeVisible()

        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(1)
      })
    }
  }

  test('visible controls do not overlap on public desktop pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })

    for (const route of routes) {
      await page.goto(route)
      const overlaps = await page.evaluate(() => {
        const controls = Array.from(document.querySelectorAll('button, a, input, select, textarea'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            const style = getComputedStyle(element)
            return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
          })
          .map((element) => {
            const rect = element.getBoundingClientRect()
            return { label: element.textContent?.trim() || element.getAttribute('aria-label') || element.tagName, rect }
          })

        const hits = []
        for (let index = 0; index < controls.length; index += 1) {
          for (let next = index + 1; next < controls.length; next += 1) {
            const first = controls[index].rect
            const second = controls[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) hits.push(`${controls[index].label} / ${controls[next].label}`)
          }
        }
        return hits
      })

      expect(overlaps, route).toEqual([])
    }
  })

  for (const viewport of [{ width: 760, height: 520 }, { width: 970, height: 420 }, { width: 1440, height: 520 }]) {
    test(`admin row fixture keeps controls aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
    await page.setContent(`
      <html>
        <head>
          <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
          <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
        </head>
        <body>
          <main class="workspace">
            <section class="panel adminSectionPanel">
              <div class="panelHeader compact">
                <div><p class="eyebrow">Gestão delegada</p><h2>Prestadores sob responsabilidade</h2></div>
              </div>
              <div class="providerRows">
                <article class="providerManagementRow">
                  <div class="providerManagementIdentity">
                    <strong>Clínica Vida Plena</strong>
                    <span>Marina · saúde · São Paulo</span>
                  </div>
                  <div class="providerManagementStatus">
                    <span class="fieldCaption">Status</span>
                    <button type="button" class="toggle on">Ativo</button>
                  </div>
                  <div class="providerManagementAccount">
                    <span class="fieldCaption">Conta de acesso</span>
                    <span class="ownerLinked">Vinculada</span>
                  </div>
                  <div class="providerManagementRepresentative">
                    <label class="fieldCaption">Responsável</label>
                    <div class="representativeTransferControl"><select><option>Admin master</option></select></div>
                  </div>
                  <button type="button" class="openProviderAction"><span>Abrir painel</span></button>
                </article>
                <article class="providerManagementRow representativeView">
                  <div class="providerManagementIdentity">
                    <strong>pinhodicorte</strong>
                    <span>fernando · barbearia · rj</span>
                  </div>
                  <div class="providerManagementStatus">
                    <span class="fieldCaption">Status</span>
                    <button type="button" class="toggle on">Ativo</button>
                  </div>
                  <div class="providerManagementAccount">
                    <span class="fieldCaption">Conta de acesso</span>
                    <span class="fieldCaption">Não vinculada</span>
                  </div>
                  <button type="button" class="openProviderAction"><span>Abrir painel</span></button>
                </article>
              </div>
            </section>
          </main>
        </body>
      </html>
    `)
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.providerManagementRow')).display === 'grid')

    const row = page.locator('.providerManagementRow').last()
    const status = row.locator('.providerManagementStatus')
    const action = row.locator('.openProviderAction')
    const account = row.locator('.providerManagementAccount')

    await expect(row).toBeVisible()
    await expect(status).toBeVisible()
    await expect(action).toBeVisible()

    const metrics = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.providerManagementRow'))
      const rowMetrics = rows.map((rowElement) => {
        const rectOf = (selector) => rowElement.querySelector(selector).getBoundingClientRect()
        const row = rowElement.getBoundingClientRect()
        const identity = rectOf('.providerManagementIdentity')
        const status = rectOf('.providerManagementStatus')
        const action = rectOf('.openProviderAction')
        const account = rectOf('.providerManagementAccount')
        return {
          representative: rowElement.classList.contains('representativeView'),
          actionInside: action.right <= row.right + 1,
          statusSeparated: status.right <= action.left - 10 || status.bottom <= action.top - 10 || action.bottom <= status.top - 10,
          accountSeparated: account.bottom <= status.top - 10 || status.bottom <= account.top - 10 || account.right <= status.left - 10 || status.right <= account.left - 10,
          accountBelowIdentity: account.top >= identity.top,
          rowHeight: row.height,
        }
      })
      return {
        rowMetrics,
        pageOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      }
    })

    expect(metrics.pageOverflow).toBeLessThanOrEqual(1)
    for (const item of metrics.rowMetrics) {
      expect(item.actionInside).toBe(true)
      expect(item.statusSeparated).toBe(true)
      expect(item.accountSeparated).toBe(true)
      if (item.representative) expect(item.accountBelowIdentity).toBe(true)
      expect(item.rowHeight).toBeGreaterThanOrEqual(80)
    }
    })
  }

  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`provider workspace fixture keeps sections aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
          </head>
          <body>
            <main class="workspace">
              <section class="panel providerSection">
                <div class="sectionTools">
                  <div><h3>Agenda</h3><span class="sectionSub">Atendimentos do dia</span></div>
                  <div class="agendaTools">
                    <div class="agendaDateNav"><button type="button">‹</button><input type="date"><button type="button">›</button></div>
                    <button class="secondaryAction" type="button">Bloquear horário</button>
                  </div>
                </div>
                <div class="scheduleBoard">
                  <article class="slotCard"><strong>09:00</strong><span>Disponível</span></article>
                  <article class="slotCard"><strong>10:00</strong><span>Cliente confirmado</span></article>
                  <article class="slotCard"><strong>11:00</strong><span>Disponível</span></article>
                  <article class="slotCard"><strong>14:00</strong><span>Bloqueado</span></article>
                </div>
              </section>
              <section class="panel providerSection">
                <div class="sectionTools">
                  <div><h3>Serviços</h3><span class="sectionSub">Lista pública</span></div>
                  <button class="secondaryAction" type="button">Adicionar serviço</button>
                </div>
                <article class="serviceEditor">
                  <div class="serviceEditorTop">
                    <label>Nome<input value="Corte masculino"></label>
                    <label>Duração<input value="45 min"></label>
                    <label>Preço<input value="R$ 45,00"></label>
                    <label>Status<select><option>Ativo</option></select></label>
                  </div>
                  <div class="serviceActions"><button type="button">Salvar</button><button type="button">Duplicar</button><button class="dangerButton" type="button">Remover</button></div>
                </article>
              </section>
              <section class="panel providerSection">
                <div class="shareBox">
                  <div><strong>Link da loja</strong><span>https://exemplo.local/loja/pinhodicorte</span></div>
                  <button type="button">Copiar</button>
                </div>
                <div class="analyticsSection">
                  <div class="funnelPanel">
                    <div class="funnelHeader"><h3>Funil</h3><strong>32%<small>conversão</small></strong></div>
                    <div class="funnelRows"><div><span>Visitas</span><div><i style="width:100%"></i></div><strong>120</strong></div></div>
                  </div>
                </div>
              </section>
            </main>
          </body>
        </html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.providerSection')).display === 'grid')

      const report = await page.evaluate(() => {
        const visible = Array.from(document.querySelectorAll('button, input, select, textarea, .slotCard, .serviceEditor, .shareBox, .funnelPanel'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          .map((element) => ({ element, selector: element.className || element.tagName, rect: element.getBoundingClientRect() }))
        const overlaps = []
        for (let index = 0; index < visible.length; index += 1) {
          for (let next = index + 1; next < visible.length; next += 1) {
            if (visible[index].element.contains(visible[next].element) || visible[next].element.contains(visible[index].element)) continue
            const first = visible[index].rect
            const second = visible[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) overlaps.push(`${visible[index].selector} / ${visible[next].selector}`)
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overlaps,
        }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }

  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`account admin representative fixtures keep spacing at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
          </head>
          <body>
            <main class="workspace">
              <section class="panel accountWorkspace">
                <div class="accountNotice success">Conta protegida</div>
                <div class="accountMetadata">
                  <span><strong>E-mail</strong>admin@teste.com</span>
                  <span><strong>Perfil</strong>Admin master</span>
                  <span><strong>Status</strong>Ativo</span>
                </div>
                <div class="sessionList">
                  <label class="sessionSelectAll"><input type="checkbox"> Selecionar sessões</label>
                  <article class="sessionRow">
                    <label class="sessionSelection"><input type="checkbox"></label>
                    <div class="sessionIcon">S</div>
                    <div><strong>Chrome Windows</strong><span>São Paulo · agora</span></div>
                    <small>Atual</small>
                  </article>
                </div>
                <div class="sessionActions"><button class="secondaryAction">Encerrar selecionadas</button><button class="dangerAction">Sair de tudo</button></div>
              </section>
              <section class="panel adminSectionPanel">
                <div class="settingsGrid">
                  <label>Nome da marca<input value="Meu Serviço Online"></label>
                  <label>Cor principal<input value="#d4aa00"></label>
                  <label>Modo<select><option>Claro</option></select></label>
                </div>
                <div class="policySwitches">
                  <label class="checkLabel"><input type="checkbox"> Permitir cadastro público</label>
                  <label class="checkLabel"><input type="checkbox"> Exigir aprovação</label>
                </div>
              </section>
              <section class="panel representativeWorkspace">
                <div class="representativeContextPanel">
                  <div class="panelHeader compact"><div><p class="eyebrow">Representante</p><h2>Visão geral</h2></div></div>
                  <label class="representativeSelector">Carteira<select><option>Todos</option></select></label>
                </div>
                <div class="metricGrid representativeMetrics">
                  <div class="stat"><span>1</span><strong>Ativos</strong><small>Carteira</small></div>
                  <div class="stat"><span>2</span><strong>Convites</strong><small>Pendentes</small></div>
                </div>
                <div class="representativeInviteList">
                  <article><div><strong>barbearia@teste.com</strong><span>Enviado hoje</span></div><span>pendente</span></article>
                </div>
              </section>
            </main>
          </body>
        </html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.accountWorkspace')).display === 'grid')

      const report = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, input, select, textarea, .panel, .stat, .sessionRow, .representativeInviteList article'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          .map((element) => ({ element, label: element.className || element.tagName, rect: element.getBoundingClientRect() }))
        const overlaps = []
        for (let index = 0; index < items.length; index += 1) {
          for (let next = index + 1; next < items.length; next += 1) {
            if (items[index].element.contains(items[next].element) || items[next].element.contains(items[index].element)) continue
            const first = items[index].rect
            const second = items[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) overlaps.push(`${items[index].label} / ${items[next].label}`)
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overlaps,
        }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }

  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`store editor fixture keeps preview and form aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
          </head>
          <body>
            <main class="workspace">
              <section class="inviteEditor">
                <div class="inviteEditorForm">
                  <section class="storeSetupSummary">
                    <div><p class="eyebrow">Minha loja</p><h3>Sua página pronta para vender</h3><span>3 de 4 pontos principais completos</span></div>
                    <div class="storeSetupChips"><span class="done">Nome e logo</span><span class="done">Serviços</span><span>Foto principal</span></div>
                  </section>
                  <div class="profileTabs"><button class="active">Loja</button><button>Fotos e textos</button><button>Equipe</button><button>Confiança</button><button>Compartilhar</button></div>
                  <div class="inlineFields">
                    <label>Nome do negócio<input value="Pinho do Corte"></label>
                    <label>Categoria<input value="Barbearia"></label>
                  </div>
                  <div class="logoUploader">
                    <div class="logoPreview"></div>
                    <input type="file">
                    <button type="button">Remover</button>
                  </div>
                  <details class="collapsibleBlock" open>
                    <summary>Mais detalhes</summary>
                    <div class="highlightEditor">
                      <label>Texto da loja<textarea>Atendimento profissional com horário marcado.</textarea></label>
                    </div>
                  </details>
                  <div class="saveRow"><span class="unsavedNotice">Alterações não salvas</span><button>Salvar alterações</button></div>
                </div>
                <aside class="landingPreview previewTab-identidade">
                  <div class="landingPreviewHeader"><div><p class="eyebrow">Prévia</p><h3>Seção atual da página</h3></div><a href="#">Abrir link real</a></div>
                  <div class="landingPreviewCanvas profissional">
                    <div class="landingPreviewHero previewIdentity">
                      <div class="inviteLogo"></div>
                      <div><span>Barbearia</span><h4>Pinho do Corte</h4><p>Agende seu horário online.</p><strong>Atendimento por agenda</strong><button>Agendar agora</button></div>
                    </div>
                    <p class="landingPreviewText previewVitrine">Texto da vitrine</p>
                  </div>
                </aside>
              </section>
            </main>
          </body>
        </html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.inviteEditor')).display === 'grid')

      const report = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, input, select, textarea, a, .storeSetupSummary, .profileTabs, .logoUploader, .collapsibleBlock, .landingPreview, .landingPreviewHero'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          .map((element) => ({ element, label: element.className || element.tagName, rect: element.getBoundingClientRect() }))
        const overlaps = []
        for (let index = 0; index < items.length; index += 1) {
          for (let next = index + 1; next < items.length; next += 1) {
            if (items[index].element.contains(items[next].element) || items[next].element.contains(items[index].element)) continue
            const first = items[index].rect
            const second = items[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) overlaps.push(`${items[index].label} / ${items[next].label}`)
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overlaps,
        }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }

  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`finance fixture keeps metrics and rows aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
          </head>
          <body>
            <main class="workspace">
              <section class="panel adminSectionPanel">
                <div class="panelHeader compact"><div><p class="eyebrow">Financeiro interno</p><h2>Contabilidade</h2></div></div>
                <div class="profileTabs"><button class="active">Resumo</button><button>Lançamentos</button></div>
                <label class="compactSelect">Período<select><option>Mês atual</option></select></label>
                <div class="metricGrid">
                  <div class="stat"><span>↗</span><strong>R$ 1.200,00</strong><small>Receita do período</small></div>
                  <div class="stat"><span>!</span><strong>R$ 300,00</strong><small>Despesas do período</small></div>
                  <div class="stat"><span>▣</span><strong>R$ 900,00</strong><small>Margem</small></div>
                </div>
                <div class="panel">
                  <h3>Calculadora de CAC (tráfego pago)</h3>
                  <p class="privacyHint">Soma despesas lançadas no período selecionado.</p>
                  <label>Novos prestadores pagantes<input type="number" value="3"></label>
                  <div class="parameterSummary"><span>Despesas em tráfego pago: R$ 300,00</span><span>CAC estimado: R$ 100,00</span></div>
                </div>
                <form class="nestedForm">
                  <label>Tipo<select><option>Receita</option></select></label>
                  <label>Categoria<select><option>Assinatura</option></select></label>
                  <label>Descrição<input value="Plano mensal"></label>
                  <label>Valor<input value="1200"></label>
                  <label>Data<input type="date"></label>
                  <button type="button">Adicionar lançamento</button>
                </form>
                <div class="requestList">
                  <article class="requestRow">
                    <div>
                      <select><option>Receita</option></select>
                      <select><option>Assinatura</option></select>
                      <input value="Plano mensal">
                      <input value="1200">
                      <input type="date">
                    </div>
                    <div class="shareActions"><button class="dangerButton" type="button">Remover</button></div>
                  </article>
                </div>
              </section>
            </main>
          </body>
        </html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.adminSectionPanel')).display === 'grid')

      const report = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, input, select, textarea, .panel, .stat, .requestRow, .nestedForm, .profileTabs, .compactSelect'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          .map((element) => ({ element, label: element.className || element.tagName, rect: element.getBoundingClientRect() }))
        const overlaps = []
        for (let index = 0; index < items.length; index += 1) {
          for (let next = index + 1; next < items.length; next += 1) {
            if (items[index].element.contains(items[next].element) || items[next].element.contains(items[index].element)) continue
            const first = items[index].rect
            const second = items[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) overlaps.push(`${items[index].label} / ${items[next].label}`)
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overlaps,
        }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }

  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`shell navigation fixture keeps spacing at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html>
          <head>
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
            <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
          </head>
          <body>
            <section class="shell">
              <aside class="sidebar">
                <div class="brand sidebarBrand"><div class="brandMark"></div><div><strong>Meu Serviço Online</strong><span>Gestão de agenda</span></div></div>
                <div class="currentArea"><span>●</span><div><span>Área atual</span><strong>Administrador master com nome grande</strong></div></div>
                <div class="sidebarAccountBar">
                  <button class="sidebarIdentity"><span class="onlineDot"></span><div><strong>Admin master</strong><span>admin@teste.com</span></div></button>
                  <div class="sidebarQuickActions"><button>A</button><button>S</button></div>
                </div>
                <nav class="nav">
                  <button class="active">Admin</button>
                  <div class="navSubList open"><div class="navSubListInner"><button>Visão geral</button><button>Prestadores</button><button>Configurações</button></div></div>
                  <span class="navGroupLabel">Visualizar como</span>
                  <button>Prestador</button>
                  <button>Representante</button>
                </nav>
              </aside>
              <main class="workspace">
                <header class="topbar">
                  <div><p class="eyebrow">Administração</p><h1>Visão geral</h1></div>
                  <button class="secondaryAction">Ação principal</button>
                </header>
                <div class="summary">
                  <div class="stat"><span>1</span><strong>Prestadores</strong><small>Ativos</small></div>
                  <div class="stat"><span>2</span><strong>Clientes</strong><small>Total</small></div>
                  <div class="stat"><span>3</span><strong>Agendas</strong><small>Hoje</small></div>
                </div>
              </main>
            </section>
          </body>
        </html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.shell')).display === 'grid')

      const report = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('button, .sidebar, .workspace, .topbar, .summary, .stat, .currentArea, .sidebarAccountBar, .navSubListInner'))
          .filter((element) => {
            const rect = element.getBoundingClientRect()
            return rect.width > 0 && rect.height > 0
          })
          .map((element) => ({ element, label: element.className || element.tagName, rect: element.getBoundingClientRect() }))
        const overlaps = []
        for (let index = 0; index < items.length; index += 1) {
          for (let next = index + 1; next < items.length; next += 1) {
            if (items[index].element.contains(items[next].element) || items[next].element.contains(items[index].element)) continue
            const first = items[index].rect
            const second = items[next].rect
            const horizontal = Math.min(first.right, second.right) - Math.max(first.left, second.left)
            const vertical = Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top)
            if (horizontal > 2 && vertical > 2) overlaps.push(`${items[index].label} / ${items[next].label}`)
          }
        }
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          overlaps,
        }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }
})

test.describe('secondary surfaces spacing', () => {
  for (const viewport of [{ width: 390, height: 900 }, { width: 900, height: 760 }, { width: 1440, height: 900 }]) {
    test(`privacy, clients and public content stay aligned at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.setContent(`
        <html><head>
          <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
          <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
        </head><body><main class="workspace">
          <section class="panel privacyPanel governancePanel">
            <div class="panelHeader compact"><div><p class="eyebrow">Privacidade</p><h2>Solicitacoes</h2></div><button>Exportar</button></div>
            <p class="privacyHint">Controle de dados e consentimentos.</p>
            <article class="requestRow"><div><strong>Cliente exemplo</strong><span>Exclusao de dados</span></div><small>Pendente</small></article>
          </section>
          <section class="panel clientList">
            <h3>Clientes</h3>
            <article class="clientRow"><div><strong>Maria Silva</strong><span>maria@example.com</span><small>Ultimo atendimento: hoje</small></div><div class="clientHealth"><span class="health ativo">Ativo</span><button class="contactAction">Entrar em contato</button></div></article>
          </section>
          <section class="panel publicResourcesPanel">
            <div class="publicResourceGrid"><article><strong>Guia de preparo</strong><p>Orientacoes antes do atendimento.</p></article><article><strong>Cuidados</strong><p>Informacoes para depois do atendimento.</p></article></div>
            <div class="testimonialGrid"><article><strong>Ana</strong><span>5 estrelas</span><p>Atendimento pontual e cuidadoso.</p></article><article><strong>Paulo</strong><span>5 estrelas</span><p>Experiencia excelente.</p></article></div>
          </section>
        </main></body></html>
      `)
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.privacyPanel')).display === 'grid')

      const report = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('button, .requestRow, .clientRow, .publicResourceGrid article, .testimonialGrid article'))
          .filter((element) => element.getBoundingClientRect().width > 0)
        const overlaps = []
        for (let index = 0; index < elements.length; index += 1) {
          for (let next = index + 1; next < elements.length; next += 1) {
            if (elements[index].contains(elements[next]) || elements[next].contains(elements[index])) continue
            const first = elements[index].getBoundingClientRect()
            const second = elements[next].getBoundingClientRect()
            if (Math.min(first.right, second.right) - Math.max(first.left, second.left) > 2 && Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top) > 2) overlaps.push(true)
          }
        }
        return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, overlaps }
      })

      expect(report.overflow).toBeLessThanOrEqual(1)
      expect(report.overlaps).toEqual([])
    })
  }
})

test('system state keeps brand and message on the same mobile axis', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.setContent(`
    <html><head>
      <link rel="stylesheet" href="http://127.0.0.1:5173/src/index.css">
      <link rel="stylesheet" href="http://127.0.0.1:5173/src/App.css">
    </head><body><main class="loginShell"><section class="loginPanel systemStatePanel">
      <div class="brand loginBrand"><div class="brandMark">A</div><div><strong>Meu Servico Online</strong><span>Carregando dados...</span></div></div>
      <p class="loginCopy">Conectando ao banco de dados. Isso leva so um instante.</p>
    </section></main></body></html>
  `)

  const positions = await page.evaluate(() => ({
    brand: document.querySelector('.loginBrand').getBoundingClientRect().left,
    message: document.querySelector('.loginCopy').getBoundingClientRect().left,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))

  expect(Math.abs(positions.brand - positions.message)).toBeLessThanOrEqual(1)
  expect(positions.overflow).toBeLessThanOrEqual(1)
})
