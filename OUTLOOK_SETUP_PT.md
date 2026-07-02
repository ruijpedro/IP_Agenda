# Configurar Microsoft Outlook na IP_RJP

## 1. Entrar no Microsoft Entra

https://entra.microsoft.com

## 2. Criar aplicação

Entra ID → Registos de aplicações → Novo registo

Nome: IP_RJP

Tipos de contas: apenas este diretório organizacional, caso uses a conta da Infraestruturas de Portugal.

## 3. Authentication

Adicionar plataforma:

- Single-page application

Redirect URI para testes locais:

http://localhost:5173

Redirect URI para GitHub Pages:

https://ruijpedro.github.io/IP_RJP/

## 4. Permissões API

Microsoft Graph:

- User.Read
- Calendars.ReadWrite
- Tasks.ReadWrite
- Contacts.Read
- offline_access
- openid
- profile

Pode ser necessário consentimento do administrador da organização.

## 5. Copiar para a app

- Application / Client ID
- Directory / Tenant ID

Abrir Definições na IP_RJP e guardar.
