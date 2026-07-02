# IP_RJP Outlook Edition 4.0

Aplicação focada apenas na integração com Microsoft Outlook / Microsoft 365:

- Agenda Outlook
- Tarefas Microsoft To Do
- Contactos Outlook
- Atividades IP_RJP exportáveis para Outlook

## Dados da aplicação

IP_RJP

Autor  
Rui Jorge Pedro

Infraestruturas de Portugal

© 2026

## Configuração

1. Criar registo da aplicação no Microsoft Entra.
2. Copiar Application/Client ID.
3. Copiar Directory/Tenant ID.
4. Na app, abrir Definições e preencher os campos.
5. Clicar em Ligar.

## Permissões Microsoft Graph

- User.Read
- Calendars.ReadWrite
- Tasks.ReadWrite
- Contacts.Read
- offline_access
- openid
- profile

## GitHub

Fazer upload dos ficheiros soltos para o repositório. Depois executar:

- Build WebApp
- Build Android APK

## Correção de ícone Android 4.1

Esta versão inclui os ícones completos em `public/icons/android/`:

- `mipmap-mdpi`
- `mipmap-hdpi`
- `mipmap-xhdpi`
- `mipmap-xxhdpi`
- `mipmap-xxxhdpi`
- `mipmap-anydpi-v26`

O workflow `build-android.yml` recria a plataforma Android e copia todos os ícones antes de compilar a APK, evitando o ícone genérico.

Depois de instalar a nova APK no telemóvel, desinstala primeiro a APK antiga para limpar a cache do launcher Android.
