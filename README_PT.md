# IP_RJP — Agenda IP Hybrid Edition 4.2

Aplicação para registo profissional de deslocações, prevenções BT/CC, viaturas, horas de saída/chegada, relatórios mensais e agenda.

## O que mudou nesta versão

- WebApp continua a ligar ao Google com Google Identity Services.
- APK Android deixa de depender do Google Identity Services dentro da WebView.
- APK liga através do Google Apps Script URL.
- Exportação para agenda na APK cria eventos via CalendarApp no Apps Script.
- Consulta da agenda na APK lê eventos via Apps Script.
- Mantém registo local, PDF/relatório e dados de deslocações/prevenções.

## Configuração na WebApp

Preencher em Definições:

- Google Client ID
- Google API Key, se necessário
- Apps Script URL, opcional mas recomendado

## Configuração na APK

Preencher em Definições:

- Apps Script URL obrigatório
- Google Client ID não é necessário para o modo APK
- Google API Key não é necessário para o modo APK

O botão Ligar na APK testa a ligação ao Apps Script.

## Apps Script

Copiar o ficheiro:

`google-apps-script/Code.gs`

para um projeto Google Apps Script e publicar como Aplicação Web:

- Executar como: Eu
- Quem tem acesso: Qualquer pessoa

Depois copiar o URL terminado em `/exec` para o campo Apps Script URL.


## V5.1 - Apps Script Sync

- WebApp e APK usam o mesmo Apps Script URL.
- Agenda deixa de chamar diretamente a Google Calendar API quando existe Apps Script URL.
- Guardar registo envia para Google Sheets e cria evento no Google Calendar via Apps Script.
- Corrigido erro 401 Invalid Credentials no separador Agenda.
- Corrigido espaçamento superior na APK.
