# IP_RJP Agenda — Configuração Google / Gmail

## 1. Criar projeto na Google Cloud

1. Acede a https://console.cloud.google.com/
2. Cria um projeto novo, por exemplo: `IP_RJP_Agenda`.
3. Vai a **APIs e serviços > Biblioteca**.
4. Ativa estas APIs:
   - Google Calendar API
   - Gmail API
   - Google People API
   - Google Tasks API
   - Google Drive API
   - Google Sheets API

## 2. Configurar ecrã de consentimento OAuth

1. Vai a **APIs e serviços > Ecrã de consentimento OAuth**.
2. Escolhe **Externo** se for uma conta Gmail pessoal.
3. Nome da app: `IP_RJP Agenda`.
4. Email de suporte: o teu Gmail.
5. Adiciona o teu próprio Gmail em **Utilizadores de teste**.

## 3. Criar credenciais OAuth

1. Vai a **APIs e serviços > Credenciais**.
2. Clica em **Criar credenciais > ID de cliente OAuth**.
3. Tipo de aplicação: **Aplicação Web**.
4. Em **Origens JavaScript autorizadas**, adiciona:
   - `http://localhost:5173`
   - `https://localhost`
   - o URL da tua WebApp GitHub Pages, se usares
5. Copia o **Client ID**.
6. Cola esse valor em **Definições > Google Client ID** dentro da app.

## 4. Permissões usadas

A app pede permissões para:

- Ver perfil básico Google
- Ler/criar eventos no Google Calendar
- Ler/criar tarefas no Google Tasks
- Ler contactos Google
- Enviar email pelo Gmail
- Criar ficheiros no Drive
- Usar Google Sheets

## 5. Apps Script opcional

O campo **Apps Script URL** é opcional. Serve para sincronização avançada com Drive/Sheets, tal como nas tuas apps RJP Study, EBTCC, EDF Oeste e Família.
