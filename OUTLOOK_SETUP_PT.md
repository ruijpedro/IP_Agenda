# Configuração Outlook / Microsoft 365

1. Entrar em https://entra.microsoft.com
2. Ir a Registos de aplicações.
3. Criar novo registo: IP_RJP.
4. Copiar:
   - Application / Client ID
   - Directory / Tenant ID
5. Permissões Microsoft Graph previstas:
   - User.Read
   - Calendars.Read
   - Calendars.ReadWrite
   - offline_access
   - openid
   - profile

Nesta versão a interface está preparada. A ligação real ao Microsoft Graph será ativada quando tiveres o Client ID e Tenant ID.
